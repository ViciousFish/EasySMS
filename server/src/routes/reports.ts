import express, { Request, Response } from 'express';
import { getCampaignAndValidateAuth } from './campaign';
import { Delivery, IDelivery } from '../models/Delivery';
import { MessageResponse, IMessageResponse } from '../models/MessageResponse';

const routerPath = '/api/campaign';

const getCampaignDeliveriesFile = async (req: Request, res: Response, next: any) => { 
    let deliveries = await Delivery.find({
        campaign: req.params.campaign_id,
        user_id: req.user
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
    res.header("Content-disposition", `attachment; filename=${req.params.campaign_id}.deliveryreport.csv`);
    res.send(csvString).status(200);
}

const getCampaignDeliveries = async (req: Request, res: Response, next: any) => {
    const campaign_id = req.params.campaign_id;
    let deliveries = await Delivery.find({
        campaign: campaign_id,
        user_id: req.user
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
    const responses = await MessageResponse.find({ campaign_id: req.params.campaign_id, user_id: req.user });
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
    res.header("Content-disposition", `attachment; filename=${req.params.campaign_id}.responsereport.csv`);
    res.send(csvString).status(200);
}

const getCampaignResponses = async (req: Request, res: Response, next: any) => {
    const responses = await MessageResponse.find({ campaign_id: req.params.campaign_id, user_id: req.user });
    if (responses == null || responses.length == 0) {
        res.status(404).send({ msg: "No responses to report!"})
        return;
    }
    res.send(responses).status(200);
}

const getCampaignsWithReports = async (req: Request, res: Response, next: any) => {
    // @ts-ignore
    const [responses, deliveries] = await Promise.all([
        MessageResponse.find({ user_id: req.user }),
        Delivery.find({ user_id: req.user })
    ]);
    const campaigns: {
        [key:string]: string
    } = {};
    if (responses){
        responses.forEach((response: IMessageResponse) => {
            campaigns[response.campaign_id] = response.campaign_name;
        });
    }

    if (deliveries){
        deliveries.forEach((delivery: IDelivery) => {
            campaigns[delivery.campaign] = delivery.campaign_name;
        });
    }

    res.status(200).send(campaigns);
}

export const ReportsRoutes = (app: express.Application) => {

    const router = express.Router();
    
    router.get('/:campaign_id/responses', getCampaignResponses);
    router.get('/:campaign_id/responses/file', getCampaignResponsesFile);
    router.get('/:campaign_id/deliveries', getCampaignDeliveries);
    router.get('/:campaign_id/deliveries/file', getCampaignDeliveriesFile);
    router.get('/reports', getCampaignsWithReports);

    app.use(routerPath, router);
};
