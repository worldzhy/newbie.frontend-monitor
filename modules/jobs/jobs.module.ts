import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobsService } from './jobs.service';
import { RedisModule } from '../../models/redis/redis.module';
import { SystemModule } from '../../modules/system/system.module';

import { DayReportModule } from '../../modules/day-report/day-report.module';
import { ClickhouseModule } from '../../models/clickhouse/clickhouse.module';

import { WxPvuvip, WxPvuvipSchema } from '../../models/mongo/wx/wx-pvuvip.schema';
import { WebModule } from '../../modules/web/web.module';
import { WxModule } from '../../modules/wx/wx.module';

@Module({
  imports: [
    RedisModule,
    SystemModule,
    DayReportModule,
    ClickhouseModule,
    WebModule,
    WxModule,
    MongooseModule.forFeature([{ name: WxPvuvip.name, schema: WxPvuvipSchema }])
  ],
  providers: [JobsService],
  exports: [JobsService]
})
export class JobsModule {}