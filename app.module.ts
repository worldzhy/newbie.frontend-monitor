import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TokenMiddleware } from './common/middleware/token.middleware';
import { RedisModule } from './models/redis/redis.module';
import { ClickhouseModule } from './models/clickhouse/clickhouse.module';
import { SharedModule } from './shared/shared.module';
import { SystemModule } from './modules/system/system.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { DayReportModule } from './modules/day-report/day-report.module';
import { MongoModelsModule } from './models/mongo/mongo.module';
import { WebModule } from './modules/web/web.module';
import { WxModule } from './modules/wx/wx.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // 引用 models 的模块
    RedisModule,
    ClickhouseModule,
    // 提供 MongoModelsService
    MongoModelsModule,
    SharedModule,
    SystemModule,
    DayReportModule,
    JobsModule,
    WebModule,
    WxModule
  ],
  providers: []
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TokenMiddleware)
      .exclude(
        { path: '/api/v1/wx/report/wx', method: RequestMethod.POST },
        { path: '/api/v1/report/web', method: RequestMethod.POST }
      )
      .forRoutes('*');
  }
}