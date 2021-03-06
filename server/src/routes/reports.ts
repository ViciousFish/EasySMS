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
        delivery = delivery.toJSON();
        delete delivery.user_id;
        delete delivery.campaign;
        delete delivery._id;
        delete delivery.message;
        delete delivery.__v;
        return delivery;
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
    const prunedResponses = responses.map(response => {
        response = response.toJSON();
        delete response.user_id;
        delete response.message_id;
        delete response.campaign_id;
        delete response.__v;
        return response;
    })
    const items = prunedResponses;
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
        [key:string]: {
            id: string,
            name: string,
            responses: boolean,
            deliveries: boolean
        }
    } = {};
    if (responses){
        responses.forEach((response: IMessageResponse) => {
            if (!campaigns[response.campaign_id]){
                campaigns[response.campaign_id] = {
                    id: response.campaign_id,
                    name: response.campaign_name,
                    responses: true,
                    deliveries: false
                }
            }
        });
    }

    if (deliveries){
        deliveries.forEach((delivery: IDelivery) => {
            if (!campaigns[delivery.campaign]){
                campaigns[delivery.campaign] = {
                    id: delivery.campaign,
                    name: delivery.campaign_name,
                    responses: false,
                    deliveries: true
                }
            } else {
                campaigns[delivery.campaign] = {
                    ...campaigns[delivery.campaign],
                    deliveries: true
                }
            }
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
