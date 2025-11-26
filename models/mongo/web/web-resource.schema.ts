import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ shardKey: { _id: 'hashed' } })
export class WebResource {
  @Prop() app_id: string; // App ID (system identifier)
  @Prop({ default: Date.now }) create_time: Date; // Visit time
  @Prop() url: string; // Page URL
  @Prop() full_url: string; // Full resource URL
  @Prop() speed_type: number; // 1: normal, 2: slow
  @Prop({ type: MongooseSchema.Types.Mixed }) resource_datas: any; // All loaded resources JSON
  @Prop() name: string; // Resource name
  @Prop({ default: 'GET' }) method: string; // Request method
  @Prop() type: string; // Resource type
  @Prop({ default: 0 }) duration: number; // Request duration (ms)
  @Prop({ default: 0 }) decoded_body_size: number; // Response size (bytes)
  @Prop({ default: 'http/1.1' }) next_hop_protocol: string; // Protocol
  @Prop() mark_page: string; // Page mark (unified tag)
  @Prop() mark_user: string; // User mark (session tag)
  @Prop() phone: string; // User phone
  @Prop() uid: string; // User ID
}
export type WebResourceDocument = WebResource & Document;
export const WebResourceSchema = SchemaFactory.createForClass(WebResource);
WebResourceSchema.index({ speed_type: 1, name: 1, create_time: -1 });
WebResourceSchema.index({ name: 1, create_time: -1 });
WebResourceSchema.index({ speed_type: 1, url: 1 });