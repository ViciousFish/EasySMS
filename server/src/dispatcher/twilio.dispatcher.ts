import { IMessage, ICampaign } from "../models/Campaign";
import { Delivery } from '../models/Delivery';
import { ITwilioCredentials } from "../models/TwilioCredentials";
import twilio from 'twilio';

export class TwilioDispatcher {

    client: twilio.Twilio;
    phone: string;
    
    constructor({ account_sid, auth_token, phone }: ITwilioCredentials){
        this.client = twilio(account_sid, auth_token);
        this.phone = phone;
    }

    async sendMessage(campaign: ICampaign, message: IMessage, target_phone: string){
        this.client.messages.create({
            body: message.text,
            from: this.phone,
            to: target_phone
        }).then((result:any) => {
            if (result.error){
                console.error('Error sending message', result.error);
            }
        })
        .catch((error:any) => {
            const delivery = new Delivery({
                campaign: campaign.id,
                campaign_name: campaign.name,
                user_id: campaign.user_id,
                user: target_phone,
                message: message.uuid,
                messageBody: message.text,
                date: new Date(),
                status: error,
                from: this.phone
                });
                delivery.save()
                    .then(()=>{})
                    .catch((err:any) => {
                        console.error("Failed to save a delivery!", delivery, err);
                    });
        });
    }
}
