import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../models/redis/redis.service';
import { MongoModelsService } from '../../../models/mongo/mongo.service';
import { ClickhouseService } from '../../../models/clickhouse/clickhouse.service';
import { SystemService } from '../../../modules/system/system.service';
import { func } from '../../../shared/utils';
import { RedisKeys } from '../../../models/enum';

@Injectable()
export class WxReportTaskService {
  private cfg: any;
  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly mongo: MongoModelsService,
    private readonly ch: ClickhouseService,
    private readonly system: SystemService
  ) {
    this.cfg = this.config.get('microservices.frontend-monitor');
  }

  async saveWxReportDatasForRedis() {
    const threads = this.cfg.redis_consumption?.thread_wx || 1;
    const appEvents: Record<string, any[]> = {};
    const appAjaxs: Record<string, any[]> = {};
    const appErrors: Record<string, any[]> = {};
    for (let i = 0; i < threads; i++) {
      await this.getWxItemDataForRedis({ appEvents, appAjaxs, appErrors });
    }
    const eventIds = Object.keys(appEvents);
    for (const appId of eventIds) {
      const model = await this.ch.WxEvent(appId);
      await model.insertMany(appEvents[appId]);
    }
    const ajaxIds = Object.keys(appAjaxs);
    for (const appId of ajaxIds) {
      const model = await this.ch.WxAjax(appId);
      await model.insertMany(appAjaxs[appId]);
    }
    const errorIds = Object.keys(appErrors);
    for (const appId of errorIds) {
      const model = await this.ch.WxError(appId);
      await model.insertMany(appErrors[appId]);
    }
  }

  private async getWxItemDataForRedis({ appEvents, appAjaxs, appErrors }: { appEvents: Record<string, any[]>; appAjaxs: Record<string, any[]>; appErrors: Record<string, any[]> }) {
    let query: any = await this.redis.rpop(RedisKeys.WX_REPORT_DATAS);
    if (!query) return;
    try { query = JSON.parse(query); } catch { return; }
    const querytype = query.type || 1;
    const item = await this.handleData(query);
    if (querytype === 999) {
      await this.saveSdkError(item);
      return;
    }
    const system = await this.system.getSystemForAppId(item.app_id);
    if (!system || system.is_use !== 0) return;
    if (system.is_statisi_system === 0 && querytype === 1) await this.savePages(item);
    if (system.is_statisi_ajax === 0) this.saveAjaxs(item, appAjaxs);
    if (system.is_statisi_error === 0) this.saveErrors(item, appErrors);
    await this.saveCustoms(item);
    this.saveEvents(item, appEvents);
  }

  private async handleData(query: any) {
    const type = query.type || 1;
    let item: any = {
      app_id: query.appId,
      create_time: query.time ? new Date(query.time) : new Date(),
      errs: query.errs,
      mark_page: func.randomString(),
      mark_user: query.markuser || '',
      mark_uv: query.markuv || '',
      mark_device: query.markdevice || '',
      pages: query.pages,
      ajaxs: query.ajaxs,
      customs: query.customs,
      events: query.events,
      p: query.p,
      uid: query.uid,
      ip: query.ip,
      net: query.net,
      system: query.system,
      loc: query.loc,
      userInfo: query.userInfo
    };
    if (type === 999) {
      item = Object.assign(item, { msg: query.msg, name: query.name, stack: query.stack, sdk_v: query.version });
    }
    return item;
  }

  private async savePages(item: any) {
    const ip = item.ip;
    if (!ip) return;
    let copyip = ip.split('.');
    copyip = `${copyip[0]}.${copyip[1]}.${copyip[2]}`;
    let datas: any = null;
    try {
      const s = await this.redis.get(copyip);
      if (s) datas = JSON.parse(s);
    } catch {}
    const Model = this.mongo.WxPage(item.app_id);
    const pages = new Model();
    pages.app_id = item.app_id;
    pages.create_time = item.create_time;
    pages.path = item.pages?.router;
    pages.options = item.pages?.options ? item.pages.options : {};
    pages.mark_page = item.mark_page;
    pages.mark_user = item.mark_user;
    if (item.mark_device) pages.mark_device = item.mark_device;
    pages.mark_uv = item.mark_uv;
    if (item.net) pages.net = item.net;
    if (item.ip) pages.ip = item.ip;
    if (item.system) {
      pages.brand = (item.system.brand || '').toLowerCase();
      pages.model = item.system.model;
      pages.screenWidth = item.system.screenWidth;
      pages.screenHeight = item.system.screenHeight;
      pages.language = item.system.language;
      pages.version = item.system.version;
      pages.system = item.system.system;
      pages.platform = item.system.platform;
      pages.SDKVersion = item.system.SDKVersion;
    }
    this.setUser(pages, item);
    if (datas) {
      pages.province = datas.province;
      pages.city = datas.city;
    }
    await pages.save();
  }

  private saveAjaxs(data: any, appAjaxs: Record<string, any[]>) {
    if (!data.ajaxs || !data.ajaxs.length) return;
    data.ajaxs.forEach(async (item: any) => {
      const duration = Math.floor(Math.abs(item.duration || 0));
      const newurl = new URL(func.urlHelper(item.name));
      const newName = `${newurl.protocol}//${newurl.host}${newurl.pathname}`;
      const model = await this.ch.WxAjax(data.app_id);
      const ajaxs = model.build();
      ajaxs.app_id = data.app_id;
      ajaxs.create_time = data.create_time;
      ajaxs.url = newName || '';
      ajaxs.full_url = item.name || '';
      ajaxs.method = item.method || '';
      ajaxs.duration = duration;
      ajaxs.decoded_body_size = item.bodySize ? Number(item.bodySize) : 0;
      if (item.options) ajaxs.options = func.filterKeyWord(item.options);
      if (newurl.searchParams.toString()) ajaxs.query = newurl.searchParams.toString();
      if (item.traceId) ajaxs.trace_id = item.traceId;
      ajaxs.mark_page = data.mark_page || '';
      ajaxs.mark_user = data.mark_user || '';
      ajaxs.call_url = data.pages?.router || '';
      this.setUserCH(ajaxs, data);
      const _appAjax = appAjaxs[data.app_id];
      if (_appAjax) _appAjax.push(ajaxs);
      else appAjaxs[data.app_id] = [ajaxs];
    });
  }

  private saveErrors(data: any, appErrors: Record<string, any[]>) {
    if (!data.errs || !data.errs.length) return;
    data.errs.forEach(async (item: any) => {
      const model = await this.ch.WxError(data.app_id);
      const errors = model.build();
      if (['bussiness-ajax', 'ajax', 'fetch', 'bussiness-fetch'].indexOf(item.type) !== -1) {
        if (item.name && item.name.startsWith('data://image')) return;
        const newurl = new URL(func.urlHelper(item.name) || '');
        let newName = '';
        if (newurl.host) newName = `${newurl.protocol}//${newurl.host}${newurl.pathname}`;
        else newName = item.name || '';
        errors.name = newName;
        errors.full_name = item.name || '';
        if (newurl.searchParams.toString()) errors.query = newurl.searchParams.toString();
      } else {
        errors.name = item.name;
      }
      errors.create_time = data.create_time;
      if (func.isObject(item.msg)) errors.msg = JSON.stringify(item.msg);
      else if (typeof item.msg === 'string') {
        errors.msg = item.msg.replace(/\(\w*\)(?![^\(]*\()/g, '');
        const traceId_in_msg_reg = item.msg.match(/[^(][a-zA-Z0-9]+(?=\))/g);
        if (traceId_in_msg_reg && traceId_in_msg_reg.length) errors.trace_id = traceId_in_msg_reg[traceId_in_msg_reg.length - 1];
      } else {
        errors.msg = item.msg || '';
      }
      errors.type = item.type || '';
      errors.status = item.status ? item.status.toString() : '';
      errors.col = item.col ? item.col.toString() : '';
      errors.line = item.line ? item.line.toString() : '';
      if (item.options) errors.options = func.filterKeyWord(item.options);
      errors.method = item.method || '';
      if (item.traceId) errors.trace_id = item.traceId;
      if (item.errorType) errors.error_type = item.errorType;
      if (item.stack) errors.stack = item.stack;
      this.setUserCH(errors, data);
      errors.mark_page = data.mark_page || '';
      errors.mark_user = data.mark_user || '';
      errors.path = data.pages?.router || '';
      const _appErrors = appErrors[data.app_id];
      if (_appErrors) _appErrors.push(errors);
      else appErrors[data.app_id] = [errors];
    });
  }

  private async saveCustoms(data: any) {
    if (!data.customs || !data.customs.length) return;
    const Model = this.mongo.WxCustom(data.app_id);
    for (const item of data.customs) {
      const customs = new Model();
      customs.app_id = data.app_id;
      customs.create_time = data.create_time;
      customs.mark_page = data.mark_page;
      customs.mark_user = data.mark_user;
      customs.path = '';
      customs.customName = item.customName;
      customs.customContent = item.customContent;
      if (item.customFilter && Object.prototype.toString.apply(item.customFilter) === '[object Object]') {
        Object.keys(item.customFilter).forEach((key) => {
          if (typeof item.customFilter[key] === 'number') item.customFilter[key] = String(item.customFilter[key]);
        });
      }
      this.setUser(customs, data);
      customs.customFilter = item.customFilter;
      await customs.save();
    }
  }

  private async saveEvents(data: any, appEvents: Record<string, any[]>) {
    if (!data.events || !data.events.length) return;
    for (const item of data.events) {
      const model = await this.ch.WxEvent(data.app_id);
      const event = model.build();
      event.app_id = data.app_id;
      event.event = item.event;
      event.create_time = item.createTime ? new Date(item.createTime) : new Date();
      event.path = item.path || '';
      event.duration = item.duration || '';
      this.commonData(event, data);
      const list = appEvents[data.app_id];
      if (list) list.push(event);
      else appEvents[data.app_id] = [event];
    }
  }

  private commonData(model: any, sourceData: any) {
    model.mark_page = sourceData.mark_page;
    model.mark_user = sourceData.mark_user;
    model.mark_uv = sourceData.mark_uv;
    if (sourceData.net) model.net = sourceData.net;
    if (sourceData.ip) model.ip = sourceData.ip;
    this.setUserCH(model, sourceData);
    this.setSystem(model, sourceData);
  }

  private setSystem(model: any, sourceData: any) {
    const s = sourceData.system;
    if (!s) return;
    model.brand = (s.brand || '').toLowerCase();
    model.model = s.model;
    model.screen_width = s.screenWidth;
    model.screen_height = s.screenHeight;
    model.language = s.language;
    model.version = s.version;
    model.system = s.system;
    model.platform = s.platform;
    model.sdk_version = s.SDKVersion;
  }

  private async saveSdkError(data: any) {
    const model = await this.ch.WxSdkError();
    const sdkErr = model.build();
    sdkErr.app_id = data.app_id;
    sdkErr.create_time = data.create_time;
    sdkErr.mark_user = data.mark_user;
    sdkErr.sdk_v = data.sdk_v;
    sdkErr.name = data.name;
    sdkErr.msg = data.msg;
    sdkErr.stack = data.stack;
    this.setUserCH(sdkErr, data);
    this.setSystem(sdkErr, data);
    await sdkErr.save();
  }

  private setUser(obj: any, data: any) {
    if (data.uid) obj.uid = data.uid;
    if (data.p) obj.phone = func.decryptPhone(data.p);
  }
  private setUserCH(obj: any, data: any) {
    if (data.uid) obj.uid = '' + data.uid;
    if (data.p) obj.phone = func.decryptPhone(data.p);
  }
}