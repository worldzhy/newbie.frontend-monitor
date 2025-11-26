import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClickhouseOrm } from "clickhouse-orm";

import WebAjaxFactory from "./web/ajax";
import WebErrorFactory from "./web/error";
import WebSdkErrorFactory from "./web/sdk-error";
import WxAjaxFactory from "./wx/ajax";
import WxErrorFactory from "./wx/error";
import WxEventFactory from "./wx/event";
import WxSdkErrorFactory from "./wx/sdk-error";

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
    const raw = this.configService.get("app.clickhouse");
    const cfg = (() => {
      if (typeof raw === "string") {
        const [ch_host, ch_port, ch_username, ch_password, ch_db, ch_cluster] =
          raw.split(":");
        const url = (ch_host || "localhost").startsWith("http")
          ? ch_host || "localhost"
          : `http://${ch_host || "localhost"}`;
        return {
          url,
          port: ch_port ? Number(ch_port) : 8123,
          db: ch_db || "web_monitor",
          username: ch_username || "default",
          password: ch_password || "",
          debug: false,
          cluster: ch_cluster || false,
        };
      }
      return (
        raw || {
          url: "http://localhost",
          port: 8123,
          db: "web_monitor",
          username: "default",
          password: "",
          debug: false,
          cluster: false,
        }
      );
    })();
    const basicAuth = {
      username: cfg.username || "default",
      password: cfg.password || "",
    };
    const chOrm = ClickhouseOrm({
      db: { name: cfg.db, cluster: cfg.cluster || false },
      debug: cfg.debug || false,
      client: {
        url: cfg.url || "http://localhost",
        port: cfg.port || 8123,
        basicAuth,
        debug: false,
        isUseGzip: true,
        format: "json",
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
