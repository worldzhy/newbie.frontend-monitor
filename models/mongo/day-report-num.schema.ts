import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class DayReportNum {
  @Prop() app_id: string; // App ID
  @Prop({ default: '' }) type: string; // App type: web / wx
  @Prop({ default: Date.now }) day_time: Date; // Target day time
  @Prop({ default: Date.now }) create_time: Date; // Record created time
  @Prop({ default: 0 }) num: number; // Report count
}
export type DayReportNumDocument = DayReportNum & Document;
export const DayReportNumSchema = SchemaFactory.createForClass(DayReportNum);
DayReportNumSchema.index({ app_id: 1, day_time: -1 });