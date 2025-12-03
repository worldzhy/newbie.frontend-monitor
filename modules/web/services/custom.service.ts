import { Injectable } from '@nestjs/common';
import { MongoModelsService } from '../../../models/mongo/mongo.service';

@Injectable()
export class WebCustomService {
  constructor(private readonly mongo: MongoModelsService) {}

  async getCustomFilterList(appId: string) {
    const rows = await this.mongo
      .WebCustomFilter(appId)
      .find()
      .sort({ create_time: -1 })
      .read('secondaryPreferred')
      .exec();
    return { list: rows || [] };
  }

  async addCustomFilter(appId: string, filterKey: string, filterDesc: string) {
    if (!filterKey) throw new Error('新增过滤条件：filterKey不能为空');
    if (!appId) throw new Error('新增过滤条件：appId不能为空');
    if (!filterDesc) throw new Error('新增过滤条件：filterDesc不能为空');
    const model = this.mongo.WebCustomFilter(appId);
    const exists = await model.findOne({ filterKey }).exec();
    if (exists && exists.filterKey) throw new Error('新增过滤条件：filterKey已存在');
    const doc = new model();
    doc.app_id = appId;
    doc.filterKey = filterKey;
    doc.filterDesc = filterDesc;
    await doc.save();
    return true;
  }

  async delCustomFilter(appId: string, id: string) {
    if (!id) throw new Error('删除过滤条件：_id不能为空');
    if (!appId) throw new Error('删除过滤条件：appId不能为空');
    const model = this.mongo.WebCustomFilter(appId);
    try {
      await model.findOne({ _id: id }).exec();
    } catch {
      throw new Error('删除过滤条件：_id不存在');
    }
    try {
      await model.deleteOne({ _id: id }).exec();
      return true;
    } catch {
      throw new Error('删除过滤条件：删除失败');
    }
  }

  async getAverageCustomList(
    appId: string,
    pageNo: number,
    pageSize: number,
    beginTime?: string,
    endTime?: string,
    customName?: string,
    customFilter?: Record<string, any>
  ) {
    const filter: any = {};
    if (customName) filter.customName = { $regex: customName, $options: 'i' };
    const create_time: any = {};
    if (beginTime) { create_time.$gte = new Date(beginTime); filter.create_time = create_time; }
    if (endTime) { create_time.$lte = new Date(endTime); filter.create_time = create_time; }
    if (customFilter && Object.prototype.toString.apply(customFilter) === '[object Object]') {
      Object.keys(customFilter).forEach(key => {
        if (customFilter[key] !== null && customFilter[key] !== '' && typeof customFilter[key] !== 'undefined') {
          filter[`customFilter.${key}`] = { $regex: customFilter[key], $options: 'i' };
        }
      });
    }
    const model = this.mongo.WebCustom(appId);
    const totalNum = await model.count(filter).read('secondaryPreferred').exec();
    const datalist = await model
      .find(filter)
      .skip((Number(pageNo) - 1) * Number(pageSize))
      .limit(Number(pageSize))
      .sort({ create_time: -1 })
      .read('secondaryPreferred')
      .exec();
    return { totalNum, datalist, pageNo: Number(pageNo) };
  }
}