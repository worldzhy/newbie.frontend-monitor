// src/modules/wx/services/error.service.ts
import { Injectable } from '@nestjs/common';
import { ClickhouseService } from '../../../models/clickhouse/clickhouse.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WxErrorService {
  private cfg: any;
  constructor(private readonly ch: ClickhouseService, private readonly config: ConfigService) {
    this.cfg = this.config.get('frontend-monitor');
  }

  async getAverageErrorList(query: any) {
    const { appId, beginTime, endTime, type = '', realTime, url, pageSize = this.cfg.pageSize, uid, phone } = query;
    let { pageNo = 1 } = query;
    pageNo = Number(pageNo);
    const wheres: string[] = [];
    let where: string | undefined;
    if (url) wheres.push(`ilike(name,'%${url}%')`);
    if (phone) wheres.push(`ilike(phone,'%${phone}%')`);
    if (uid) wheres.push(`ilike(uid,'%${uid}%')`);
    if (beginTime) wheres.push(`create_time>=toDateTime('${beginTime}')`);
    if (endTime) wheres.push(`create_time<=toDateTime('${endTime}')`);
    if (type) {
      const typeArr = type.split('|').join("','");
      wheres.push(`type IN('${typeArr}')`);
    }
    if (wheres.length > 0) where = wheres.join(' and ');
    if (realTime === '1') return await this.getRealTime(appId, pageNo, pageSize, where);
    let groupBy: string | undefined;
    if (type === 'script') groupBy = 'name,error_type';
    else if (type === 'ajax|fetch') groupBy = 'name,status';
    else if (type === 'bussiness-ajax|bussiness-fetch') groupBy = 'name,status';
    return await this.getGroupErrorList(appId, pageNo, pageSize, where, groupBy);
  }

  private async getGroupErrorList(appId: string, pageNo: number, pageSize: number, where?: string, groupBy?: string) {
    const model = await this.ch.WxError(appId);
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

  private async getRealTime(appId: string, pageNo: number, pageSize: number, where?: string) {
    const model = await this.ch.WxError(appId);
    const countQuery = model.find({ where, select: 'count() as total' });
    const listQuery = model.find({ where, select: '*', limit: pageSize, skip: (pageNo - 1) * pageSize, orderBy: 'create_time DESC' });
    const [count, list] = await Promise.all([countQuery, listQuery]);
    list.forEach((item: any) => (item._id = { ...item }));
    return { datalist: list, totalNum: count?.[0]?.total || 0, pageNo };
  }

  async getOneErrorList(query: any) {
    const { appId, name = '', status = '', type = '', error_type = '', beginTime, endTime, phone = '', uid = '' } = query;
    let pageNo = Number(query.pageNo || 1);
    let pageSize = Number(query.pageSize || this.cfg.pageSize);
    const wheres: string[] = [];
    let where: string | undefined;
    if (name) wheres.push(`name='${name}'`);
    if (error_type) wheres.push(`error_type='${error_type}'`);
    if (status) wheres.push(`status='${status}'`);
    if (type) wheres.push(`type='${type}'`);
    if (phone) wheres.push(`ilike(phone,'%${phone}%')`);
    if (uid) wheres.push(`ilike(uid,'%${uid}%')`);
    if (beginTime) wheres.push(`create_time>=toDateTime('${beginTime}')`);
    if (endTime) wheres.push(`create_time<=toDateTime('${endTime}')`);
    if (wheres.length > 0) where = wheres.join(' and ');
    const model = await this.ch.WxError(appId);
    const countQuery = model.find({ where, select: 'count() as total' });
    const listQuery = model.find({ where, select: '*', limit: pageSize, skip: (pageNo - 1) * pageSize, orderBy: 'create_time DESC' });
    const otherQuery = model.find({
      where,
      select: `name,MIN(create_time) AS first,MAX(create_time) AS last,COUNT() AS count,COUNT(DISTINCT mark_user) AS userNum`,
      limit: pageSize,
      groupBy: 'name'
    });
    const [count, list, other] = await Promise.all([countQuery, listQuery, otherQuery]);
    list.forEach((item: any) => (item._id = { ...item }));
    let userNum = 0, first = '', last = '';
    if (other.length > 0) { userNum = other[0].userNum; first = other[0].first; last = other[0].last; }
    return { datalist: list, totalNum: count?.[0]?.total || 0, pageNo, first, last, userNum };
  }

  async getMarkUserErrorListCH(appId: string, { markUser, beginTime, endTime }: { markUser: string; beginTime?: string; endTime?: string }) {
    const wheres: string[] = [];
    let where: string | undefined;
    if (markUser) wheres.push(`mark_user='${markUser}'`);
    if (beginTime) wheres.push(`create_time>=toDateTime('${beginTime}')`);
    if (endTime) wheres.push(`create_time<=toDateTime('${endTime}')`);
    if (wheres.length > 0) where = wheres.join(' and ');
    const model = await this.ch.WxError(appId);
    const listQuery = model.find({ where, select: '*', orderBy: 'create_time ASC' });
    const [list] = await Promise.all([listQuery]);
    return { list };
  }
}