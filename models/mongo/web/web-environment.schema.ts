import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ shardKey: { _id: 'hashed' } })
export class WebEnvironment {
  @Prop() app_id: string; // App ID
  @Prop({ default: Date.now }) create_time: Date; // Visit time
  @Prop() url: string; // Page URL
  @Prop() mark_page: string; // Page mark
  @Prop() mark_user: string; // User mark
  @Prop() mark_uv: string; // UV mark
  @Prop() mark_device: string; // Device mark
  @Prop() browser: string; // Browser name
  @Prop() borwser_version: string; // Browser version
  @Prop() system: string; // OS
  @Prop() system_version: string; // OS version
  @Prop() ip: string; // Visitor IP
  @Prop() county: string; // Country
  @Prop() province: string; // Province
  @Prop() city: string; // City
  @Prop() phone: string; // User phone
  @Prop() uid: string; // User ID
}
export type WebEnvironmentDocument = WebEnvironment & Document;
export const WebEnvironmentSchema = SchemaFactory.createForClass(WebEnvironment);
WebEnvironmentSchema.index({ create_time: -1 });
WebEnvironmentSchema.index({ mark_page: -1 });
WebEnvironmentSchema.index({ mark_user: -1 });