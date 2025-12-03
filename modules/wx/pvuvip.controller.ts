import { Controller, Get, Query } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { func } from "../../shared/utils";
import { WxPvuvipService } from "./services/pvuvip.service";
import { DayReportNumService } from "../../modules/day-report/day-report-num.service";
import * as parser from "cron-parser";

@Controller("/api/v1/wx/pvuvip")
export class WxPvuvipController {
  private cfg: any;
  constructor(
    private readonly configService: ConfigService,
    private readonly wxPvuvip: WxPvuvipService,
    private readonly dayReportNum: DayReportNumService
  ) {
    this.cfg = this.configService.get('microservices.frontend-monitor');
  }

  @Get("/getPvUvIpSurveyToday")
  async getPvUvIpSurveyToday(@Query() q: any) {
    const { appId } = q;
    if (!appId) throw new Error("pvuvip概况统计：appId不能为空");
    const interval = parser.parseExpression(
      this.cfg.pvuvip_task_minute_cron_time
    );
    const timer = interval.prev().toString();
    const timestrat = new Date(interval.prev().toString()).getTime();
    const betweenTime = Math.abs(new Date(timer).getTime() - timestrat);
    const result: any = await this.wxPvuvip.getPvUvIpSurvey(
      appId,
      func.format(new Date(), "yyyy/MM/dd") + " 00:00:00",
      new Date()
    );
    const today = new Date(func.format(new Date(), "yyyy/MM/dd")).getTime();
    const num = await this.dayReportNum.getTodayFromRedis(appId, today);
    if (num) result.num = num;
    return func.result({ time: betweenTime, data: result || {} });
  }

  @Get("/getPvUvIpSurveyOne")
  async getPvUvIpSurveyOne(@Query() q: any) {
    const { appId, beginTime, endTime } = q;
    if (!appId) throw new Error("pvuvip概况统计：appId不能为空");
    if (!beginTime) throw new Error("pvuvip概况统计：beginTime不能为空");
    if (!endTime) throw new Error("pvuvip概况统计：endTime不能为空");
    const result = await this.wxPvuvip.getPvUvIpSurveyOne(
      appId,
      beginTime,
      endTime
    );
    return func.result({ data: result });
  }

  @Get("/getHistoryPvUvIplist")
  async getHistoryPvUvIplist(@Query() q: any) {
    const { appId } = q;
    if (!appId) throw new Error("pvuvip获得历史概况：appId不能为空");
    const result = await this.wxPvuvip.getHistoryPvUvIplist(appId);
    return func.result({ data: result });
  }

  @Get("/getPvUvIpList")
  async getPvUvIpList(@Query() q: any) {
    const { appId, beginTime, endTime } = q;
    if (!appId) throw new Error("界面查询pvuvip：appId不能为空");
    const interval = parser.parseExpression(
      this.cfg.pvuvip_task_minute_cron_time
    );
    const timer = interval.prev().toString();
    const timestrat = new Date(interval.prev().toString()).getTime();
    const betweenTime = Math.abs(new Date(timer).getTime() - timestrat);
    const b = beginTime || new Date(timestrat - betweenTime * 30);
    const e = endTime || new Date(timestrat);
    const datalist = (await this.wxPvuvip.getPvUvIpData(appId, b, e)) || [];
    const result = await this.wxPvuvip.getTimeList(b, e, datalist, betweenTime);
    return func.result({ time: betweenTime, data: result });
  }

  @Get("/getPvUvIpOne")
  async getPvUvIpOne(@Query() q: any) {
    const { appId, endTime, beginTime } = q;
    if (!appId) throw new Error("界面查询pvuvip：appId不能为空");
    const interval = parser.parseExpression(
      this.cfg.pvuvip_task_minute_cron_time
    );
    interval.prev();
    const e = endTime || new Date(interval.prev().toString());
    const b = beginTime || new Date(interval.prev().toString());
    const datalist = (await this.wxPvuvip.getPvUvIpData(appId, b, e)) || [];
    let result: any = {};
    if (datalist.length) {
      result = {
        time: datalist[0].create_time,
        pv: datalist[0].pv || 0,
        uv: datalist[0].uv || 0,
        ip: datalist[0].ip || 0,
        ajax: datalist[0].ajax || 0,
        flow: Math.floor((datalist[0].flow || 0) / 1024 / 1024),
      };
    } else {
      result = {
        time: func.format(e, "yyyy/MM/dd hh:mm") + ":00",
        pv: 0,
        uv: 0,
        ip: 0,
        ajax: 0,
        flow: 0,
      };
    }
    return func.result({ data: result });
  }
}
