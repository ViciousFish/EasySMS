import mongoose, { Schema, Model, model, Document } from 'mongoose';

const MessageResponseSchema: Schema = new Schema({
  campaign_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Campaign'
  },
  campaign_name: {
    type: String,
    required: true
  },
  user_id: {
    type: String,
    required: true
  },
  message_id: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  date: {
    type: Number,
    default: Date.now,
    required: true
  }
});

export interface IMessageResponse extends Document {
  campaign_id: string,
  campaign_name: string,
  user_id: string,
  message_id: string,
  text: string,
  date: Date
}
export const MessageResponse: Model<IMessageResponse> = model<IMessageResponse>('MessageResponse', MessageResponseSchema);

