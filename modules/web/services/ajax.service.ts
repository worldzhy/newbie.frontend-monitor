import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClickhouseService } from '../../../models/clickhouse/clickhouse.service';

@Injectable()
export class AjaxService {
  private cfg: any;
  constructor(private readonly ch: ClickhouseService, private readonly config: ConfigService) {
    this.cfg = this.config.get('microservices.frontend-monitor');
  }

  async getPageAjaxsAvg(appId: string, url?: string, beginTime?: string, endTime?: string) {
    const wheres: string[] = [];
    if (url) wheres.push(`call_url='${url}'`);
    if (beginTime) wheres.push(`create_time>=toDateTime('${beginTime}')`);
    if (endTime) wheres.push(`create_time<=toDateTime('${endTime}')`);
    const where = wheres.length ? wheres.join(' and ') : undefined;
    const model = await this.ch.WebAjax(appId);
    const countQuery = model.find([
      { where, select: 'url', groupBy: 'url,method' },
      { select: 'count() as total' }
    ]);
    const listQuery = model.find({
      where,
      select: 'url,method,count() as count,floor(avg(duration)) as durationAvg,floor(avg(decoded_body_size)) as body_size',
      groupBy: 'url,method',
      orderBy: 'durationAvg DESC'
    });
    const [count, list] = await Promise.all([countQuery, listQuery]);
    list.forEach((item: any) => {
      item._id = { method: item.method, url: item.url };
      item.duration = item.durationAvg;
    });
    return { datalist: list, totalNum: count?.[0]?.total || 0, pageNo: 1 };
  }

  async getAverageAjaxList(query: any) {
    const { appId, beginTime, endTime, type = 1, url, pageSize = this.cfg.pageSize } = query;
    let pageNo = Number(query.pageNo || 1);
    const wheres: string[] = [];
    if (parseInt(type) === 2) wheres.push('duration>2000');
    if (url) wheres.push(`ilike(url,'%${url}%')`);
    if (beginTime) wheres.push(`create_time>=toDateTime('${beginTime}')`);
    if (endTime) wheres.push(`create_time<=toDateTime('${endTime}')`);
    const where = wheres.length ? wheres.join(' and ') : undefined;
    const model = await this.ch.WebAjax(appId);
    const countQuery = model.find([{ where, select: 'url', groupBy: 'url,method' }, { select: 'count() as total' }]);
    const listQuery = model.find({
      where,
      select: 'url,method,count() as count,floor(avg(duration)) as durationAvg,floor(avg(decoded_body_size)) as body_size',
      groupBy: 'url,method',
      limit: pageSize,
      skip: (pageNo - 1) * pageSize,
      orderBy: 'durationAvg DESC'
    });
    const [count, list] = await Promise.all([countQuery, listQuery]);
    list.forEach((item: any) => {
      item._id = { method: item.method, url: item.url };
      item.duration = item.durationAvg;
    });
    return { datalist: list, totalNum: count?.[0]?.total || 0, pageNo };
  }

  async getOneAjaxList(appId: string, url?: string, pageNo = 1, pageSize = 15, beginTime?: string, endTime?: string, type?: number) {
    pageNo = Number(pageNo); pageSize = Number(pageSize); type = Number(type || 1);
    const wheres: string[] = [];
    if (parseInt(String(type)) === 2) wheres.push('duration>2000');
    if (url) wheres.push(`ilike(url,'%${url}%')`);
    if (beginTime) wheres.push(`create_time>=toDateTime('${beginTime}')`);
    if (endTime) wheres.push(`create_time<=toDateTime('${endTime}')`);
    const where = wheres.length ? wheres.join(' and ') : undefined;
    const model = await this.ch.WebAjax(appId);
    const countQuery = model.find([{ where, select: 'url' }, { select: 'count() as total' }]);
    const listQuery = model.find({ where, select: '*', limit: pageSize, skip: (pageNo - 1) * pageSize, orderBy: 'create_time DESC' });
    const [count, list] = await Promise.all([countQuery, listQuery]);
    return { datalist: list, totalNum: count?.[0]?.total || 0, pageNo };
  }

  async getMarkUserAjaxList(appId: string, opts: { markUser?: string; beginTime?: string; endTime?: string }) {
    const wheres: string[] = [];
    if (opts.markUser) wheres.push(`mark_user='${opts.markUser}'`);
    if (opts.beginTime) wheres.push(`create_time>=toDateTime('${opts.beginTime}')`);
    if (opts.endTime) wheres.push(`create_time<=toDateTime('${opts.endTime}')`);
    const where = wheres.length ? wheres.join(' and ') : undefined;
    const model = await this.ch.WebAjax(appId);
    const list = await model.find({ where, select: '*', orderBy: 'create_time ASC' });
    return { list };
  }
}