import express, { Request, Response } from 'express';
import { TwilioCredentials } from '../models/TwilioCredentials';

export const TwilioCredentialsRoutes = (app: express.Application) => {

    const router = express.Router();
    const routerPath = '/api/twiliocredentials';


    const getCredentials = async (req: Request, res: Response, next: any) => {
        // @ts-ignore
        const user_id = req.user;

        try {
            res.locals.twilioCredentials = await TwilioCredentials.find({ user_id });
            next();
        } catch (e) {
            next(e);
        }
    }

    router.get('/', getCredentials, async (req: Request, res: Response) => {
        if (!res.locals.twilioCredentials){
            res.status(404).send();
        } else {
            res.status(200).send(res.locals.twilioCredentials);
        }
    });

    router.post('/', getCredentials, async (req: Request, res: Response) => {
        
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
            await twilioCredentials.save();
            res.status(201).send();
        }
    });

    router.delete('/', getCredentials, async (req: Request, res: Response) => {
        if (!res.locals.twilioCredentials){
            res.status(404).send();
        } else {
            await res.locals.twilioCredentials.delete();
            res.status(200).send();
        }
    });

    app.use(routerPath, router);
};