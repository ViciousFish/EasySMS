import mongoose, { Schema, Model, model, Document } from 'mongoose';

const DeliverySchema: Schema = new Schema({
  campaign: {
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
  user: {
    type: String,
    required: true
  },
  messageBody: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  date: {
    type: Number,
    default: Date.now,
    required: true
  },
  status: {
    type: String,
    required: true,
    default: 'Success'
  },
  from: {
    type: String,
    required: true
  }
});

DeliverySchema.query.getMostRecent = function (user_identifier: string): Promise<IDelivery> {
  return this.findOne({ user: user_identifier }).sort({ date: -1 }).limit(1);
}

export interface IDelivery extends Document {
  campaign: string,
  campaign_name: string,
  user_id: string,
  user: string,
  message: string,
  messageBody: string,
  date: Date,
  status: string,
  from: string

  getMostRecent(user_identifier: string): Promise<IDelivery>
}
export const Delivery: Model<IDelivery> = model<IDelivery>('Delivery', DeliverySchema);

