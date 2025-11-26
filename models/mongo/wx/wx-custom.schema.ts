import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ shardKey: { _id: 'hashed' } })
export class WxCustom {
  @Prop() app_id: string; // App ID
  @Prop({ default: Date.now }) create_time: Date; // Created time
  @Prop() mark_page: string; // Page mark
  @Prop() mark_user: string; // User mark
  @Prop() path: string; // Path
  @Prop() customName: string; // Custom name for grouping
  @Prop() customContent: string; // Custom info (stringified object)
  @Prop({ type: Object }) customFilter: any; // Custom filter defined by biz
  @Prop() phone: string; // User phone
  @Prop() uid: string; // User ID
}
export type WxCustomDocument = WxCustom & Document;
export const WxCustomSchema = SchemaFactory.createForClass(WxCustom);
WxCustomSchema.index({ create_time: -1 });

@Schema({ shardKey: { _id: 'hashed' } })
export class WxCustomFilter {
  @Prop() app_id: string; // App ID
  @Prop({ default: Date.now }) create_time: Date; // Created time
  @Prop() filterKey: string; // Filter key
  @Prop() filterDesc: string; // Filter description
}
export type WxCustomFilterDocument = WxCustomFilter & Document;
export const WxCustomFilterSchema = SchemaFactory.createForClass(WxCustomFilter);