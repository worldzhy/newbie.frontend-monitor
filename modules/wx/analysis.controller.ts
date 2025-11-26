// src/modules/wx/analysis.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { func } from '../../shared/utils';
import { WxAnalysisService } from './services/analysis.service';

@Controller('/api/v1/wx/analysis')
export class WxAnalysisController {
  constructor(private readonly wxAnalysis: WxAnalysisService) {}

  @Get('/getAnalysislist')
  async getAnalysislist(@Query() q: any) {
    const { appId, beginTime, endTime, uid, phone } = q;
    if (!appId) throw new Error('用户漏斗分析列表：appId不能为空');
    const result = await this.wxAnalysis.getAnalysislist(appId, beginTime, endTime, { uid, phone });
    return func.result({ data: result });
  }

  @Get('/getAnalysisOneList')
  async getAnalysisOneList(@Query() q: any) {
    const { appId, markuser } = q;
    if (!appId) throw new Error('单个用户行为轨迹列表：appId不能为空');
    if (!markuser) throw new Error('单个用户行为轨迹列表：markuser不能为空');
    const result = await this.wxAnalysis.getAnalysisOneList(appId, markuser);
    const newR: any[] = [];
    result.map((item: any, i: number) => {
      if (i === 0) newR.push(item);
      else if (item.path !== newR[newR.length - 1].path) newR.push(item);
    });
    return func.result({ data: newR });
  }

  @Get('/getTopDatas')
  async getTopDatas(@Query() q: any) {
    const { appId, beginTime, endTime } = q;
    if (!appId) throw new Error('top页面：appId不能为空');
    const result = await this.wxAnalysis.getTopDatas(appId, beginTime, endTime);
    return func.result({ data: result });
  }

  @Get('/getProvinceCount')
  async getProvinceCount(@Query() q: any) {
    const { appId, beginTime, endTime } = q;
    if (!appId) throw new Error('appId不能为空');
    const result = await this.wxAnalysis.getProvinceCount(appId, beginTime, endTime);
    return func.result({ data: result });
  }
}