// ts:/Users/zimv/Documents/code/_coding/monitor/monitor-server-nestjs/src/modules/web/services/report-task.service.ts
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "../../../models/redis/redis.service";
import { SystemService } from "../../../modules/system/system.service";
import { ClickhouseService } from "../../../models/clickhouse/clickhouse.service";
import { MongoModelsService } from "../../../models/mongo/mongo.service";
import { func } from "../../../shared/utils";
import * as UAParser from "ua-parser-js";

@Injectable()
export class WebReportTaskService {
  private cfg: any;
  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly system: SystemService,
    private readonly mongo: MongoModelsService,
    private readonly ch: ClickhouseService
  ) {
    this.cfg = this.config.get('microservices.frontend-monitor');
  }
  private async getWebItemDataForRedis({
    appAjaxs,
    appErrors,
  }: {
    appAjaxs: Record<string, any[]>;
    appErrors: Record<string, any[]>;
  }) {
    let query: any = await this.redis.rpop("web_repore_datas");
    if (!query) return;
    try {
      query = JSON.parse(query);
    } catch {
      return;
    }
    const querytype = query.type || 1;
    const item = await this.handleWebData(query);
    if (query.type === 999) {
      await this.saveSdkError(item);
      return;
    }
    const system = await this.system.getSystemForAppId(item.app_id);
    if (!system || system.is_use !== 0) return;
    // TODO querytype === 1
    if (system.is_statisi_pages === 0 && querytype === 1)
      await this.savePages(item, system.slow_page_time);
    if (system.is_statisi_resource === 0 || system.is_statisi_ajax === 0)
      this.forEachResources(item, system, appAjaxs);
    if (system.is_statisi_error === 0)
      await this.collectErrors(item, appErrors);
    if (system.is_statisi_system === 0) await this.saveEnvironment(item);
    await this.saveCustoms(item);
  }

  private async savePages(item: any, slowPageTime = 5) {
    const performance = item.performance || {};
    let newName = "";
    try {
      const u = new URL(func.urlHelper(item.url));
      newName = `${u.protocol}//${u.host}${u.pathname}${u.hash ? u.hash : ""}`;
    } catch {
      newName = item.url || "";
    }
    slowPageTime = slowPageTime * 1000;
    const speedType = performance.lodt >= slowPageTime ? 2 : 1;
    const PageModel = this.mongo.WebPage(item.app_id);
    const pages = new PageModel();
    pages.app_id = item.app_id;
    pages.create_time = item.create_time;
    pages.url = newName;
    pages.full_url = item.url;
    pages.pre_url = item.pre_url;
    pages.speed_type = speedType;
    pages.is_first_in = item.is_first_in;
    pages.mark_page = item.mark_page;
    pages.mark_user = item.mark_user;
    if (performance.wit !== undefined) pages.white_time = performance.wit;
    if (performance.dnst !== undefined) pages.dns_time = performance.dnst;
    if (performance.lodt !== undefined) pages.load_time = performance.lodt;
    if (performance.reqt !== undefined) pages.request_time = performance.reqt;
    if (performance.tcpt !== undefined) pages.tcp_time = performance.tcpt;
    if (performance.andt !== undefined)
      pages.analysisDom_time = performance.andt;
    pages.screenwidth = item.screenwidth;
    pages.screenheight = item.screenheight;
    await pages.save();
  }

  private async saveCustoms(data: any) {
    if (!data.customs || !data.customs.length) return;
    const CustomModel = this.mongo.WebCustom(data.app_id);
    for (const item of data.customs) {
      const customs = new CustomModel();
      customs.app_id = data.app_id;
      customs.create_time = data.create_time;
      customs.mark_page = data.mark_page;
      customs.mark_user = data.mark_user;
      customs.path = "";
      customs.customName = item.customName;
      customs.customContent = item.customContent;
      if (
        item.customFilter &&
        Object.prototype.toString.apply(item.customFilter) === "[object Object]"
      ) {
        Object.keys(item.customFilter).forEach((key) => {
          if (typeof item.customFilter[key] === "number")
            item.customFilter[key] = String(item.customFilter[key]);
        });
      }
      this.setUser(customs, data);
      customs.customFilter = item.customFilter;
      await customs.save();
    }
  }

  private async saveResours(data: any, item: any, system: any) {
    let slowTime = 2;
    let speedType = 1;
    let duration = Math.floor(Math.abs(item.duration || 0));
    if (duration > 60000) duration = 60000;
    if (item.type === "link" || item.type === "css")
      slowTime = (system.slow_css_time || 2) * 1000;
    else if (item.type === "script")
      slowTime = (system.slow_js_time || 2) * 1000;
    else if (item.type === "img") slowTime = (system.slow_img_time || 2) * 1000;
    else slowTime = 2000;
    speedType = duration >= slowTime ? 2 : 1;
    if (duration < slowTime) return;
    let newName = "";
    try {
      const u = new URL(func.urlHelper(item.name));
      newName = `${u.protocol}//${u.host}${u.pathname}`;
    } catch {
      newName = item.name || "";
    }
    const ResourceModel = this.mongo.WebResource(data.app_id);
    const resours = new ResourceModel();
    resours.app_id = data.app_id;
    resours.create_time = data.create_time;
    resours.url = data.url;
    resours.full_url = item.name;
    resours.speed_type = speedType;
    resours.name = newName;
    resours.method = item.method;
    resours.type = item.type;
    resours.duration = duration;
    resours.decoded_body_size = item.decodedBodySize
      ? Number(item.decodedBodySize)
      : 0;
    resours.next_hop_protocol = item.nextHopProtocol;
    resours.mark_page = data.mark_page;
    resours.mark_user = data.mark_user;
    this.setUser(resours, data);
    await resours.save();
  }

  private async saveEnvironment(data: any) {
    const ip = data.ip;
    if (!ip) return;
    let copyip = ip.split(".");
    copyip = `${copyip[0]}.${copyip[1]}.${copyip[2]}`;
    let datas: any = null;
    try {
      const s = await this.redis.get(copyip);
      if (s) datas = JSON.parse(s);
    } catch {
      datas = null;
    }
    const EnvModel = this.mongo.WebEnvironment(data.app_id);
    const environment = new EnvModel();
    environment.app_id = data.app_id;
    environment.create_time = data.create_time;
    environment.url = data.url;
    environment.mark_page = data.mark_page;
    environment.mark_user = data.mark_user;
    environment.mark_uv = data.mark_uv;
    if (data.mark_device) environment.mark_device = data.mark_device;
    this.setUser(environment, data);

    const parser = new UAParser();
    parser.setUA(data.user_agent);
    const result = parser.getResult();
    environment.browser = result?.browser?.name || "";
    environment.borwser_version = result?.browser?.version || "";
    environment.system = result?.os?.name || "";
    environment.system_version = result?.os?.version || "";

    environment.ip = data.ip;
    environment.county = data.county;
    environment.province = data.province;
    if (datas) {
      environment.province = datas.province;
      environment.city = datas.city;
    }
    await environment.save();
  }

  private async saveSdkError(data: any) {
    const model = await this.ch.WebSdkError();
    const sdkErr = model.build();
    sdkErr.app_id = data.app_id;
    sdkErr.create_time = data.create_time;
    sdkErr.mark_user = data.mark_user;
    sdkErr.sdk_v = data.sdk_v;
    this.setUser(sdkErr, data);
    sdkErr.name = data.name;
    sdkErr.msg = data.msg;
    sdkErr.stack = data.stack;

    const parser = new UAParser();
    parser.setUA(data.user_agent);
    const result = parser.getResult();
    sdkErr.browser = result?.browser?.name || "";
    sdkErr.borwser_version = result?.browser?.version || "";
    sdkErr.system = result?.os?.name || "";
    sdkErr.system_version = result?.os?.version || "";

    await sdkErr.save();
  }

  private setUser(obj: any, data: any) {
    if (data.uid) obj.uid = String(data.uid);
    if (data.p) obj.phone = func.decryptPhone(data.p);
  }

  async saveWebReportDatasForRedis() {
    const count = this.cfg.redis_consumption?.thread_web || 1000;
    const appAjaxs: Record<string, any[]> = {};
    const appErrors: Record<string, any[]> = {};
    for (let i = 0; i < count; i++) {
      await this.getWebItemDataForRedis({ appAjaxs, appErrors });
    }
    for (const appId of Object.keys(appAjaxs)) {
      const model = await this.ch.WebAjax(appId);
      if (appAjaxs[appId]?.length) await model.insertMany(appAjaxs[appId]);
    }
    for (const appId of Object.keys(appErrors)) {
      const model = await this.ch.WebError(appId);
      if (appErrors[appId]?.length) await model.insertMany(appErrors[appId]);
    }
  }

  private async handleWebData(query: any) {
    const type = query.type || 1;
    let item: any = {
      app_id: query.appId,
      create_time: new Date(query.time),
      user_agent: query.user_agent,
      ip: query.ip,
      mark_page: query.markPage || func.randomString(),
      mark_user: query.markUser || "",
      mark_uv: query.markUv || "",
      mark_device: query.markDevice || "",
      url: query.url,
      p: query.p,
      uid: query.uid,
    };
    if (type === 1) {
      item = Object.assign(item, {
        is_first_in: query.isFristIn ? 2 : 1,
        pre_url: query.preUrl,
        performance: query.performance,
        error_list: query.errorList,
        resource_list: query.resourceList,
        screenwidth: query.screenwidth,
        screenheight: query.screenheight,
      });
    } else if (type === 2 || type === 3 || type === 4 || type === 5) {
      item = Object.assign(item, {
        error_list: query.errorList,
        resource_list: query.resourceList,
        customs: query.customs,
      });
    }
    return item;
  }

  private forEachResources(
    data: any,
    system: any,
    appAjaxs: Record<string, any[]>
  ) {
    if (!data.resource_list || !data.resource_list.length) return;
    data.resource_list.forEach((item: any) => {
      if (
        item.type === "xmlhttprequest" ||
        item.type === "fetchrequest" ||
        item.type === "fetch"
      ) {
        if (system.is_statisi_ajax === 0) this.saveAjaxs(data, item, appAjaxs);
      } else {
        if (system.is_statisi_resource === 0)
          this.saveResours(data, item, system);
      }
    });
  }

  private async saveAjaxs(
    data: any,
    item: any,
    appAjaxs: Record<string, any[]>
  ) {
    let newName = "";
    try {
      const newurl = new URL(func.urlHelper(item.name));
      newName = `${newurl.protocol}//${newurl.host}${newurl.pathname}`;
    } catch {
      newName = item.name || "";
    }
    const duration = Math.floor(Math.abs(item.duration || 0));

    const model = await this.ch.WebAjax(data.app_id);
    const _ajax = model.build();
    _ajax.app_id = data.app_id;
    _ajax.create_time = data.create_time;
    _ajax.url = newName || "";
    _ajax.full_url = item.name || "";
    _ajax.method = item.method || "";
    _ajax.duration = duration;
    _ajax.decoded_body_size = item.decodedBodySize
      ? Number(item.decodedBodySize)
      : 0;
    _ajax.call_url = data.url || "";
    if (item.options) _ajax.options = func.filterKeyWord(item.options);
    try {
      const newurl = new URL(item.name);
      if (newurl.searchParams.toString())
        _ajax.query = newurl.searchParams.toString();
    } catch {}
    if (item.traceId) _ajax.trace_id = item.traceId;
    if (data.uid) _ajax.uid = String(data.uid);
    if (data.p) _ajax.phone = func.decryptPhone(data.p);
    _ajax.mark_page = data.mark_page || "";
    _ajax.mark_user = data.mark_user || "";

    const bucket = appAjaxs[data.app_id];
    if (bucket) bucket.push(_ajax);
    else appAjaxs[data.app_id] = [_ajax];
  }

  private async collectErrors(data: any, appErrors: Record<string, any[]>) {
    if (!data.error_list || !data.error_list.length) return;
    for (const item of data.error_list) {
      if (
        item?.data?.resourceUrl &&
        item.data.resourceUrl.startsWith("data://image")
      )
        continue;

      let newName = "";
      try {
        const newurl = new URL(func.urlHelper(item?.data?.resourceUrl || ""));
        newName = `${newurl.protocol}//${newurl.host}${newurl.pathname}`;
      } catch {
        newName = item?.data?.resourceUrl || "";
      }

      const model = await this.ch.WebError(data.app_id);
      const errors = model.build();
      errors.resource_url = newName || "";
      errors.full_url = item?.data?.resourceUrl || "";
      errors.url = data.url || "";
      errors.create_time = item.t ? new Date(item.t) : data.create_time;

      if (typeof item.msg === "object") errors.msg = JSON.stringify(item.msg);
      else if (typeof item.msg === "string") errors.msg = item.msg;
      else errors.msg = item.msg || "";

      errors.type = item.n || "";
      errors.name = item.name || "";
      errors.api = item.api || "";
      if (Array.isArray(item.stack)) errors.stack = JSON.stringify(item.stack);
      errors.target = item?.data?.target || "";
      errors.status = item?.data?.status ? String(item.data.status) : "";
      errors.col = item?.data?.col ? String(item.data.col) : "";
      errors.line = item?.data?.line ? String(item.data.line) : "";
      errors.method = item.method || "";

      try {
        const u = new URL(item?.data?.resourceUrl || "");
        if (u.searchParams.toString()) errors.query = u.searchParams.toString();
      } catch {}
      if (item.options) errors.options = func.filterKeyWord(item.options);
      if (item.traceId) errors.trace_id = item.traceId;

      errors.mark_page = data.mark_page || "";
      errors.mark_user = data.mark_user || "";
      if (data.uid) errors.uid = String(data.uid);
      if (data.p) errors.phone = func.decryptPhone(data.p);

      const bucket = appErrors[data.app_id];
      if (bucket) bucket.push(errors);
      else appErrors[data.app_id] = [errors];
    }
  }
}
