import {Global, Module} from '@nestjs/common';
import {ClickhouseService} from './clickhouse.service';
import {ConfigModule} from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [ClickhouseService],
  exports: [ClickhouseService],
})
export class ClickhouseModule {}
