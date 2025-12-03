import { Injectable } from "@nestjs/common";
import { MongoModelsService } from "../../../models/mongo/mongo.service";
import { ConfigService } from "@nestjs/config";
import { func } from "../../../shared/utils";

@Injectable()
export class PageService {
  private cfg: any;
  constructor(
    private readonly mongo: MongoModelsService,
    private readonly config: ConfigService
  ) {
    this.cfg = this.config.get('microservices.frontend-monitor');
  }

  async getAveragePageList(query: any) {
    const {
      appId,
      type = "",
      pageNo = 1,
      pageSize = this.cfg.pageSize,
      url,
      is_first_in = 1,
    } = query;
    const match: any = { is_first_in: Number(is_first_in) };
    func.setMatchTime(query, match);
    if (type) match.speed_type = Number(type);
    if (url) match.url = { $regex: new RegExp(url, "i") };
    const group_id = { url: "$url" };
    return url
      ? await this.oneThread(
          appId,
          match,
          Number(pageNo),
          Number(pageSize),
          group_id
        )
      : await this.getPages(appId, match, Number(pageNo), Number(pageSize));
  }

  private async getPages(
    appId: string,
    match: any,
    pageNo: number,
    pageSize: number
  ) {
    const model = this.mongo.WebPage(appId);
    const distinct =
      (await model.distinct("url", match).read("secondaryPreferred").exec()) ||
      [];
    const copdistinct = distinct.slice();
    const slice = distinct.slice(
      (pageNo - 1) * pageSize,
      (pageNo - 1) * pageSize + pageSize
    );
    const jobs = slice.map((url: string) =>
      this.mongo
        .WebPage(appId)
        .aggregate([
          { $match: { ...match, url } },
          {
            $group: {
              _id: { url: "$url" },
              count: { $sum: 1 },
              load_time: { $avg: "$load_time" },
              dns_time: { $avg: "$dns_time" },
              tcp_time: { $avg: "$tcp_time" },
              white_time: { $avg: "$white_time" },
              request_time: { $avg: "$request_time" },
              analysisDom_time: { $avg: "$analysisDom_time" },
            },
          },
        ])
        .read("secondaryPreferred")
        .exec()
    );
    const all = await Promise.all(jobs);
    const result = all.map((item) => item?.[0]).filter(Boolean);
    return { datalist: result, totalNum: copdistinct.length, pageNo };
  }

  private async oneThread(
    appId: string,
    match: any,
    pageNo: number,
    pageSize: number,
    group_id: any
  ) {
    const count = await this.mongo
      .WebPage(appId)
      .distinct("url", match)
      .read("secondaryPreferred")
      .exec();
    const datalist = await this.mongo
      .WebPage(appId)
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: group_id,
            count: { $sum: 1 },
            load_time: { $avg: "$load_time" },
            dns_time: { $avg: "$dns_time" },
            tcp_time: { $avg: "$tcp_time" },
            dom_time: { $avg: "$dom_time" },
            white_time: { $avg: "$white_time" },
            request_time: { $avg: "$request_time" },
            analysisDom_time: { $avg: "$analysisDom_time" },
            ready_time: { $avg: "$ready_time" },
          },
        },
        { $skip: (pageNo - 1) * pageSize },
        { $sort: { count: -1 } },
        { $limit: pageSize },
      ])
      .read("secondaryPreferred")
      .exec();
    return { datalist, totalNum: count.length, pageNo };
  }

  async getRealTimeAveragePageList(query: any) {
    const { appId, type = "", beginTime, endTime } = query;
    const match: any = { is_first_in: 2 };
    if (type) match.speed_type = Number(type);
    const _querys: any = this.getSpaceTime(beginTime, endTime, 60000);
    const result = await this.mongo
      .WebPage(appId)
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              year: { $year: "$create_time" },
              dayOfMonth: { $dayOfMonth: "$create_time" },
              month: { $month: "$create_time" },
              hour: { $hour: "$create_time" },
              interval: {
                $subtract: [
                  { $minute: "$create_time" },
                  { $mod: [{ $minute: "$create_time" }, 1] },
                ],
              },
            },
            count: { $sum: 1 },
            create_time: { $addToSet: "$create_time" },
            load_time: { $avg: "$load_time" },
            dns_time: { $avg: "$dns_time" },
            tcp_time: { $avg: "$tcp_time" },
            white_time: { $avg: "$white_time" },
            request_time: { $avg: "$request_time" },
            analysisDom_time: { $avg: "$analysisDom_time" },
          },
        },
        {
          $project: {
            count: "$count",
            create_time: { $slice: ["$create_time", 0, 1] },
            load_time: "$load_time",
            dns_time: "$dns_time",
            tcp_time: "$tcp_time",
            white_time: "$white_time",
            request_time: "$request_time",
            analysisDom_time: "$analysisDom_time",
          },
        },
      ])
      .read("secondaryPreferred")
      .exec();
    for (let i = 0; i < _querys.length; i++) {
      for (let r_i = 0; r_i < result.length; r_i++) {
        const rDate = new Date(result[r_i].create_time).getTime();
        if (rDate > _querys[i].beginTime && rDate < _querys[i].endTime) {
          _querys[i].result = result[r_i];
          result.splice(r_i, 1);
          break;
        }
      }
      if (!result.length) break;
    }
    return _querys.map((item) => ({
      beginTime: func.format(new Date(item.beginTime), "yyyy/MM/dd hh:mm"),
      endTime: func.format(new Date(item.endTime), "yyyy/MM/dd hh:mm"),
      count: item.result ? item.result.count : 0,
      dns_time: item.result ? item.result.dns_time : 0,
      load_time: item.result ? item.result.load_time : 0,
      request_time: item.result ? item.result.request_time : 0,
      tcp_time: item.result ? item.result.tcp_time : 0,
      white_time: item.result ? item.result.white_time : 0,
    }));
  }

  async getOnePageList(query: any) {
    const {
      appId,
      type,
      pageNo = 1,
      pageSize = this.cfg.pageSize,
      url,
      firstIn = 2,
      beginTime,
      endTime,
    } = query;
    const match: any = { url, is_first_in: Number(firstIn) };
    if (type) match.speed_type = Number(type);
    if (beginTime && endTime)
      match.create_time = {
        $gte: new Date(beginTime),
        $lte: new Date(endTime),
      };
    const count = await this.mongo
      .WebPage(appId)
      .count(match)
      .read("secondaryPreferred")
      .exec();
    const datalist = await this.mongo
      .WebPage(appId)
      .aggregate([
        { $match: match },
        { $sort: { create_time: -1 } },
        { $skip: (Number(pageNo) - 1) * Number(pageSize) },
        { $limit: Number(pageSize) },
      ])
      .read("secondaryPreferred")
      .exec();
    return { datalist, totalNum: count, pageNo: Number(pageNo) };
  }

  async getPageDetails(appId: string, id: string) {
    return await this.mongo
      .WebPage(appId)
      .findOne({ _id: id })
      .read("secondaryPreferred")
      .exec();
  }

  private getSpaceTime(
    beginTime?: string,
    endTime?: string,
    spaceTime = 60000
  ) {
    const begin = new Date(beginTime || new Date()).getTime();
    const end = new Date(endTime || new Date()).getTime();
    const list: any = [];
    for (let t = begin; t <= end; t += spaceTime) {
      list.push({ beginTime: t, endTime: t + spaceTime, result: null });
    }
    return list;
  }
}
