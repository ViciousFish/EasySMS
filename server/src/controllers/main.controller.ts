import BaseController from './base.controller';
import { Campaign, IUser, IMessage, ICampaign, IResponse } from '../models/Campaign';
import { indexOfMessageSearch } from '../helpers/messageSender.helper';
import express, { Router, Request, Response, Application } from 'express';
import { debug } from 'util';
import { Delivery } from '../models/Delivery';
import { MessageScheduler } from '../helpers/messageScheduler.helper';


export default class Main extends BaseController {
    constructor(app: Express.Application) {
        super(app);

        this.router.param('campaign_id', async (req, res, next) => {
            // validate campaign_id
            // get campaign by id
            // add it to the req object
            //next

            const campaign = await Campaign.findById(req.params.campaign_id);

            if (campaign == null){
                next({
                    status: 404,
                    message: "campaign not found"
                });
            } else {
                res.locals.campaign = campaign;
                next();
            }
        });

        this.router.post('/campaign', this.createCampaign.bind(this));
        this.router.get('/campaign/:campaign_id', this.getCampaign.bind(this));
        this.router.post('/campaign/:campaign_id/start', this.startCampaign.bind(this));
        this.router.get('/campaigns', this.getCampaigns.bind(this));
        this.router.get('/campaign/:campaign_id/message/:messageId', this.getMessage.bind(this));
        this.router.put('/campaign/:campaign_id/message/:messageId', this.updateMessage.bind(this));
        this.router.post('/campagn/:campaign_id/message', this.createMessage.bind(this));
        this.router.get('/campaign/:campaign_id/responses', this.responseReport.bind(this));
        this.router.get('/campaign/:id/deliveries', this.deliveryReport.bind(this));
    };

    async deliveryReport(req: Request, res: Response, next: any): Promise<void> {
        const campaign_id = req.params.id;
        if (!campaign_id) {
            //send error
            this.handleError(next, "No campaign id found", "Error");
            return;
        }
        Delivery.find({
            campaign: campaign_id
        }).then((deliveries: any[]) => {
            deliveries = deliveries.map(delivery => {
                const tmp = delivery.toObject();
                delete tmp.__v;
                return tmp;
            });
            if (deliveries == null || deliveries.length == 0) {
                this.handleError(next, "No deliveries to report!", "Error");
                return;
            }
            const items = deliveries;
            const replacer = (key: string, value: any) => value === null ? '' : value // specify how you want to handle null values here
            const header = Object.keys(items[0])
            let csv = items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
            csv.unshift(header.join(','))
            const csvString = csv.join('\r\n')

            console.log(csvString);

            res.header("Content-type", "application/csv");
            res.header("Content-disposition", `attachment; filename=${campaign_id}.deliveryreport.csv`);
            res.send(csvString).status(200);
        }).catch(error => {
            this.handleError(next, "Error generating report", error);
        })
    }

    async responseReport(req: Request, res: Response, next: any): Promise<void> {
        const { campaign } = res.locals;
        const responses = [];
        for (const message of campaign.messages) {
            for (const response of message.responses) {
                responses.push({
                    user: response.user,
                    campaign: campaign.id,
                    date: response.date,
                    message: message.text,
                    response: response.text
                })
            }
        }
        if (responses == null || responses.length == 0) {
            this.handleError(next, "No responses to report!", "Error");
            return;
        }
        const items = responses;
        const replacer = (key: string, value: any) => value === null ? '' : value // specify how you want to handle null values here
        const header = Object.keys(items[0])
        let csv = items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
        csv.unshift(header.join(','))
        const csvString = csv.join('\r\n')

        console.log(csvString);

        res.header("Content-type", "application/csv");
        res.header("Content-disposition", `attachment; filename=${campaign.id}.responsereport.csv`);
        res.send(csvString).status(200);
    }

    async createCampaign(req: Request, res: Response, next: any): Promise<void> {
        let name = req.body.name;
        let users: IUser[] = [];

        // Do validation

        for (let user of req.body.users) {
            users.push({
                name: user.name,
                email: user.email,
                phone: user.phone
            });
        }

        let newCampaignObject = new Campaign({
            name,
            users
        });

        newCampaignObject.save((err, campaign) => {
            if (err) {
                this.handleError(next, "Error saving new campaign", err);
            }
        });

        this.sendResponse(res, newCampaignObject.toClient());
    }

    async getCampaign(req: Request, res: Response, next: any): Promise<void> {
        this.sendResponse(res, req.campaign.toClient());
    }

    async startCampaign(req: Request, res: Response, next: any): Promise<void> {

        const { campaign } = res.locals;

        if (campaign.status != 'created') {
            let msg: string;
            if (campaign.status == 'in-progress') {
                msg = "Campaign is already in progress";
            } else if (campaign.status == 'completed') {
                msg = "Cannot start a completed campaign";
            }

            this.handleError(next, msg, null, 422);
            return;
        }

        campaign.status = 'in-progress';
        campaign.save();

        MessageScheduler.startCampaign(campaign);

        this.sendResponse(res, { msg: "Campaign successfully started" });
    }

    async getCampaigns(req: Request, res: Response, next: any): Promise<void> {
        Campaign.find()
            .then(campaigns => {
                let clientCampaigns = campaigns.map(camp => camp.toClient());
                this.sendResponse(res, clientCampaigns);
            })
            .catch(err => this.handleError(
                next,
                "Error querying for campaign with id of " + req.params.id,
                err
            ));
    }

    async createMessage(req: Request, res: Response, next: any): Promise<void> {
        let campaignId = req.body.campaignId;
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
        campaign.save()
            .then(() =>{this.sendResponse(res, campaign.messages[campaign.messages.length - 1]);})
            .catch((err: any)=>{this.handleError(next, "Error creating message", err)});
    }

    async updateMessage(req: Request, res: Response, next: any): Promise<void> {
        let campaignId = req.params.campaignId;
        let messageId = req.params.messageId;

        const { campaign } = res.locals;

        let msgToUpdate = campaign.messages.find((element: IMessage) => element.uuid == messageId);
        if (!msgToUpdate){
            this.handleError(next, "Message not found", {})
        }
        if (req.body.text) {
            msgToUpdate.text = req.body.text;
        }
        if (req.body.date) {
            msgToUpdate.date = req.body.date;
        }

        campaign.save()
            .then(() => this.sendResponse(res, msgToUpdate))
            .catch((err: any) => this.handleError(next, "Error updating message", err));
    }

    async getMessage(req: Request, res: Response, next: any): Promise<void> {
        let msgId = req.params.id;
        let message: IMessage;
        const { campaign } = res.locals;
        let index: number = await indexOfMessageSearch(campaign.messages, msgId)
        if (index == -1){
            this.handleError(next, "Message not found", {})
        }
        message = campaign.messages[index];
        this.sendResponse(res, message);
    }
}
