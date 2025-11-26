import { Controller, Post, Req, Headers, Body } from '@nestjs/common';
import { Request } from 'express';
import { SystemService } from '../../modules/system/system.service';
import { ConfigService } from '@nestjs/config';
import { func, getRandomIp } from '../../shared/utils';
import { DayReportNumService } from '../../modules/day-report/day-report-num.service';
import { RedisService } from '../../models/redis/redis.service';

@Controller('/api/v1')
export class WebReportController {
  private config: any;

  constructor(
    private readonly system: SystemService,
    private readonly configService: ConfigService,
    private readonly dayReportNum: DayReportNumService,
    private readonly redis: RedisService
  ) {
    this.config = this.configService.get('frontend-monitor');
  }

  @Post('/report/web')
  async webReport(
    @Req() req: Request,
    @Headers() headers: Record<string, string | undefined>,
    @Body() body: any
  ) {
    let query: any = body;

    if (req.headers['content-type'] && req.headers['content-type'].includes('text/plain')) {
      query = JSON.parse(body as string);
    }
    if (!query.appId) throw new Error('web端上报数据操作：app_id不能为空');

    query.ip = func.getRealIp(req.headers as any, req.ip);
    if (this.config.isLocalDev) query.ip = getRandomIp();

    query.url = query.url || headers['referer'];
    query.user_agent = headers['user-agent'];

    const system = await this.system.getSystemForAppId(query.appId);
    if (!system?.app_id) throw new Error(`appId:${query.appId} 不存在`);

    await this.saveWebReportDataForRedis(query);
    return func.result({ data: 'ok' });
  }

  private async saveWebReportDataForRedis(query: any) {
    const limit = this.config.redis_consumption?.total_limit_web;
    if (limit) {
      const length = await this.redis.llen('web_repore_datas');
      if (length >= limit) throw new Error(`reids: web_repore_datas:达到限流（${limit}）`);
    }
    await this.redis.lpush('web_repore_datas', JSON.stringify(query));
    await this.dayReportNum.redisCount(query.appId);
  }
}