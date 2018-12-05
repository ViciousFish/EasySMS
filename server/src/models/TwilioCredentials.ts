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
    }
});

export interface ITwilioCredentials extends Document {
    user_id: string,
    account_sid: string,
    auth_token: string
}

export const TwilioCredentials: Model<ITwilioCredentials> = model<ITwilioCredentials>('TwilioCredentials', TwilioCredentialsSchema);
