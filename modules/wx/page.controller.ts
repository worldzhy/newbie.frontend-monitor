import { Controller, Get, Query } from '@nestjs/common';
import { func } from '../../shared/utils';
import { WxPageService } from './services/page.service';

@Controller('/api/v1/wx/pages')
export class WxPageController {
  constructor(private readonly wxPage: WxPageService) {}

  @Get('/getAveragePageList')
  async getAveragePageList(@Query() q: any) {
    const { appId } = q;
    if (!appId) throw new Error('平均页面性能列表：appId不能为空');
    const result = await this.wxPage.getAveragePageList(q);
    return func.result({ data: result });
  }

  @Get('/getOnePageList')
  async getOnePageList(@Query() q: any) {
    const { appId, url } = q;
    if (!appId) throw new Error('单个页面性能列表：appId不能为空');
    if (!url) throw new Error('单个页面性能列表：url不能为空');
    const result = await this.wxPage.getOnePageList(q);
    return func.result({ data: result });
  }

  @Get('/getPageDetails')
  async getPageDetails(@Query() q: any) {
    const { appId, id } = q;
    if (!appId) throw new Error('单个页面详情：appId不能为空');
    if (!id) throw new Error('单个页面详情：id不能为空');
    const result = await this.wxPage.getPageDetails(appId, { _id: id });
    return func.result({ data: result });
  }

  @Get('/getDataGroupBy')
  async getDataGroupBy(@Query() q: any) {
    const { appId, beginTime, endTime, type = 1, url } = q;
    if (!appId) throw new Error('页面性能列表：appId不能为空');
    if (!url) throw new Error('页面性能列表：url不能为空');
    const result = await this.wxPage.getDataGroupBy(Number(type), url, appId, beginTime, endTime);
    return func.result({ data: result });
  }

  @Get('/getPageForMarkpage')
  async getPageForMarkpage(@Query() q: any) {
    const { appId, markPage, markUser } = q;
    if (!appId) throw new Error('单个页面详情：appId不能为空');
    if (!markPage) throw new Error('单个页面详情：markPage不能为空');
    let result = await this.wxPage.getPageDetails(appId, { mark_page: markPage });
    if (!result) result = await this.wxPage.getPageDetails(appId, { mark_user: markUser });
    return func.result({ data: result });
  }
}