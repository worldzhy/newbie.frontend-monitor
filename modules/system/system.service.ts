import { Injectable } from "@nestjs/common";
import { MongoModelsService } from "../../models/mongo/mongo.service";
import { NodeCacheService } from "../../shared/node-cache.service";
import { func } from "../../shared/utils";

@Injectable()
export class SystemService {
  constructor(
    private readonly mongo: MongoModelsService,
    private readonly nodeCache: NodeCacheService
  ) {}

  async saveSystemData(body: any) {
    const type = body.type;
    if (!body.system_domain && type === "web")
      return func.errResult({ desc: "新增系统信息操作：系统域名不能为空" });
    if (!body.app_id && type === "wx")
      return func.errResult({ desc: "新增系统信息操作：appId不能为空" });
    if (!body.system_name)
      return func.errResult({ desc: "新增系统信息操作：系统名称不能为空" });

    if (type === "web") {
      const search = await this.mongo
        .System()
        .findOne({ system_domain: body.system_domain })
        .exec();
      if (search && search.system_domain)
        return func.errResult({ desc: "新增系统信息操作：系统已存在" });
    }
    if (type === "wx") {
      const r = await this.mongo
        .System()
        .findOne({ app_id: body.app_id })
        .exec();
      if (r && r.app_id)
        return func.errResult({
          desc: "新增系统信息操作：系统已存在,appid重复",
        });
    }

    const appId = body.app_id ? body.app_id : func.randomString();
    const SystemModel = this.mongo.System();
    const system = new SystemModel();
    system.system_domain = body.system_domain;
    system.system_name = body.system_name;
    system.type = body.type;
    system.app_id = appId;
    system.user_id = [body.token || ""];
    system.create_time = new Date();
    system.is_use = body.is_use;
    system.slow_page_time = body.slow_page_time || 5;
    system.slow_js_time = body.slow_js_time || 2;
    system.slow_css_time = body.slow_css_time || 2;
    system.slow_img_time = body.slow_img_time || 2;
    system.slow_ajax_time = body.slow_ajax_time || 2;
    system.is_statisi_pages = body.is_statisi_pages;
    system.is_statisi_ajax = body.is_statisi_ajax;
    system.is_statisi_resource = body.is_statisi_resource;
    system.is_statisi_system = body.is_statisi_system;
    system.is_statisi_error = body.is_statisi_error;
    system.is_warning = body.is_warning;

    const result = await system.save();
    await this.updateSystemNodeCache(appId);
    return func.result({ data: result });
  }

  async updateSystemData(body: any) {
    const appId = body.app_id;
    if (!appId)
      return func.errResult({ desc: "更新系统信息操作：app_id不能为空" });

    const update = {
      $set: {
        is_use: body.is_use || 0,
        system_name: body.system_name || "",
        system_domain: body.system_domain || "",
        slow_page_time: body.slow_page_time || 5,
        slow_js_time: body.slow_js_time || 2,
        type: body.type || "web",
        slow_css_time: body.slow_css_time || 2,
        slow_img_time: body.slow_img_time || 2,
        slow_ajax_time: body.slow_ajax_time || 2,
        is_statisi_pages: body.is_statisi_pages || 0,
        is_statisi_ajax: body.is_statisi_ajax || 0,
        is_statisi_resource: body.is_statisi_resource || 0,
        is_statisi_system: body.is_statisi_system || 0,
        is_statisi_error: body.is_statisi_error || 0,
        is_daily_use: body.is_daily_use || 0,
        is_warning: body.is_warning || 0,
      },
    };
    const result = await this.mongo
      .System()
      .updateOne({ app_id: appId }, update, { multi: true })
      .exec();
    await this.updateSystemNodeCache(appId);
    return func.result({ data: result });
  }

  async updateSystemNodeCache(appId: string) {
    const system = await this.getSystemForDb(appId);
    this.nodeCache.updateSystemCache(system as any);
  }

  async getSystemForDb(appId: string) {
    if (!appId) throw new Error("查询某个系统信：appId不能为空");
    return (
      (await this.mongo.System().findOne({ app_id: appId }).exec()) ||
      ({} as any)
    );
  }

  async getSysForUserId(query: any) {
    const { isWarning, systemName, type } = query;
    const param: any = {};
    if (isWarning) param.is_warning = parseInt(isWarning);
    if (systemName) param.system_name = new RegExp(systemName);
    if (type) param.type = type;
    return (await this.mongo.System().find(param).exec()) || [];
  }

  async getSystemForAppId(appId: string) {
    if (!appId) throw new Error("查询某个系统信：appId不能为空");
    return this.nodeCache.getAppInfo(appId) || ({} as any);
  }

  async getSysForAlarm() {
    return (
      (await this.mongo
        .System()
        .find({ is_warning: 1 })
        .read("secondaryPreferred")
        .exec()) || []
    );
  }

  async getSysForDaily() {
    return (
      (await this.mongo
        .System()
        .find({ is_daily_use: 0 })
        .read("secondaryPreferred")
        .exec()) || []
    );
  }

  async getSystemList() {
    return (await this.mongo.System().find({}).exec()) || [];
  }

  async getWebSystemList() {
    return (await this.mongo.System().find({ type: "web" }).exec()) || [];
  }
  async getWxSystemList() {
    return (await this.mongo.System().find({ type: "wx" }).exec()) || [];
  }

  async deleteWebSystemUser(appId: string, userToken: string) {
    return this.mongo
      .System()
      .updateOne(
        { app_id: appId },
        { $pull: { user_id: userToken } },
        { multi: true }
      )
      .exec();
  }
  async addWebSystemUser(appId: string, userToken: string) {
    return this.mongo
      .System()
      .updateOne(
        { app_id: appId },
        { $push: { user_id: userToken } },
        { multi: true }
      )
      .exec();
  }

  async deleteSystem(appId: string, type: string) {
    return this.mongo.System().deleteOne({ app_id: appId, type }).exec();
  }

  async handleDaliyEmail(
    appId: string,
    email: string,
    type: number,
    _handleEmali = true,
    item = 1
  ) {
    const system = await this.getSystemForDb(appId);
    if (!system) throw new Error("appId无效");
    const listKey: "daliy_list" | "highest_list" =
      item === 2 ? "highest_list" : "daliy_list";
    const update =
      type === 1
        ? { $addToSet: { [listKey]: email } }
        : { $pull: { [listKey]: email } };
    return this.mongo
      .System()
      .updateOne({ app_id: appId }, update, { multi: true })
      .exec();
  }

  async updateEmailSystemIds(
    emailAddr: string,
    appId: string,
    handletype = 1,
    handleitem = 1
  ) {
    let str = "";
    let type = "";
    if (handleitem === 1) {
      str = "每日发送日报权限";
      type = "daliy";
    } else if (handleitem === 2) {
      str = "超过历史流量峰值邮件触达";
      type = "highest";
    }
    const handleData =
      handletype === 1
        ? {
            $push: {
              system_ids: { $each: [{ system_id: appId, desc: str, type }] },
            },
          }
        : { $pull: { system_ids: { system_id: appId, type } } };
    return this.mongo
      .Email()
      .updateOne({ email: emailAddr }, handleData, { multi: true })
      .exec();
  }
}
