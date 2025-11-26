// ts:src/modules/web/services/analysis.service.ts
import { Injectable } from '@nestjs/common';
import { MongoModelsService } from '../../../models/mongo/mongo.service';
import { ClickhouseService } from '../../../models/clickhouse/clickhouse.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AnalysisService {
  private cfg: any;
  constructor(private readonly mongo: MongoModelsService, private readonly ch: ClickhouseService, private readonly config: ConfigService) {
    this.cfg = this.config.get('frontend-monitor');
  }

  async getAnalysislist(appId: string, beginTime?: string, endTime?: string, filter?: { phone?: string; uid?: string }) {
    const query: any = { $match: {} };
    if (filter?.phone) query.$match.phone = filter.phone;
    if (filter?.uid) query.$match.uid = filter.uid;
    const create_time: any = {};
    if (beginTime) { create_time.$gte = new Date(beginTime); query.$match.create_time = create_time; }
    if (endTime) { create_time.$lte = new Date(endTime); query.$match.create_time = create_time; }
    const result = await this.mongo.WebEnvironment(appId).aggregate([
      query,
      { $group: { _id: { markuser: '$mark_user' }, visitTime: { $first: '$create_time' } } },
      { $sort: { visitTime: 1 } }
    ]).read('secondaryPreferred').exec();
    return { list: result };
  }

  async getAnalysisOneList(appId: string, markuser: string) {
    return await this.mongo.WebEnvironment(appId).find({ mark_user: markuser }).read('secondaryPreferred').sort({ create_time: 1 }).exec();
  }

  async getTopDatas(appId: string, beginTime?: string, endTime?: string) {
    const top_pages = await this.getRealTimeTopPagesForDb(appId, beginTime, endTime);
    const top_jump_out = await this.getRealTimeTopJumpOutForDb(appId, beginTime, endTime);
    const top_browser = await this.getRealTimeTopBrowserForDb(appId, beginTime, endTime);
    const provinces = await this.getRealTimeTopProvinceForDb(appId, beginTime, endTime);
    return { top_pages, top_jump_out, top_browser, provinces };
  }

  async getProvinceCount(appId: string, beginTime?: string, endTime?: string) {
    const res = await this.getRealTimeTopProvinceForDb(appId, beginTime, endTime);
    return { provinces: res };
  }

  private getMatch(beginTime?: string, endTime?: string) {
    const $match: any = {};
    const create_time: any = {};
    if (beginTime) { create_time.$gte = new Date(beginTime); $match.create_time = create_time; }
    if (endTime) { create_time.$lte = new Date(endTime); $match.create_time = create_time; }
    return $match;
  }

  private async getRealTimeTopPagesForDb(appId: string, beginTime?: string, endTime?: string) {
    const $match = this.getMatch(beginTime, endTime);
    return await this.mongo.WebPage(appId).aggregate([
      { $match: { ...$match } },
      { $group: { _id: { url: '$url' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: this.cfg.top_alalysis_size?.web || 10 }
    ]).read('secondaryPreferred').exec();
  }

  private async getRealTimeTopJumpOutForDb(appId: string, beginTime?: string, endTime?: string) {
    const $match = this.getMatch(beginTime, endTime);
    return await this.mongo.WebEnvironment(appId).aggregate([
      { $match: $match },
      { $group: { _id: { mark_user: '$mark_user' }, urls: { $push: '$url' }, count: { $sum: 1 } } },
      { $match: { count: 1 } },
      { $group: { _id: { value: { $arrayElemAt: ['$urls', 0] } }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: this.cfg.top_alalysis_size?.web || 10 }
    ]).read('secondaryPreferred').exec();
  }

  private async getRealTimeTopBrowserForDb(appId: string, beginTime?: string, endTime?: string) {
    const $match = this.getMatch(beginTime, endTime);
    return await this.mongo.WebEnvironment(appId).aggregate([
      { $match: { ...$match } },
      { $group: { _id: { browser: '$browser' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: this.cfg.top_alalysis_size?.web || 10 }
    ]).read('secondaryPreferred').exec();
  }

  private async getRealTimeTopProvinceForDb(appId: string, beginTime?: string, endTime?: string) {
    const $match = this.getMatch(beginTime, endTime);
    return await this.mongo.WebEnvironment(appId).aggregate([
      { $match: { ...$match } },
      { $group: { _id: { province: '$province' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: this.cfg.top_alalysis_size?.web || 10 }
    ]).read('secondaryPreferred').exec();
  }
}