import {Module} from '@nestjs/common';
import {JobsService} from './jobs.service';
import {RedisModule} from '../../models/redis/redis.module';
import {SystemModule} from '../../modules/system/system.module';

import {DayReportModule} from '../../modules/day-report/day-report.module';
import {ClickhouseModule} from '../../models/clickhouse/clickhouse.module';

import {WebModule} from '../../modules/web/web.module';
import {WxModule} from '../../modules/wx/wx.module';

// WxPvuvip is created lazily by MonitorModelsService on the shared connection,
// so no MongooseModule.forFeature registration is needed here.
@Module({
  imports: [RedisModule, SystemModule, DayReportModule, ClickhouseModule, WebModule, WxModule],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
