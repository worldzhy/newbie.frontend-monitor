// ts:src/modules/web/services/pvuvip.service.ts
import { Injectable } from "@nestjs/common";
import { MongoModelsService } from "../../../models/mongo/mongo.service";
import { ClickhouseService } from "../../../models/clickhouse/clickhouse.service";
import { DayReportNumService } from "../../../modules/day-report/day-report-num.service";
import { func } from "../../../shared/utils";

@Injectable()
export class PvuvipService {
  constructor(
    private readonly mongo: MongoModelsService,
    private readonly ch: ClickhouseService,
    private readonly dayReportNum: DayReportNumService
  ) {}

  async getPvUvIpData(appId: string, beginTime: Date, endTime: Date) {
    return await this.mongo
      .WebPvuvip()
      .find({
        app_id: appId,
        type: 1,
        create_time: { $gte: beginTime, $lte: endTime },
      })
      .read("secondaryPreferred")
      .exec();
  }

  async getHistoryPvUvIplist(appId: string) {
    const data = await this.mongo
      .WebPvuvip()
      .find({ app_id: appId, type: 2 })
      .read("secondaryPreferred")
      .sort({ create_time: -1 })
      .limit(5)
      .exec();
    const result = data.map(async (item: any) => {
      const obj = JSON.parse(JSON.stringify(item));
      if (item.create_time) {
        const num = await this.dayReportNum.getDayFromMongo(
          item.app_id,
          item.create_time,
          item.create_time
        );
        obj.num = num.num;
      }
      return obj;
    });
    return await Promise.all(result);
  }

  async getPvUvIpSurveyOne(appId: string, beginTime: Date, endTime: Date) {
    const query = {
      app_id: appId,
      type: 2,
      create_time: { $gte: beginTime, $lte: endTime },
    };
    let num: string | number = 0;
    if (
      new Date().valueOf() >= beginTime.valueOf() &&
      new Date().valueOf() < endTime.valueOf()
    ) {
      const today = new Date(func.format(new Date(), "yyyy/MM/dd")).getTime();
      num = await this.dayReportNum.getTodayFromRedis(appId, today);
    } else {
      const numResult = await this.dayReportNum.getDayFromMongo(
        appId,
        beginTime,
        endTime
      );
      num = numResult.num;
    }
    const data = await this.mongo
      .WebPvuvip()
      .findOne(query)
      .read("secondaryPreferred")
      .exec();
    if (data) {
      const obj: any = data.toObject();
      obj.num = num;
      return obj;
    }
    const pvuvipdata = await this.getPvUvIpSurvey(
      appId,
      beginTime,
      endTime,
      true
    );
    const result = await this.savePvUvIpData(appId, beginTime, 2, pvuvipdata);
    return result;
  }

  async getPvUvIpSurvey(
    appId: string,
    beginTime: Date,
    endTime: Date,
    history = false
  ) {
    const $match = this.getMatch(beginTime, endTime);
    const querydata = { ...$match };
    const pvPro = Promise.resolve(this.pv(appId, querydata));
    const uvPro = Promise.resolve(this.uv(appId, querydata));
    const ipPro = Promise.resolve(this.ip(appId, querydata));
    const ajaxPro = Promise.resolve(this.ajax(appId, { beginTime, endTime }));
    const flowPro = Promise.resolve(this.flow(appId, { beginTime, endTime }));

    if (!history) {
      const data = await Promise.all([pvPro, uvPro, ipPro, ajaxPro, flowPro]);
      return {
        pv: data[0] || 0,
        uv: data[1]?.[0]?.count || 0,
        ip: data[2]?.[0]?.count || 0,
        ajax: data[3] || 0,
        flow: data[4] || 0,
      };
    } else {
      const userPro = Promise.resolve(this.user(appId, querydata));
      const bouncePro = Promise.resolve(this.bounce(appId, querydata));
      const data = await Promise.all([pvPro, uvPro, ipPro, ajaxPro, userPro, bouncePro, flowPro]);
      return {
        pv: data[0] || 0,
        uv: data[1]?.[0]?.count || 0,
        ip: data[2]?.[0]?.count || 0,
        ajax: data[3] || 0,
        user: data[4]?.[0]?.count || 0,
        bounce: data[5] || 0,
        flow: data[6] || 0,
      };
    }
  }

  async savePvUvIpData(
    appId: string,
    endTime: Date,
    type: number,
    pvuvipdata: any
  ) {
    const pvuvipModel = this.mongo.WebPvuvip();
    const pvuvip = new pvuvipModel();
    pvuvip.app_id = appId;
    pvuvip.pv = pvuvipdata.pv || 0;
    pvuvip.uv = pvuvipdata.uv || 0;
    pvuvip.ip = pvuvipdata.ip || 0;
    pvuvip.ajax = pvuvipdata.ajax || 0;
    pvuvip.flow = pvuvipdata.flow || 0;
    pvuvip.bounce = pvuvipdata.bounce
      ? ((pvuvipdata.bounce / pvuvipdata.pv) * 100).toFixed(2) + "%"
      : 0;
    pvuvip.depth =
      pvuvipdata.pv && pvuvipdata.user
        ? Math.floor(pvuvipdata.pv / pvuvipdata.user)
        : 0;
    pvuvip.create_time = endTime;
    pvuvip.type = type;
    return await pvuvip.save();
  }

  getMatch(beginTime?: Date | string, endTime?: Date | string) {
    const $match: any = {};
    const create_time: any = {};
    if (beginTime) { create_time.$gte = new Date(beginTime as any); $match.create_time = create_time; }
    if (endTime) { create_time.$lte = new Date(endTime as any); $match.create_time = create_time; }
    return $match;
  }

  async pv(appId: string, querydata: any) {
    return this.mongo.WebPage(appId).count(querydata).read("secondaryPreferred").exec();
  }

  async ajax(appId: string, times: { beginTime: Date | string; endTime: Date | string }) {
    const beginStr = func.format(new Date(times.beginTime), "yyyy/MM/dd hh:mm:ss");
    const endStr = func.format(new Date(times.endTime), "yyyy/MM/dd hh:mm:ss");
    const model = await this.ch.WebAjax(appId);
    const rows = await model.find({ select: "count() as count", where: `create_time>=toDateTime('${beginStr}') and create_time<=toDateTime('${endStr}')` });
    return rows?.[0]?.count || 0;
  }

  async uv(appId: string, querydata: any) {
    return this.mongo.WebEnvironment(appId).aggregate([
      { $match: querydata },
      { $group: { _id: { mark_uv: "$mark_uv", uid: "$uid", phone: "$phone" } } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]).read("secondaryPreferred").exec();
  }

  async ip(appId: string, querydata: any) {
    return this.mongo.WebEnvironment(appId).aggregate([
      { $match: querydata },
      { $project: { ip: true } },
      { $group: { _id: "$ip" } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]).read("secondaryPreferred").exec();
  }

  async user(appId: string, querydata: any) {
    return this.mongo.WebEnvironment(appId).aggregate([
      { $match: querydata },
      { $project: { mark_user: true } },
      { $group: { _id: "$mark_user" } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]).read("secondaryPreferred").exec();
  }

  async bounce(appId: string, $match: any) {
    const result = await this.mongo.WebEnvironment(appId).aggregate([
      { $match },
      { $group: { _id: { mark_user: "$mark_user" }, urls: { $push: 1 }, count: { $sum: 1 } } },
      { $match: { count: 1 } },
      { $count: "bounce" }
    ]).read("secondaryPreferred").exec();
    return result?.[0]?.bounce || 0;
  }

  async flow(appId: string, times: { beginTime: Date | string; endTime: Date | string }) {
    const beginStr = func.format(new Date(times.beginTime), "yyyy/MM/dd hh:mm:ss");
    const endStr = func.format(new Date(times.endTime), "yyyy/MM/dd hh:mm:ss");
    const model = await this.ch.WebAjax(appId);
    const rows = await model.find({ select: "sum(decoded_body_size) as sum", where: `create_time>=toDateTime('${beginStr}') and create_time<=toDateTime('${endStr}')` });
    return rows?.[0]?.sum || 0;
  }
}
