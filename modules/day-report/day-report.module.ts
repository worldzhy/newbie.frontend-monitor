import {Module} from '@nestjs/common';
import {DayReportNumService} from './day-report-num.service';
import {RedisModule} from '../../models/redis/redis.module';
import {ConfigModule} from '@nestjs/config';
import {MongoModelsModule} from '../../models/mongo/mongo.module';

@Module({
  imports: [ConfigModule, RedisModule, MongoModelsModule],
  providers: [DayReportNumService],
  exports: [DayReportNumService],
})
export class DayReportModule {}
