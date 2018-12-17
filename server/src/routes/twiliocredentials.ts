import express, { Request, Response } from 'express';
import { TwilioCredentials } from '../models/TwilioCredentials';
import { Campaign } from '../models/Campaign';
import { MessageScheduler } from '../helpers/messageScheduler.helper';
import twilio = require('twilio');

export const TwilioCredentialsRoutes = (app: express.Application) => {

    const router = express.Router();
    const routerPath = '/api/twiliocredentials';


    const getCredentials = async (req: Request, res: Response, next: any) => {
        // @ts-ignore
        const user_id = req.user;

        try {
            res.locals.twilioCredentials = await TwilioCredentials.findOne({ user_id });
            next();
        } catch (e) {
            next(e);
        }
    }

    router.route('/')
    .get(getCredentials, async (req: Request, res: Response) => {
        if (!res.locals.twilioCredentials){
            res.status(404).send();
        } else {
            res.status(200).send(res.locals.twilioCredentials);
        }
    }).post(getCredentials, async (req: Request, res: Response) => {
        
        let twilioCredentials = res.locals.twilioCredentials || new TwilioCredentials({
            user_id: req.user
        });

        const { account_sid, auth_token, phone } = req.body;

        if (!account_sid || !auth_token){
            res.status(400).send();
        } else {
            twilioCredentials.account_sid = account_sid;
            twilioCredentials.auth_token = auth_token;
            twilioCredentials.phone = phone;


            try {
                const client = twilio(twilioCredentials.account_sid, twilioCredentials.auth_token);
            } catch(error) {
                res.status(422).send("Credentials invalid");
                return;
            }

            await twilioCredentials.save();

            const campaigns = await Campaign.find({ user_id: req.user });

            campaigns.forEach(campaign => {
                let changed = false;
                campaign.messages.forEach(message => {
                    if (message.status == 'no-credentials'){
                        changed = true;
                        message.status = 'needs-rescheduling';
                    }
                });
                if (changed)
                    campaign.save();
            })

            res.status(201).send();
        }
    }).delete(getCredentials, async (req: Request, res: Response) => {
        if (!res.locals.twilioCredentials){
            res.status(404).send();
        } else {
            await res.locals.twilioCredentials.delete();
            const campaigns = await Campaign.find({ user_id: req.user });

            campaigns.forEach(campaign => {
                let changed = false;
                campaign.messages.forEach(message => {
                    if (message.status == 'pending' || message.status == 'started'){
                        changed = true;
                        MessageScheduler.removeScheduledMessage(message.uuid);
                        message.status = 'no-credentials';
                    }
                });
                if (changed)
                    campaign.save();
            })
            res.status(202).send();
        }
    });

    app.use(routerPath, router);
};
