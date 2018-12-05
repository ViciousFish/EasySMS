import mongoose, { Document, Schema, Model, model } from "mongoose";
import uuid from 'uuid';
const ResponseSchema: Schema = new Schema({
  user: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  date: {
    type: Number,
    default: Date.now
  }
});

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
  responses: [{
    type: ResponseSchema
  }],
  status: {
    type: String,
    default: 'pending',
    required: true,
    enum: ['pending', 'started', 'complete']
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

CampaignSchema.query.addMessageResponse = function (campaign_id: string, message_uuid: string, user_identifier: string, text: string) {
  return this.findOneAndUpdate({ _id: campaign_id }, {
    $push: {
      'messages.responses': {
        user: user_identifier,
        text,
        date: Date.now()
      }
    }
  });
}

export interface IResponse {
  user: string,
  text: string,
  date: number
}
export interface IUser {
  phone: string
}
export interface IMessage {

  uuid: string,
  text: string,
  date: number,
  status: 'pending' | 'started' | 'complete',
  responses: [{
    user: string,
    text: string,
    date: number
  }]
}

export interface ICampaign extends Document {
  user_id: string,
  name: string,
  users: [IUser],
  messages: [IMessage],
  date: Date,
  status: 'created' | 'in-progress' | 'completed',

  addMessageResponse(campaign_id: string, message_uuid: string, user_identifier: string, text: string): any,
  toClient(): ICampaign;
}

export const Campaign: Model<ICampaign> = model<ICampaign>('Campaign', CampaignSchema);
