import { Module } from '@nestjs/common';
import { RemoveController } from './remove.controller';
import { RemoveService } from './remove.service';
import { MongoModelsModule } from '../../models/mongo/mongo.module';
import { ClickhouseModule } from '../../models/clickhouse/clickhouse.module';

@Module({
  imports: [MongoModelsModule, ClickhouseModule],
  controllers: [RemoveController],
  providers: [RemoveService],
  exports: [RemoveService],
})
export class RemoveModule {}
