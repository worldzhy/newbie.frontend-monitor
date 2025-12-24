import {Controller, Get, Query} from '@nestjs/common';
import {func} from '../../shared/utils';
import {WxEventService} from './services/event.service';

@Controller('/api/v1/wx/event')
export class WxEventController {
  constructor(private readonly wxEvent: WxEventService) {}

  @Get('/getEventList')
  async getEventList(@Query() q: any) {
    const {appId, beginTime, endTime, event, pageNo = 1, pageSize = 15} = q;
    if (!appId) throw new Error('appId不能为空');
    const result = await this.wxEvent.getEventList({
      appId,
      beginTime,
      endTime,
      pageNo: Number(pageNo),
      pageSize: Number(pageSize),
      event,
    });
    return func.result({data: result});
  }
}
