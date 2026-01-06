import {Module} from '@nestjs/common';
import {ScheduleModule} from '@nestjs/schedule';
import {RedisModule} from './models/redis/redis.module';
import {ClickhouseModule} from './models/clickhouse/clickhouse.module';
import {SharedModule} from './shared/shared.module';
import {SystemModule} from './modules/system/system.module';
import {JobsModule} from './modules/jobs/jobs.module';
import {DayReportModule} from './modules/day-report/day-report.module';
import {MongoModelsModule} from './models/mongo/mongo.module';
import {WebModule} from './modules/web/web.module';
import {WxModule} from './modules/wx/wx.module';
import {RemoveModule} from './modules/remove/remove.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    RedisModule,
    ClickhouseModule,
    MongoModelsModule,
    SharedModule,
    SystemModule,
    DayReportModule,
    JobsModule,
    WebModule,
    WxModule,
    RemoveModule,
  ],
  providers: [],
})
export class FrontendMonitorModule {}
