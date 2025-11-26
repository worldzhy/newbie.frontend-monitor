import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ shardKey: { _id: 'hashed' } })
export class WxPage {
  @Prop() app_id: string; // App ID
  @Prop({ default: Date.now }) create_time: Date; // Created time
  @Prop() path: string; // Current path
  @Prop({ type: MongooseSchema.Types.Mixed }) options: any; // Path params
  @Prop() mark_page: string; // Page mark
  @Prop() mark_user: string; // User mark
  @Prop() mark_uv: string; // UV mark
  @Prop() mark_device: string; // Device mark
  @Prop() net: string; // Network type
  @Prop() ip: string; // User IP
  @Prop() county: string; // Country
  @Prop() province: string; // Province
  @Prop() city: string; // City
  @Prop() brand: string; // Device brand
  @Prop() model: string; // Device model
  @Prop() screenWidth: string; // Screen width
  @Prop() screenHeight: string; // Screen height
  @Prop() language: string; // WeChat language
  @Prop() version: string; // WeChat version
  @Prop() system: string; // OS version
  @Prop() platform: string; // Platform
  @Prop() SDKVersion: string; // Base library version
  @Prop() phone: string; // User phone
  @Prop() uid: string; // User ID
}
export type WxPageDocument = WxPage & Document;
export const WxPageSchema = SchemaFactory.createForClass(WxPage);
WxPageSchema.index({ create_time: -1 });
WxPageSchema.index({ mark_page: -1 });
WxPageSchema.index({ mark_user: -1 });