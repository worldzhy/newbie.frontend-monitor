import {Global, Module} from '@nestjs/common';
import {MongooseModule} from '@nestjs/mongoose';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {MongoModelsService} from './mongo.service';
import {System, SystemSchema} from './system.schema';
import {Email, EmailSchema} from './email.schema';
import {DayReportNum, DayReportNumSchema} from './day-report-num.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const uri = config.get('microservices.frontend-monitor.mongoose.uri');
        return {uri};
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      {name: System.name, schema: SystemSchema},
      {name: Email.name, schema: EmailSchema},
      {name: DayReportNum.name, schema: DayReportNumSchema},
    ]),
  ],
  providers: [MongoModelsService],
  exports: [MongoModelsService],
})
export class MongoModelsModule {}
