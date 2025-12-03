import { Controller, Get, Post, Body, Query } from "@nestjs/common";
import { func } from "../../shared/utils";
import { WxCustomService } from "./services/custom.service";

@Controller("/api/v1/wx/custom")
export class WxCustomController {
  constructor(private readonly wxCustom: WxCustomService) {}

  @Get("/getCustomFilterList")
  async getCustomFilterList(@Query() q: any) {
    const { appId } = q;
    if (!appId) throw new Error("获取自定义filter：appId不能为空");
    const result = await this.wxCustom.getCustomFilterList(appId);
    return func.result({ data: result });
  }

  @Post("/addCustomFilter")
  async addCustomFilter(@Body() body: any) {
    const { appId, filterKey, filterDesc } = body;
    const ok = await this.wxCustom.addCustomFilter(
      appId,
      filterKey,
      filterDesc
    );
    return func.result({ data: ok });
  }

  @Post("/delCustomFilter")
  async delCustomFilter(@Body() body: any) {
    const { appId, _id } = body;
    const ok = await this.wxCustom.delCustomFilter(appId, _id);
    return func.result({ data: ok });
  }

  @Get("/getAverageCustomList")
  async getAverageCustomList(@Query() q: any) {
    const {
      appId,
      pageNo = 1,
      pageSize = 15,
      beginTime,
      endTime,
      customName,
      customFilter,
    } = q;
    if (!appId) throw new Error("获取custom分类列表：appId不能为空");
    const result = await this.wxCustom.getAverageCustomList(
      appId,
      Number(pageNo),
      Number(pageSize),
      beginTime,
      endTime,
      customName,
      customFilter
    );
    return func.result({ data: result });
  }
}
