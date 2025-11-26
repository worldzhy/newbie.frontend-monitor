import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Schema as MongooseSchema } from 'mongoose';

import { SystemSchema } from './system.schema';
import { EmailSchema } from './email.schema';
import { DayReportNumSchema } from './day-report-num.schema';

import { WebEnvironmentSchema } from './web/web-environment.schema';
import { WebPageSchema } from './web/web-page.schema';
import { WebResourceSchema } from './web/web-resource.schema';
import { WebCustomSchema, WebCustomFilterSchema } from './web/web-custom.schema';
import { WebPvuvipSchema } from './web/web-pvuvip.schema';

import { WxPageSchema } from './wx/wx-page.schema';
import { WxCustomSchema, WxCustomFilterSchema } from './wx/wx-custom.schema';
import { WxPvuvipSchema } from './wx/wx-pvuvip.schema';

@Injectable()
export class MongoModelsService {
  constructor(@InjectConnection() private readonly conn: Connection) {}

  private getModel(name: string, schema: MongooseSchema) {
    return this.conn.models[name] || this.conn.model(name, schema);
  }

  // Static models
  System() {
    return this.getModel('System', SystemSchema);
  }

  Email() {
    return this.getModel('Email', EmailSchema);
  }

  DayReportNum() {
    return this.getModel('DayReportNum', DayReportNumSchema);
  }

  // WEB dynamic models (by appId)
  WebEnvironment(appId: string) {
    return this.getModel(`web_environment_${appId}`, WebEnvironmentSchema);
  }

  WebPage(appId: string) {
    return this.getModel(`web_pages_${appId}`, WebPageSchema);
  }

  WebResource(appId: string) {
    return this.getModel(`web_resources_${appId}`, WebResourceSchema);
  }

  WebCustom(appId: string) {
    return this.getModel(`web_custom_${appId}`, WebCustomSchema);
  }

  WebCustomFilter(appId: string) {
    return this.getModel(`web_custom_filters_${appId}`, WebCustomFilterSchema);
  }

  // WEB pvuvip is static in v4
  WebPvuvip() {
    return this.getModel('WebPvUvIp', WebPvuvipSchema);
  }

  // WX dynamic models (by appId)
  WxPage(appId: string) {
    return this.getModel(`wx_pages_${appId}`, WxPageSchema);
  }

  WxCustom(appId: string) {
    return this.getModel(`wx_custom_${appId}`, WxCustomSchema);
  }

  WxCustomFilter(appId: string) {
    return this.getModel(`wx_custom_filters_${appId}`, WxCustomFilterSchema);
  }

  // WX pvuvip is static in v4
  WxPvuvip() {
    return this.getModel('WxPvUvIp', WxPvuvipSchema);
  }
}