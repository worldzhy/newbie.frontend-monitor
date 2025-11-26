// ts:src/modules/web/services/resource.service.ts
import { Injectable } from '@nestjs/common';
import { MongoModelsService } from '../../../models/mongo/mongo.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ResourceService {
  private cfg: any;
  constructor(private readonly mongo: MongoModelsService, private readonly config: ConfigService) {
    this.cfg = this.config.get('frontend-monitor');
  }

  async getResourceForType(appId: string, url: string, speedType: number, pageNo: number, pageSize: number, beginTime?: string, endTime?: string) {
    const match: any = { url, speed_type: Number(speedType) };
    if (beginTime && endTime) match.create_time = { $gte: new Date(beginTime), $lte: new Date(endTime) };
    const count = await this.mongo.WebResource(appId).count(match).read('secondaryPreferred').exec();
    const datalist = await this.mongo.WebResource(appId).aggregate([
      { $match: match }, { $sort: { create_time: -1 } }, { $skip: (Number(pageNo) - 1) * Number(pageSize) }, { $limit: Number(pageSize) }
    ]).read('secondaryPreferred').exec();
    return { datalist, totalNum: count, pageNo: Number(pageNo) };
  }

  async getAverageResourceList(query: any) {
    const { appId, type = 1, pageNo = 1, pageSize = this.cfg.pageSize, beginTime, endTime, url } = query;
    const match: any = { speed_type: Number(type) };
    if (url) match.name = { $regex: new RegExp(url, 'i') };
    if (beginTime || endTime) {
      const create_time: any = {};
      if (beginTime) create_time.$gte = new Date(beginTime);
      if (endTime) create_time.$lte = new Date(endTime);
      match.create_time = create_time;
    }
    const group_id = { url: '$name', method: '$method' };
    const count = await this.mongo.WebResource(appId).distinct('name', match).read('secondaryPreferred').exec();
    const datalist = await this.mongo.WebResource(appId).aggregate([
      { $match: match },
      { $group: { _id: group_id, count: { $sum: 1 }, duration: { $avg: '$duration' }, body_size: { $avg: '$decoded_body_size' } } },
      { $skip: (Number(pageNo) - 1) * Number(pageSize) },
      { $limit: Number(pageSize) },
      { $sort: { count: -1 } }
    ]).read('secondaryPreferred').exec();
    return { datalist, totalNum: count.length, pageNo: Number(pageNo) };
  }

  async getOneResourceAvg(appId: string, url: string, beginTime?: string, endTime?: string) {
    const match: any = { name: url };
    if (beginTime && endTime) match.create_time = { $gte: new Date(beginTime), $lte: new Date(endTime) };
    const rows = await this.mongo.WebResource(appId).aggregate([
      { $match: match },
      { $group: { _id: null, count: { $sum: 1 }, duration: { $avg: '$duration' }, body_size: { $avg: '$decoded_body_size' } } }
    ]).read('secondaryPreferred').exec();
    return rows?.[0] || {};
  }

  async getOneResourceList(appId: string, url: string, pageNo = 1, pageSize = this.cfg.pageSize, beginTime?: string, endTime?: string) {
    const match: any = { name: url };
    if (beginTime && endTime) match.create_time = { $gte: new Date(beginTime), $lte: new Date(endTime) };
    const count = await this.mongo.WebResource(appId).count(match).read('secondaryPreferred').exec();
    const datalist = await this.mongo.WebResource(appId).aggregate([
      { $match: match }, { $sort: { create_time: -1 } }, { $skip: (Number(pageNo) - 1) * Number(pageSize) }, { $limit: Number(pageSize) }
    ]).read('secondaryPreferred').exec();
    return { datalist, totalNum: count, pageNo: Number(pageNo) };
  }

  async getOneResourceDetail(appId: string, id: string) {
    return await this.mongo.WebResource(appId).findOne({ _id: id }).read('secondaryPreferred').exec();
  }
}