import mongoose, { Schema, Model, model, Document } from "mongoose";

const TwilioCredentialsSchema: Schema = new Schema({
    user_id: {
        type: String,
        required: true,
        index: true
    },
    account_sid: {
        type: String,
        required: true
    },
    auth_token: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        validate: {
            validator: function (phone: string) {
              const phoneRegex = /\+?[1-9]\d{1,14}$/;
              return phoneRegex.test(phone);
            },
            message: () => `Invalid phone number format`
          }
    }
});

export interface ITwilioCredentials extends Document {
    user_id: string,
    account_sid: string,
    auth_token: string,
    phone: string
}

export const TwilioCredentials: Model<ITwilioCredentials> = model<ITwilioCredentials>('TwilioCredentials', TwilioCredentialsSchema);
