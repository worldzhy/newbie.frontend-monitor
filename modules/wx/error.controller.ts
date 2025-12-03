import { Controller, Get, Query } from '@nestjs/common';
import { func } from '../../shared/utils';
import { WxErrorService } from './services/error.service';

@Controller('/api/v1/wx/error')
export class WxErrorController {
  constructor(private readonly wxError: WxErrorService) {}

  @Get('/getAverageErrorList')
  async getAverageErrorList(@Query() q: any) {
    const { appId } = q;
    if (!appId) throw new Error('获得error分类列表：appId不能为空');
    const result = await this.wxError.getAverageErrorList(q);
    return func.result({ data: result });
  }

  @Get('/getOneErrorList')
  async getOneErrorList(@Query() q: any) {
    const { appId, name } = q;
    if (!appId) throw new Error('获得单个ERROR资源列表信息：appId不能为空');
    if (!name) throw new Error('获得单个ERROR资源列表信息：name地址不能为空');
    const result = await this.wxError.getOneErrorList(q);
    return func.result({ data: result });
  }

  @Get('/getMarkUserErrorList')
  async getMarkUserErrorList(@Query() q: any) {
    const { markUser, appId, beginTime, endTime } = q;
    if (!markUser) throw new Error('markUser不能为空');
    if (!appId) throw new Error('获得单个ajax详情信息：appId不能为空');
    const result = await this.wxError.getMarkUserErrorListCH(appId, { markUser, beginTime, endTime });
    return func.result({ data: result });
  }
}