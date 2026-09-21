import {Global, Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {MonitorClickhouseService} from './monitor-clickhouse.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [MonitorClickhouseService],
  exports: [MonitorClickhouseService],
})
export class MonitorClickhouseModule {}
