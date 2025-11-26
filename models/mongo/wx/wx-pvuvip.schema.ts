import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class WxPvuvip {
  @Prop() app_id: string; // App ID
  @Prop() pv: number; // PV count
  @Prop() uv: number; // UV count
  @Prop() ip: number; // IP count
  @Prop() ajax: number; // AJAX call count
  @Prop() bounce: string; // Bounce rate
  @Prop() depth: number; // Average visit depth
  @Prop() flow: number; // Total traffic cost
  @Prop({ default: 1 }) type: number; // 1: per-minute 2: per-day
  @Prop({ default: Date.now }) create_time: Date; // Created time
}
export type WxPvuvipDocument = WxPvuvip & Document;
export const WxPvuvipSchema = SchemaFactory.createForClass(WxPvuvip);
WxPvuvipSchema.index({ type: 1, app_id: 1, create_time: -1 });
WxPvuvipSchema.index({ create_time: -1 });