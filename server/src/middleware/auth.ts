import { Request, Response } from 'express';

export const secured = (req: Request, res: Response, next: any) => {
  if (req.user) {
    return next();
  }
  res.status(401).send();
}
