import { Campaign, IMessage, ICampaign, IUser } from "../models/Campaign";
import { Delivery, IDelivery } from "../models/Delivery";
import { TwilioDispatcher } from "../dispatcher/twilio.dispatcher";
import { TwilioCredentials, ITwilioCredentials } from '../models/TwilioCredentials';

export async function startSendingMessage(campaign_id: string, message_id: string): Promise<void> {
  const campaign = await Campaign.findById(campaign_id);
  const campaignTwilioCredentials = await TwilioCredentials.findOne({ user_id: campaign.user_id });

  if (!campaignTwilioCredentials){
    throw 'No twilio credentials found!';
  }

  console.error("Campaign:", campaign_id);
  let messageIndex: number;
  const message = campaign.messages.find((m, index) => {
    messageIndex = index;
    return m.uuid == message_id;
  });
  if (!message) {
    throw 'No message found!';
  }
  campaign.messages[messageIndex].status = 'started';
  await campaign.save();
  
  sendMessage(campaign, message, messageIndex, campaignTwilioCredentials, campaign.users);
}

export async function resumeSendingMessage(campaign_id: string, message_id: string): Promise<void> {

  const [campaign, deliveriesArr] = await Promise.all(
    [
      Campaign.findById(campaign_id).exec(),
      Delivery.find({
        campaign: campaign_id,
        message: message_id
      }).exec()
    ]);
  
  const campaignTwilioCredentials = await TwilioCredentials.findOne({ user_id: campaign.user_id });

  if (!campaignTwilioCredentials){
    throw 'No twilio credentials found!';
  }

  const messages = campaign.messages.filter(m => m.uuid == message_id);
  const [deliveries, index] = await Promise.all([createDeliveriesMap(deliveriesArr), indexOfMessageSearch(messages, message_id)]);
  if (index == -1) {
    throw 'No message found!';
  }
  let message = messages[index];

  const users = campaign.users.filter(user => {
    return Object.keys(deliveries).indexOf(user.phone) === -1;
  })

  sendMessage(campaign, message, index, campaignTwilioCredentials, users);

}

async function sendMessage(campaign: ICampaign, message: IMessage, index: number, campaignTwilioCredentials: ITwilioCredentials, users: Array<IUser>){
  const twilioDispatcher = new TwilioDispatcher(campaignTwilioCredentials);
  users.forEach(user => {
    if (user.phone) {
      twilioDispatcher.sendMessage(campaign, message, user.phone)
        .then(() => {
          const delivery = new Delivery({
            campaign: campaign.id,
            campaign_name: campaign.name,
            user_id: campaign.user_id,
            user: user.phone,
            message: message.uuid,
            messageBody: message.text,
            date: new Date(),
            status: 'Success',
            from: campaignTwilioCredentials.phone
          });
          delivery.save();
        })
        .catch((err: any) => {
          console.error("An error happened while sending a message", message);
        });
    }
  });

  campaign.messages[index].status = 'complete';

  const campaignCompleted = campaign.messages.reduce((done, message) => {
    if (done && message.status === 'complete'){
      return true;
    } else {
      return false;
    }
  }, true);

  if (campaignCompleted){
    campaign.status = 'completed';
  }

  campaign.save();
}

export async function indexOfMessageSearch(messages: IMessage[], uuid: string): Promise<number> {
  for (let i = 0; i < messages.length; i++) {
    let message = messages[i];
    if (messages[i].uuid == uuid) {
      return i
    }
  }
  return -1;
}

async function createDeliveriesMap(deliveriesArr: IDelivery[]): Promise<{
  [key: string]: IDelivery
}> {
  const deliveries: {
    [key: string]: IDelivery
  } = {};

  for (const delivery of deliveriesArr) {
    deliveries[delivery.user] = delivery;
  }
  return deliveries;
}

