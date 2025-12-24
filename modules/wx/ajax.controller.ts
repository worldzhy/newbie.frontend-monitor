import {Controller, Get, Query} from '@nestjs/common';
import {func} from '../../shared/utils';
import {WxAjaxService} from './services/ajax.service';

@Controller('/api/v1/wx/ajax')
export class WxAjaxController {
  constructor(private readonly wxAjax: WxAjaxService) {}

  @Get('/getPageAjaxsAvg')
  async getPageAjaxsAvg(@Query() q: any) {
    const {appId, url, beginTime, endTime} = q;
    if (!appId) throw new Error('页面ajax信息：appId不能为空');
    if (!url) throw new Error('页面ajax信息：url不能为空');
    const result = await this.wxAjax.getPageAjaxsAvg(appId, url, beginTime, endTime);
    return func.result({data: result});
  }

  @Get('/getAverageAjaxList')
  async getAverageAjaxList(@Query() q: any) {
    const {appId} = q;
    if (!appId) throw new Error('平均AJAX性能列表：appId不能为空');
    const result = await this.wxAjax.getAverageAjaxList(q);
    return func.result({data: result});
  }

  @Get('/getOneAjaxList')
  async getOneAjaxList(@Query() q: any) {
    const {appId, url, pageNo = 1, pageSize = 15, beginTime, endTime, type} = q;
    if (!appId) throw new Error('单个AJAX平均性能数据：appId不能为空');
    if (!url) throw new Error('单个AJAX平均性能数据：api地址不能为空');
    const result = await this.wxAjax.getOneAjaxList(
      appId,
      url,
      Number(pageNo),
      Number(pageSize),
      beginTime,
      endTime,
      type
    );
    return func.result({data: result});
  }

  @Get('/getMarkUserAjaxList')
  async getMarkUserAjaxList(@Query() q: any) {
    const {markUser, appId, beginTime, endTime} = q;
    if (!markUser) throw new Error('markUser不能为空');
    if (!appId) throw new Error('获得单个ajax详情信息：appId不能为空');
    const result = await this.wxAjax.getMarkUserAjaxListCH(appId, {markUser, beginTime, endTime});
    return func.result({data: result});
  }
}
