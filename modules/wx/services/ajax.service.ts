import { Injectable } from '@nestjs/common';
import { ClickhouseService } from '../../../models/clickhouse/clickhouse.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WxAjaxService {
  private cfg: any;
  constructor(private readonly ch: ClickhouseService, private readonly config: ConfigService) {
    this.cfg = this.config.get('microservices.frontend-monitor');
  }

  async getPageAjaxsAvg(appId: string, url: string, beginTime?: string, endTime?: string) {
    const wheres: string[] = [];
    let where: string | undefined;
    if (url) wheres.push(`call_url='${url}'`);
    if (beginTime) wheres.push(`create_time>=toDateTime('${beginTime}')`);
    if (endTime) wheres.push(`create_time<=toDateTime('${endTime}')`);
    if (wheres.length > 0) where = wheres.join(' and ');
    const model = await this.ch.WxAjax(appId);
    const countQuery = model.find([{ where, select: 'url', groupBy: 'url,method' }, { select: 'count() as total' }]);
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
    const { appId, beginTime, endTime, type = 1, url, pageSize = this.cfg.pageSize, pageNo = 1 } = query;
    const wheres: string[] = [];
    let where: string | undefined;
    if (Number(type) === 2) wheres.push('duration>2000');
    if (url) wheres.push(`ilike(url,'%${url}%')`);
    if (beginTime) wheres.push(`create_time>=toDateTime('${beginTime}')`);
    if (endTime) wheres.push(`create_time<=toDateTime('${endTime}')`);
    if (wheres.length > 0) where = wheres.join(' and ');
    const model = await this.ch.WxAjax(appId);
    const countQuery = model.find([{ where, select: 'url', groupBy: 'url,method' }, { select: 'count() as total' }]);
    const listQuery = model.find({
      where,
      select: 'url,method,count() as count,floor(avg(duration)) as durationAvg,floor(avg(decoded_body_size)) as body_size',
      groupBy: 'url,method',
      limit: Number(pageSize),
      skip: (Number(pageNo) - 1) * Number(pageSize),
      orderBy: 'durationAvg DESC'
    });
    const [count, list] = await Promise.all([countQuery, listQuery]);
    list.forEach((item: any) => {
      item._id = { method: item.method, url: item.url };
      item.duration = item.durationAvg;
    });
    return { datalist: list, totalNum: count?.[0]?.total || 0, pageNo: Number(pageNo) };
  }

  async getOneAjaxList(appId: string, url: string, pageNo: number, pageSize: number, beginTime?: string, endTime?: string, type?: number) {
    const wheres: string[] = [];
    let where: string | undefined;
    if (Number(type) === 2) wheres.push('duration>2000');
    if (url) wheres.push(`ilike(url,'%${url}%')`);
    if (beginTime) wheres.push(`create_time>=toDateTime('${beginTime}')`);
    if (endTime) wheres.push(`create_time<=toDateTime('${endTime}')`);
    if (wheres.length > 0) where = wheres.join(' and ');
    const model = await this.ch.WxAjax(appId);
    const countQuery = model.find([{ where, select: 'url' }, { select: 'count() as total' }]);
    const listQuery = model.find({ where, select: '*', limit: pageSize, skip: (pageNo - 1) * pageSize, orderBy: 'create_time DESC' });
    const [count, list] = await Promise.all([countQuery, listQuery]);
    return { datalist: list, totalNum: count?.[0]?.total || 0, pageNo };
  }

  async getMarkUserAjaxListCH(appId: string, { markUser, beginTime, endTime }: { markUser: string; beginTime?: string; endTime?: string }) {
    const wheres: string[] = [];
    let where: string | undefined;
    if (markUser) wheres.push(`mark_user='${markUser}'`);
    if (beginTime) wheres.push(`create_time>=toDateTime('${beginTime}')`);
    if (endTime) wheres.push(`create_time<=toDateTime('${endTime}')`);
    if (wheres.length > 0) where = wheres.join(' and ');
    const model = await this.ch.WxAjax(appId);
    const listQuery = model.find({ where, select: '*', orderBy: 'create_time ASC' });
    const [list] = await Promise.all([listQuery]);
    return { list };
  }
}