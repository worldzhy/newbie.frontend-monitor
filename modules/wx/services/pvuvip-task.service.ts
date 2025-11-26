// src/modules/wx/services/pvuvip-task.service.ts
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SystemService } from "../../../modules/system/system.service";
import { MongoModelsService } from "../../../models/mongo/mongo.service";
import { ClickhouseService } from "../../../models/clickhouse/clickhouse.service";
import { func } from "../../../shared/utils";

function cronMinuteInterval(cronExp: string) {
  const m = cronExp.split(" ")[1] || "*/2";
  const match = m.match(/\*\/(\d+)/);
  const step = match ? Number(match[1]) : 2;
  return step * 60000;
}

@Injectable()
export class WxPvuvipTaskService {
  private cfg: any;
  constructor(
    private readonly config: ConfigService,
    private readonly system: SystemService,
    private readonly mongo: MongoModelsService,
    private readonly ch: ClickhouseService
  ) {
    this.cfg = this.config.get('microservices.frontend-monitor');
  }

  async getWxPvUvIpByMinute() {
    const between = cronMinuteInterval(this.cfg.pvuvip_task_minute_cron_time);
    const endTime = new Date();
    const beginTime = new Date(endTime.getTime() - between);
    const systems = await this.system.getWxSystemList();
    if (!systems || !systems.length) return;
    const jobs = systems.map(async (sys: any) => {
      const appId = sys.app_id;
      if (!appId || sys.is_use !== 0) return;
      const pv = await this.mongo
        .WxPage(appId)
        .count({ create_time: { $gte: beginTime, $lte: endTime } })
        .read("secondaryPreferred")
        .exec();
      const uvRows = await this.mongo
        .WxPage(appId)
        .aggregate([
          { $match: { create_time: { $gte: beginTime, $lte: endTime } } },
          { $group: { _id: { mark_uv: "$mark_uv" }, count: { $sum: 1 } } },
        ])
        .read("secondaryPreferred")
        .exec();
      const ipRows = await this.mongo
        .WxPage(appId)
        .aggregate([
          { $match: { create_time: { $gte: beginTime, $lte: endTime } } },
          { $group: { _id: { ip: "$ip" }, count: { $sum: 1 } } },
        ])
        .read("secondaryPreferred")
        .exec();
      const beginStr = func.format(beginTime, "yyyy/MM/dd hh:mm:ss");
      const endStr = func.format(endTime, "yyyy/MM/dd hh:mm:ss");
      const ajaxModel = await this.ch.WxAjax(appId);
      const ajaxRows = await ajaxModel.find({
        select: "count() as count",
        where: `create_time>=toDateTime('${beginStr}') and create_time<=toDateTime('${endStr}')`,
      });
      const ajax = ajaxRows?.[0]?.count || 0;
      const pvuvipModel = this.mongo.WxPvuvip();
      const row = new pvuvipModel();
      row.app_id = appId;
      row.pv = pv || 0;
      row.uv = uvRows?.length
        ? uvRows[0].count
          ? uvRows.length
          : uvRows.length
        : 0;
      row.ip = ipRows?.length
        ? ipRows[0].count
          ? ipRows.length
          : ipRows.length
        : 0;
      row.ajax = ajax || 0;
      row.flow = 0;
      row.type = 1;
      row.create_time = endTime;
      await row.save();
    });
    await Promise.all(jobs);
  }
}
