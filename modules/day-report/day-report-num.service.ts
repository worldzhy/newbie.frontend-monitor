import { Injectable } from '@nestjs/common';
import { MongoModelsService } from '../../models/mongo/mongo.service';
import { RedisService } from '../../models/redis/redis.service';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment';
import { func } from '../../shared/utils';

@Injectable()
export class DayReportNumService {
  private cfg: any;
  constructor(
    private readonly mongo: MongoModelsService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService
  ) {
    this.cfg = this.configService.get('frontend-monitor');
  }

  async numCountTask() {
    const date = new Date(new Date().getTime() - 86400000);
    const yesterday = new Date(func.format(date, 'yyyy/MM/dd')).getTime();
    const apps = await this.mongo.System().find().read('secondaryPreferred').exec();

    for (const app of apps) {
      const key = `day_report_num_${app.app_id}_${yesterday}`;
      const num = await this.redis.get(key);
      if (!num) continue;

      const DayModel = this.mongo.DayReportNum();
      const repore = new DayModel();
      repore.app_id = app.app_id;
      repore.type = app.type;
      repore.day_time = new Date(yesterday);
      repore.create_time = new Date();
      repore.num = Number(num);
      await repore.save();

      await this.redis.del(key);
    }
  }

  async getTodayFromRedis(appId: string, today: number) {
    return await this.redis.get(`day_report_num_${appId}_${today}`);
  }

  async getDayFromMongo(app_id: string, beginTime: string | Date, endTime: string | Date) {
    const query = {
      app_id,
      day_time: {
        $gte: new Date(moment(beginTime).format('YYYY-MM-DD 00:00:00')),
        $lte: new Date(moment(endTime).format('YYYY-MM-DD 23:59:59'))
      }
    };
    return (await this.mongo.DayReportNum().findOne(query, { num: 1, day_time: 1 }).read('secondaryPreferred').exec()) || ({} as any);
  }

  async redisCount(appId: string) {
    const date = new Date();
    const today = new Date(func.format(date, 'yyyy/MM/dd')).getTime();
    await this.redis.incr(`day_report_num_${appId}_${today}`);
  }
}