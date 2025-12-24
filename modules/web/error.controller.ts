import {Controller, Get, Query} from '@nestjs/common';
import {func} from '../../shared/utils';
import {ErrorService} from './services/error.service';

@Controller('/api/v1/error')
export class ErrorController {
  constructor(private readonly errorSrv: ErrorService) {}

  @Get('/getAverageErrorList')
  async getAverageErrorList(@Query() q: any) {
    const {appId} = q;
    if (!appId) throw new Error('获得error分类列表：appId不能为空');
    const result = await this.errorSrv.getAverageErrorList(q);
    return func.result({data: result});
  }

  @Get('/getOneErrorList')
  async getOneErrorList(@Query() q: any) {
    const {appId, url} = q;
    if (!appId) throw new Error('获得单个ERROR资源列表信息：appId不能为空');
    if (!url) throw new Error('获得单个ERROR资源列表信息：url地址不能为空');
    const result = await this.errorSrv.getOneErrorList(q);
    return func.result({data: result});
  }

  @Get('/getMarkUserErrorList')
  async getMarkUserErrorList(@Query() q: any) {
    const {appId, markUser, beginTime, endTime} = q;
    if (!markUser) throw new Error('markUser不能为空');
    if (!appId) throw new Error('获得单个ajax详情信息：appId不能为空');
    const result = await this.errorSrv.getMarkUserErrorListCH(appId, {markUser, beginTime, endTime});
    return func.result({data: result});
  }
}
