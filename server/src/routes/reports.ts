import express, { Request, Response } from 'express';
import { getCampaignAndValidateAuth } from './campaign';
import { Delivery } from '../models/Delivery';

const routerPath = '/api/campaign';

const getCampaignDeliveriesFile = async (req: Request, res: Response, next: any) => {
    const { id: campaign_id } = res.locals.campaign; 
    let deliveries = await Delivery.find({
        campaign: campaign_id
    });
    deliveries = deliveries.map(delivery => {
        const tmp = delivery.toObject();
        delete tmp.__v;
        return tmp;
    });
    if (deliveries == null || deliveries.length == 0) {
        res.status(404).send({ msg: "No deliveries to report!"});
        return;
    }
    const items = deliveries;
    const replacer = (key: string, value: any) => value === null ? '' : value // specify how you want to handle null values here
    const header = Object.keys(items[0])
    let csv = items.map((row: any) => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
    csv.unshift(header.join(','))
    const csvString = csv.join('\r\n')

    res.header("Content-type", "application/csv");
    res.header("Content-disposition", `attachment; filename=${campaign_id}.deliveryreport.csv`);
    res.send(csvString).status(200);
}

const getCampaignDeliveries = async (req: Request, res: Response, next: any) => {
    const { id: campaign_id } = res.locals.campaign; 
    let deliveries = await Delivery.find({
        campaign: campaign_id
    });
    deliveries = deliveries.map(delivery => {
        const tmp = delivery.toObject();
        delete tmp.__v;
        return tmp;
    });
    if (deliveries == null || deliveries.length == 0) {
        res.status(404).send({ msg: "No deliveries to report!"});
        return;
    }

    res.send(deliveries).status(200);
}

const getCampaignResponsesFile = async (req: Request, res: Response, next: any) => {
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
        res.status(404).send({ msg: "No responses to report!"})
        return;
    }
    const items = responses;
    const replacer = (key: string, value: any) => value === null ? '' : value // specify how you want to handle null values here
    const header = Object.keys(items[0])
    let csv = items.map((row: any) => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
    csv.unshift(header.join(','))
    const csvString = csv.join('\r\n')

    res.header("Content-type", "application/csv");
    res.header("Content-disposition", `attachment; filename=${campaign.id}.responsereport.csv`);
    res.send(csvString).status(200);
}

const getCampaignResponses = async (req: Request, res: Response, next: any) => {
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
        res.status(404).send({ msg: "No responses to report!"})
        return;
    }
    res.send(responses).status(200);
}

export const ReportsRoutes = (app: express.Application) => {

    const router = express.Router();

    router.param('campaign_id', getCampaignAndValidateAuth);

    router.get('/:campaign_id/responses', getCampaignResponses);
    router.get('/:campaign_id/responses/file', getCampaignResponsesFile);
    router.get('/:campaign_id/deliveries', getCampaignDeliveries);
    router.get('/:campaign_id/deliveries/file', getCampaignDeliveriesFile);

    app.use(routerPath, router);
};
