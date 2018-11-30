import { BaseDispatcher } from "./base.dispatcher";
import { IMessage, ICampaign } from "../models/Campaign";
import { Delivery } from '../models/Delivery';

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
const twilioFromNumber = process.env.TWILIO_NUMBER;

function sendMessage(msg: string, reciever: { phoneNumber: string}, message: IMessage, campaign_id: string) {
    client.messages
    .create({
        body: msg,
        from: twilioFromNumber,
        to: reciever.phoneNumber
    })
    .then((result:any) => {
        if (result.error){
            console.error('Error sending message', result.error);
        }
    })
    .catch((error:any) => {
        const delivery = new Delivery({
            campaign: campaign_id,
            user: reciever.phoneNumber,
            message: message.uuid,
            messageBody: msg,
            date: new Date(),
            status: error
            });
            delivery.save()
                .then(()=>{})
                .catch((err:any) => {
                    console.error("Failed to save a delivery!", delivery, err);
                });
    })
    .done();
}

export default {
    sms: {
        sendMessage
    }
}

export class TwilioDispatcher extends BaseDispatcher{
    async sendMessage(campaign: ICampaign, message: IMessage, contact_method: string){
        if (this.shouldSendToUser(contact_method, 'phone')){
            sendMessage(message.text, {
                phoneNumber: contact_method
            }, message, campaign.id); 
        } else {
            const delivery = new Delivery({
                campaign: campaign.id,
                user: contact_method,
                message: message.uuid,
                messageBody: message.text,
                date: new Date(),
                status: 'Message fell outside of user preferences'
            });
            delivery.save()
                .then(()=>{})
                .catch((err:any) => {
                    console.error("Failed to save a delivery!", delivery, err);
                });
        }
    }
}
