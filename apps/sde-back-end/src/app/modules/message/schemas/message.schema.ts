import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MessageTag } from '@sde-challenge/shared-types';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  authorId: Types.ObjectId;

  @Prop({ required: true, maxlength: 240 })
  content: string;

  @Prop({ type: String, required: true, enum: Object.values(MessageTag), index: true })
  tag: MessageTag;

  createdAt: Date;
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ tag: 1, _id: -1 });
MessageSchema.index({ authorId: 1, _id: -1 });
MessageSchema.index({ createdAt: -1 });
