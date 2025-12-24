import {Module} from '@nestjs/common';
import {SystemService} from './system.service';
import {SystemController} from './system.controller';
import {MongooseModule} from '@nestjs/mongoose';
import {System, SystemSchema} from '../../models/mongo/system.schema';
import {Email, EmailSchema} from '../../models/mongo/email.schema';
import {DayReportNum, DayReportNumSchema} from '../../models/mongo/day-report-num.schema';
import {NodeCacheService} from '../../shared/node-cache.service';
import {MongoModelsModule} from '../../models/mongo/mongo.module';

@Module({
  imports: [
    MongoModelsModule,
    MongooseModule.forFeature([
      {name: System.name, schema: SystemSchema},
      {name: Email.name, schema: EmailSchema},
      {name: DayReportNum.name, schema: DayReportNumSchema},
    ]),
  ],
  controllers: [SystemController],
  providers: [SystemService, NodeCacheService],
  exports: [SystemService, NodeCacheService],
})
export class SystemModule {}
