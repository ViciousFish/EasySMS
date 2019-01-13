import mongoose, { Document, Schema, Model, model } from "mongoose";
import uuid from 'uuid';

export const MessageSchema: Schema = new Schema({
  uuid: {
    type: String,
    required: true,
    default: uuid
  },
  text: {
    type: String,
    required: true
  },
  date: {
    type: Number,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    default: 'pending',
    required: true,
    enum: ['pending', 'started', 'complete', 'no-credentials', 'needs-rescheduling']
  }
});

const UserSchema: Schema = new Schema({
  phone: {
    type: String,
    validate: {
      validator: function (phone: string) {
        const phoneRegex = /\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(phone);
      },
      message: () => `Invalid phone number format`
    }
  }
})

const CampaignSchema: Schema = new Schema({
  user_id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  messages: [{
    type: MessageSchema
  }],
  users: [{
    type: UserSchema
  }],
  date: {
    type: Number,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    required: true,
    default: 'created',
    enum: ['created', 'in-progress', 'completed']
  }
});

CampaignSchema.methods.toClient = function () {
  let result: any = {};
  result.id = this._id;
  result.user_id = this.user_id
  result.name = this.name;
  result.messages = this.messages;
  result.users = this.users;
  result.date = this.date;
  result.status = this.status;

  return result;
}
export interface IUser {
  phone: string
}
export interface IMessage {

  uuid: string,
  text: string,
  date: number,
  status: 'pending' | 'started' | 'complete' | 'no-credentials' | 'needs-rescheduling'
}

export interface ICampaign extends Document {
  user_id: string,
  name: string,
  users: [IUser],
  messages: [IMessage],
  date: Date,
  status: 'created' | 'in-progress' | 'completed',

  toClient(): ICampaign;
}

export const Campaign: Model<ICampaign> = model<ICampaign>('Campaign', CampaignSchema);
