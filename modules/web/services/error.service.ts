import { Injectable } from '@nestjs/common';
import { ClickhouseService } from '../../../models/clickhouse/clickhouse.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ErrorService {
  private cfg: any;
  constructor(private readonly ch: ClickhouseService, private readonly config: ConfigService) {
    this.cfg = this.config.get('microservices.frontend-monitor');
  }

  async getAverageErrorList(query: any) {
    const { appId, beginTime, endTime, type = '', realTime, resource_url, pageSize = this.cfg.pageSize, uid, phone } = query;
    let pageNo = Number(query.pageNo || 1);
    const wheres: string[] = [];
    if (resource_url) wheres.push(`ilike(resource_url,'%${resource_url}%')`);
    if (phone) wheres.push(`ilike(phone,'%${phone}%')`);
    if (uid) wheres.push(`ilike(uid,'%${uid}%')`);
    if (beginTime) wheres.push(`create_time>=toDateTime('${beginTime}')`);
    if (endTime) wheres.push(`create_time<=toDateTime('${endTime}')`);
    if (type) {
      const typeArr = String(type).split('|').join("','");
      wheres.push(`type IN('${typeArr}')`);
    }
    const where = wheres.length ? wheres.join(' and ') : undefined;
    const model = await this.ch.WebError(appId);

    if (String(realTime) === '1') {
      const total = await model.find({ where, select: 'count() as total' });
      const list = await model.find({ where, select: '*', limit: pageSize, skip: (pageNo - 1) * pageSize, orderBy: 'create_time DESC' });
      list.forEach((item: any) => (item._id = { ...item }));
      return { datalist: list, totalNum: total?.[0]?.total || 0, pageNo };
    }

    let groupBy = '';
    if (type === 'script') groupBy = 'resource_url,name,type';
    else if (type === 'resource') groupBy = 'resource_url,type';
    else if (type === 'ajax|fetch') groupBy = 'resource_url,status,type';
    else if (type === 'bussiness-ajax|bussiness-fetch') groupBy = 'resource_url,status,type';
    else if (type === 'log') groupBy = 'resource_url,type';

    const countQuery = model.find([{ where, groupBy, select: 'COUNT()' }, { select: 'count() as total' }]);
    const listQuery = model.find({
      where,
      select: `${groupBy}, MAX(create_time) AS last_create_time,COUNT() AS count,COUNT(DISTINCT mark_user) AS userNum,groupArray(msg)[1] AS last_msg`,
      groupBy,
      limit: pageSize,
      skip: (pageNo - 1) * pageSize,
      orderBy: 'count DESC'
    });
    const [count, list] = await Promise.all([countQuery, listQuery]);
    list.forEach((item: any) => (item._id = { ...item }));
    return { datalist: list, totalNum: count?.[0]?.total || 0, pageNo };
  }

  async getOneErrorList(query: any) {
    const { appId, url, name = '', status = '', type = '', beginTime, endTime, phone = '', uid = '' } = query;
    let pageNo = Number(query.pageNo || 1);
    let pageSize = Number(query.pageSize || this.cfg.pageSize);
    const wheres: string[] = [];
    if (url) wheres.push(`resource_url='${url}'`);
    if (name) wheres.push(`name='${name}'`);
    if (status) wheres.push(`status='${status}'`);
    if (type) wheres.push(`type='${type}'`);
    if (phone) wheres.push(`ilike(phone,'%${phone}%')`);
    if (uid) wheres.push(`ilike(uid,'%${uid}%')`);
    if (beginTime) wheres.push(`create_time>=toDateTime('${beginTime}')`);
    if (endTime) wheres.push(`create_time<=toDateTime('${endTime}')`);
    const where = wheres.length ? wheres.join(' and ') : undefined;
    const model = await this.ch.WebError(appId);
    const countQuery = model.find({ where, select: 'count() as total' });
    const listQuery = model.find({ where, select: '*', limit: pageSize, skip: (pageNo - 1) * pageSize, orderBy: 'create_time DESC' });
    const groupBy = 'resource_url';
    const otherQuery = model.find({
      where,
      select: `${groupBy},MIN(create_time) AS first,MAX(create_time) AS last,COUNT() AS count,COUNT(DISTINCT mark_user) AS userNum`,
      limit: pageSize,
      groupBy
    });
    const [count, list, other] = await Promise.all([countQuery, listQuery, otherQuery]);
    list.forEach((item: any) => (item._id = { ...item }));
    let userNum = 0, first = '', last = '';
    if (other.length > 0) { userNum = other[0].userNum; first = other[0].first; last = other[0].last; }
    return { datalist: list, totalNum: count?.[0]?.total || 0, pageNo, first, last, userNum };
  }

  async getMarkUserErrorListCH(appId: string, opts: { markUser?: string; beginTime?: string; endTime?: string }) {
    const wheres: string[] = [];
    if (opts.markUser) wheres.push(`mark_user='${opts.markUser}'`);
    if (opts.beginTime) wheres.push(`create_time>=toDateTime('${opts.beginTime}')`);
    if (opts.endTime) wheres.push(`create_time<=toDateTime('${opts.endTime}')`);
    const where = wheres.length ? wheres.join(' and ') : undefined;
    const model = await this.ch.WebError(appId);
    const list = await model.find({ where, select: '*', orderBy: 'create_time ASC' });
    return { list };
  }
}