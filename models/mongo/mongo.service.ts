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
import { MongoCollectionPrefix, MongoStaticCollection } from '../enum';

@Injectable()
export class MongoModelsService {
  constructor(@InjectConnection() private readonly conn: Connection) {}

  private getModel(name: string, schema: MongooseSchema) {
    return this.conn.models[name] || this.conn.model(name, schema);
  }

  // Static models
  System() {
    return this.getModel(MongoStaticCollection.System, SystemSchema);
  }

  Email() {
    return this.getModel(MongoStaticCollection.Email, EmailSchema);
  }

  DayReportNum() {
    return this.getModel(MongoStaticCollection.DayReportNum, DayReportNumSchema);
  }

  // WEB dynamic models (by appId)
  WebEnvironment(appId: string) {
    return this.getModel(`${MongoCollectionPrefix.WEB_ENVIRONMENT}${appId}`, WebEnvironmentSchema);
  }

  WebPage(appId: string) {
    return this.getModel(`${MongoCollectionPrefix.WEB_PAGE}${appId}`, WebPageSchema);
  }

  WebResource(appId: string) {
    return this.getModel(`${MongoCollectionPrefix.WEB_RESOURCE}${appId}`, WebResourceSchema);
  }

  WebCustom(appId: string) {
    return this.getModel(`${MongoCollectionPrefix.WEB_CUSTOM}${appId}`, WebCustomSchema);
  }

  WebCustomFilter(appId: string) {
    return this.getModel(`${MongoCollectionPrefix.WEB_CUSTOM_FILTER}${appId}`, WebCustomFilterSchema);
  }

  // WEB pvuvip is static in v4
  WebPvuvip() {
    return this.getModel(MongoStaticCollection.WebPvUvIp, WebPvuvipSchema);
  }

  // WX dynamic models (by appId)
  WxPage(appId: string) {
    return this.getModel(`${MongoCollectionPrefix.WX_PAGE}${appId}`, WxPageSchema);
  }

  WxCustom(appId: string) {
    return this.getModel(`${MongoCollectionPrefix.WX_CUSTOM}${appId}`, WxCustomSchema);
  }

  WxCustomFilter(appId: string) {
    return this.getModel(`${MongoCollectionPrefix.WX_CUSTOM_FILTER}${appId}`, WxCustomFilterSchema);
  }

  // WX pvuvip is static in v4
  WxPvuvip() {
    return this.getModel(MongoStaticCollection.WxPvUvIp, WxPvuvipSchema);
  }
}