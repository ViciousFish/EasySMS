import express, { Request, Response } from 'express';
import { MessageScheduler } from '../helpers/messageScheduler.helper';
import { Campaign, IUser, IMessage, ICampaign, IResponse } from '../models/Campaign';
import { indexOfMessageSearch } from '../helpers/messageSender.helper';

const routerPath = '/api/campaign';

const getCampaigns = async (req: Request, res: Response, next: any) => {
    let campaigns;
    try {
        campaigns = await Campaign.find({ user_id: req.user });
    } catch (e){
        console.error(e);
        next(e);
    }
    const clientCampaigns = campaigns.map(campaign => campaign.toClient());
    res.status(200).send(clientCampaigns);
}

const getCampaign = async (req: Request, res: Response, next: any) => {
    res.status(200).send(res.locals.campaign.toClient());
}

const createCampaign = async (req: Request, res: Response, next: any) => {
    let name = req.body.name;
    let users: IUser[] = [];

    if (!name || !req.body.users){
        res.status(400).send({
            message: "Missing required data"
        });
        return;
    }

    for (let user of req.body.users) {
        if (!user.phone) {
            res.status(400).send({
                message: "Missing user phone number"
            });
            return;
        }
        users.push({
            phone: user.phone
        });
    }
    users = users
        .map(item => { 
            item.phone.replace(/[\(\)\-\s]/g, ''); // remove parentheses, whitespace and dashes
            return item;
        }) 
        .filter((value, index, self) => self.indexOf(value) === index); // remove duplicates

    let newCampaignObject = new Campaign({
        name,
        users,
        user_id: req.user
    });

    await newCampaignObject.save();

    res.status(201).send( newCampaignObject.toClient());
}

const deleteCampaign = async (req: Request, res: Response, next: any) => {
    const campaign: ICampaign = res.locals.campaign;
    campaign.messages.forEach(message => MessageScheduler.removeScheduledMessage(message.uuid));

    await Campaign.deleteOne({ id: campaign.id });

    res.status(202).send({});
}

const startCampaign = async (req: Request, res: Response, next: any) => {
    const { campaign } = res.locals;

    if (campaign.status != 'created') {
        let msg: string;
        if (campaign.status == 'in-progress') {
            msg = "Campaign is already in progress";
        } else if (campaign.status == 'completed') {
            msg = "Cannot start a completed campaign";
        }

        res.status(422).send({ msg });
        return;
    }

    campaign.status = 'in-progress';
    await campaign.save();

    MessageScheduler.startCampaign(campaign);

    res.status(201).send({ msg: "Campaign successfully started" })
}

const getMessage = async (req: Request, res: Response, next: any) => {
    let msgId = req.params.id;
    let message: IMessage;
    const { campaign } = res.locals;
    let index: number = await indexOfMessageSearch(campaign.messages, msgId)
    if (index == -1){
        res.status(404).send({ msg: "Message not found" });
        return;
    }
    message = campaign.messages[index];
    res.status(200).send(message);
}

const createMessage = async (req: Request, res: Response, next: any) => {
    let text: string = req.body.text;
    let date: number = undefined;

    if (req.body.date) {
        date = req.body.date;
    }

    let newMessage: IMessage = {
        text,
        uuid: undefined,
        date,
        status: undefined,
        responses: undefined
    };


    const { campaign } = res.locals;
    
    campaign.messages.push(newMessage);
    await campaign.save();
    res.status(201).send(campaign.messages[campaign.messages.length - 1]);
}

const updateMessage = async (req: Request, res: Response, next: any) => {
    let messageId = req.params.messageId;
    const { campaign } = res.locals;

    let msgToUpdate: IMessage = campaign.messages.find((element: IMessage) => element.uuid == messageId);
    if (!msgToUpdate){
        res.status(404).send();
        return;
    }
    if (req.body.text) {
        msgToUpdate.text = req.body.text;
    }
    if (req.body.date) {
        msgToUpdate.date = req.body.date;
    }

    if (msgToUpdate.status == 'needs-rescheduling'){
        msgToUpdate.status = 'pending';
    }

    await campaign.save();
    res.status(201).send(msgToUpdate);
}

const deleteMessage = async (req: Request, res: Response, next: any) => {
    const campaign: ICampaign = res.locals.campaign;

    const index = await indexOfMessageSearch(campaign.messages, req.params.messageId);

    if (index == -1){
        next({
            status: 404,
            message: "message not found"
        });
    }

    campaign.messages.splice(index, 1);
    MessageScheduler.removeScheduledMessage(req.params.messageId);
    await campaign.save();
    res.status(202).send({});
}

export const getCampaignAndValidateAuth = async (req: Request, res: Response, next: any) => {
    const campaign = await Campaign.findById(req.params.campaign_id);

    if (campaign == null){
        next({
            status: 404,
            message: "campaign not found"
        });
    } else if (campaign.user_id != req.user) {
        next({
            status: 401,
            message: "Unauthorized"
        });
    } else {
        res.locals.campaign = campaign;
        next();
    }
}

export const CampaignRoutes = (app: express.Application) => {

    const router = express.Router();

    router.param('campaign_id', getCampaignAndValidateAuth);

    router.get('/', getCampaigns);
    router.get('/:campaign_id', getCampaign);
    router.post('/', createCampaign);
    router.delete('/:campaign_id', deleteCampaign);

    router.post('/:campaign_id/start', startCampaign);

    router.get('/:campaign_id/message/:messageId', getMessage);
    router.post('/:campaign_id/message', createMessage);
    router.put('/:campaign_id/message/:messageId', updateMessage);
    router.delete('/:campaign_id/message/:messageId', deleteMessage);

    app.use(routerPath, router);
};
