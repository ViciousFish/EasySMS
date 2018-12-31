import { TwilioCredentials } from '../models/TwilioCredentials';
import { Request, Response } from 'express';

export const checkTwilioCredentials = async (req: Request, res: Response, next: any) => {
  const twiliocredentials = await TwilioCredentials.findOne({ user_id: req.user });
  if (twiliocredentials){
    return next();
  }
  res.status(403).send();
};
