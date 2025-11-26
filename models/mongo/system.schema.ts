import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class System {
  @Prop() system_domain: string; // System domain
  @Prop() system_name: string; // System name
  @Prop() app_id: string; // App ID
  @Prop({ default: 'web' }) type: string; // App type: web / wx 
  @Prop({ type: [String], default: [] }) user_id: string[]; // Owner user IDs
  @Prop({ default: Date.now }) create_time: Date; // Creation time
  @Prop({ default: 0 }) is_use: number; // Enable statistics: 0 yes, 1 no
  @Prop({ default: 5 }) slow_page_time: number; // Slow page threshold (s)
  @Prop({ default: 2 }) slow_js_time: number; // Slow JS threshold (s)
  @Prop({ default: 2 }) slow_css_time: number; // Slow CSS threshold (s)
  @Prop({ default: 2 }) slow_img_time: number; // Slow image threshold (s)
  @Prop({ default: 2 }) slow_ajax_time: number; // Slow AJAX threshold (s)
  @Prop({ default: 0 }) is_statisi_pages: number; // Collect page perf: 0 yes, 1 no
  @Prop({ default: 0 }) is_statisi_ajax: number; // Collect AJAX perf
  @Prop({ default: 0 }) is_statisi_resource: number; // Collect resource perf
  @Prop({ default: 0 }) is_statisi_system: number; // Store user system info
  @Prop({ default: 0 }) is_statisi_error: number; // Report page errors
  @Prop({ default: 0 }) is_daily_use: number; // Send daily report
  @Prop({ type: [String], default: [] }) daliy_list: string[]; // Daily report recipients
  @Prop({ default: 0 }) is_highest_use: number; // Send PV peak emails
  @Prop({ default: 0 }) is_warning: number; // Enable alerts (1 on, 0 off)
  @Prop({ type: [String], default: [] }) highest_list: string[]; // PV peak recipients
}
export type SystemDocument = System & Document;
export const SystemSchema = SchemaFactory.createForClass(System);
SystemSchema.index({ app_id: -1, create_time: 1, system_domain: -1, user_id: -1 });