import {Injectable, OnModuleInit} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {ClickhouseOrm} from 'clickhouse-orm';

import WebAjaxFactory from './web/ajax';
import WebErrorFactory from './web/error';
import WebSdkErrorFactory from './web/sdk-error';
import WxAjaxFactory from './wx/ajax';
import WxErrorFactory from './wx/error';
import WxEventFactory from './wx/event';
import WxSdkErrorFactory from './wx/sdk-error';

@Injectable()
export class ClickhouseService implements OnModuleInit {
  private chOrm: any;

  private webAjaxFactory: (appId: string) => Promise<any>;
  private webErrorFactory: (appId: string) => Promise<any>;
  private wxAjaxFactory: (appId: string) => Promise<any>;
  private wxErrorFactory: (appId: string) => Promise<any>;
  private wxEventFactory: (appId: string) => Promise<any>;
  private webSdkErrorFactory: () => Promise<any>;
  private wxSdkErrorFactory: () => Promise<any>;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const clickhouseConfig = this.configService.getOrThrow<{
      url: string;
      username: string;
      password: string;
      database: string;
    }>('microservices.clickhouse');
    const clickhouseDB = this.configService.get<string>('microservices.frontend-monitor.clickhouseDB');

    const cfg = (() => {
      return {
        url: clickhouseConfig.url.split(':')[0] + ':' + clickhouseConfig.url.split(':')[1],
        port: clickhouseConfig.url.split(':')[2],
        username: clickhouseConfig.username,
        password: clickhouseConfig.password,
        db: clickhouseDB || clickhouseConfig.database,
        debug: false,
        cluster: undefined,
      };
    })();
    const basicAuth = {
      username: cfg.username || 'default',
      password: cfg.password || '',
    };
    const chOrm = ClickhouseOrm({
      db: {name: cfg.db, cluster: cfg.cluster},
      debug: cfg.debug || false,
      client: {
        url: cfg.url || 'http://localhost',
        port: cfg.port || 8123,
        basicAuth,
        debug: false,
        isUseGzip: true,
        format: 'json',
      },
    });
    await chOrm.createDatabase();
    this.chOrm = chOrm;

    this.webAjaxFactory = WebAjaxFactory(this.chOrm);
    this.webErrorFactory = WebErrorFactory(this.chOrm);
    this.webSdkErrorFactory = WebSdkErrorFactory(this.chOrm);

    this.wxAjaxFactory = WxAjaxFactory(this.chOrm);
    this.wxErrorFactory = WxErrorFactory(this.chOrm);
    this.wxEventFactory = WxEventFactory(this.chOrm);
    this.wxSdkErrorFactory = WxSdkErrorFactory(this.chOrm);
  }

  getOrm() {
    return this.chOrm;
  }

  async WebAjax(appId: string) {
    return this.webAjaxFactory(appId);
  }

  async WebError(appId: string) {
    return this.webErrorFactory(appId);
  }

  async WxAjax(appId: string) {
    return this.wxAjaxFactory(appId);
  }

  async WxError(appId: string) {
    return this.wxErrorFactory(appId);
  }

  async WxEvent(appId: string) {
    return this.wxEventFactory(appId);
  }

  async WebSdkError() {
    return this.webSdkErrorFactory();
  }

  async WxSdkError() {
    return this.wxSdkErrorFactory();
  }
}
