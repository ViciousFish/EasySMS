import { Campaign, IMessage } from "../models/Campaign";
import { Delivery, IDelivery } from "../models/Delivery";
import { TwilioDispatcher } from "../dispatcher/twilio.dispatcher";
import { TwilioCredentials } from '../models/TwilioCredentials';

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
  const twilioDispatcher = new TwilioDispatcher(campaignTwilioCredentials);
  campaign.users.map(user => {
    if (user.phone) {
      // Send message via phone dispatcher
      twilioDispatcher.sendMessage(campaign, message, user.phone)
        .then(() => {
          const delivery = new Delivery({
            campaign,
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

  campaign.messages[messageIndex].status = 'complete';
  campaign.save();
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

  const twilioDispatcher = new TwilioDispatcher(campaignTwilioCredentials);
  campaign.users.forEach(user => {
    if (user.phone) {
      if (!deliveries[user.phone]) {
        twilioDispatcher.sendMessage(campaign, message, user.phone)
          .then(() => {
            const delivery = new Delivery({
              campaign,
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
    }
  });

  campaign.messages[index].status = 'complete';
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

