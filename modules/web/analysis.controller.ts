import { Controller, Get, Query } from '@nestjs/common';
import { func } from '../../shared/utils';
import { AnalysisService } from './services/analysis.service';

@Controller('/api/v1/analysis')
export class AnalysisController {
  constructor(private readonly analysisSrv: AnalysisService) {}

  @Get('/getAnalysislist')
  async getAnalysislist(@Query() q: any) {
    const { appId, beginTime, endTime, uid, phone } = q;
    if (!appId) throw new Error('用户漏斗分析列表：appId不能为空');
    const result = await this.analysisSrv.getAnalysislist(appId, beginTime, endTime, { uid, phone });
    return func.result({ data: result });
  }

  @Get('/getAnalysisOneList')
  async getAnalysisOneList(@Query() q: any) {
    const { appId, markuser } = q;
    if (!appId) throw new Error('单个用户行为轨迹列表：appId不能为空');
    if (!markuser) throw new Error('单个用户行为轨迹列表：markuser不能为空');
    const result = await this.analysisSrv.getAnalysisOneList(appId, markuser);
    return func.result({ data: result });
  }

  @Get('/getTopDatas')
  async getTopDatas(@Query() q: any) {
    const { appId, beginTime, endTime } = q;
    if (!appId) throw new Error('appId不能为空');
    const data = await this.analysisSrv.getTopDatas(appId, beginTime, endTime);
    return func.result({ data });
  }

  @Get('/getProvinceCount')
  async getProvinceCount(@Query() q: any) {
    const { appId, beginTime, endTime } = q;
    if (!appId) throw new Error('appId不能为空');
    const result = await this.analysisSrv.getProvinceCount(appId, beginTime, endTime);
    return func.result({ data: result });
  }
}