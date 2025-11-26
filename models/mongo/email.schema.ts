import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Email {
  @Prop() email: string; // Email address
  @Prop() name: string; // User name
  @Prop({ type: Array, default: [] }) system_ids: any[]; // Owned application IDs
  @Prop({ default: Date.now }) create_time: Date; // Created time
}
export type EmailDocument = Email & Document;
export const EmailSchema = SchemaFactory.createForClass(Email);
EmailSchema.index({ email: -1 });