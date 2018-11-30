import mongoose, { Schema, Model, model, Document } from "mongoose";

const AuthenticationUserSchema: Schema = new Schema({
    phoneNumber: {
        required: true,
        type: String,
        validate: {
            validator: function(phoneNumber: string) {
                return /\d{10}/.test(phoneNumber);
            }
        }
    },
    password: {
        required: true,
        type: String
    }
});

export interface IAuthenticationUser extends Document {
    password: string,
    phoneNumber: string
}

export const AuthenticationUser: Model<IAuthenticationUser> = model<IAuthenticationUser>('AuthenticationUser', AuthenticationUserSchema);
