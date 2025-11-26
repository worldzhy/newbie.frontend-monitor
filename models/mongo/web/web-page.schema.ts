import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ shardKey: { _id: 'hashed' } })
export class WebPage {
  @Prop() app_id: string; // App ID
  @Prop({ default: Date.now }) create_time: Date; // Visit time
  @Prop() url: string; // URL domain
  @Prop() full_url: string; // Full URL
  @Prop() pre_url: string; // Referrer URL
  @Prop() speed_type: number; // 1: normal, 2: slow
  @Prop() is_first_in: number; // 2: first in session, 1: not first
  @Prop() mark_page: string; // Page mark
  @Prop() mark_user: string; // User mark
  @Prop() load_time: number; // Full load time (ms)
  @Prop() dns_time: number; // DNS time (ms)
  @Prop() tcp_time: number; // TCP connect time (ms)
  @Prop() dom_time: number; // DOM build time (ms)
  @Prop({ type: [Object], default: [] }) resource_list: any[]; // Resource performance list
  @Prop() total_res_size: number; // Total resource size
  @Prop() white_time: number; // First paint (ms)
  @Prop() redirect_time: number; // Redirect time
  @Prop() unload_time: number; // Unload time
  @Prop() request_time: number; // Request time
  @Prop() analysisDom_time: number; // DOM parsing time
  @Prop() ready_time: number; // Page ready time
  @Prop() screenwidth: number; // Screen width
  @Prop() screenheight: number; // Screen height
}
export type WebPageDocument = WebPage & Document;
export const WebPageSchema = SchemaFactory.createForClass(WebPage);
WebPageSchema.index({ speed_type: 1, is_first_in: 1, url: 1, create_time: -1 });
WebPageSchema.index({ create_time: -1 });