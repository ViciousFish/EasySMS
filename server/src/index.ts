import path from 'path';
import dotenv from 'dotenv';
if (process.env.RUN_MODE === 'local'){
  const result = dotenv.config({path: path.resolve(__dirname, "../.env")});
  if (result.error){
    throw result.error;
  }
}

import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dispatcher from './dispatcher';
import mongoose from 'mongoose';
import helpers from './helpers';
import { Delivery } from './models/Delivery';
import { Campaign, IUser } from './models/Campaign';
import { indexOfMessageSearch } from './helpers/messageSender.helper';
import { startup } from './helpers/startup.helper';
import { Preference } from './models/Preference';
import twilio from 'twilio';
import bcrypt from 'bcryptjs';
import { AuthenticationUser, IAuthenticationUser } from './models/AuthenticationUser';
import session from 'express-session';
import morgan from 'morgan';

const MongoStore = require('connect-mongo')(session);

const secret = process.env.SESSION_SECRET || 'test';

const mongoUrl = process.env.MONGO_URL || 'mongodb://mongo/ohack'
mongoose.connect(mongoUrl);

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: true
}))
app.use(morgan('combined'));

app.use(session({
  name: 'user_sid',
  secret,
  store: new MongoStore({
    url: mongoUrl
  }),
  resave: false,
  saveUninitialized: false
}));

// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req: Request, res: Response, next) => {
  // @ts-ignore
  if (req.cookies.user_sid && !req.session.user) {
      res.clearCookie('user_sid');        
  }
  next();
});

// middleware function to check for logged-in users
var sessionChecker = (req: Request, res: Response, next: any) => {
  // @ts-ignore
  if (req.session.user && req.cookies.user_sid) {
      res.redirect('/dashboard');
  } else {
      next();
  }    
};



app.use('/', express.static('public'));

const twilioWebhookMiddleware = process.env.RUN_MODE === 'local' ? (_: any, __: any, next: any) => {next()} : twilio.webhook();

// TODO: create twilio delivery status update handler
app.post('/deliveryupdate', twilioWebhookMiddleware, (req, res, next) => {
  res.status(200).send();
});

// TODO: attach twilio security middleware
app.post('/smsresponse', twilioWebhookMiddleware, async (req: Request, res: Response) => {
  debugger;
  const user_identifier = req.body.From;

  const response = req.body.toLowercase();
  Delivery.findOne({user: user_identifier}).sort({date: -1}).limit(1)
    .then(async(delivery) => {
      const campaign = await Campaign.findById(delivery.campaign);
      const index = await indexOfMessageSearch(campaign.messages, delivery.message);
      campaign.messages[index].responses.push({
        user: user_identifier,
        text: req.body.Body,
        date: Date.now()
      });
      campaign.save();
      res.status(200).send();
    })
    .catch(error => {
      res.status(500).send("Failed to handle response");
    });
});

app.post('/api/login', (req: Request, res: Response, next) => {
  const { phoneNumber, password } = req.body;
  
  // Validate phone number format
  if (!phoneNumber || typeof phoneNumber !== 'string' || !/\d{10}/.test(phoneNumber)) {
    // Invalid phone number
    res.status(400).send("Bad phone number");
    return;
  }

  AuthenticationUser.findOne({ phoneNumber }).then((user: IAuthenticationUser) => {
    if (!user){
      throw 'No user found';
    }
    
    if (bcrypt.compareSync(password, user.password)){
      // @ts-ignore
      req.session.user = user.phoneNumber;
    } else {
      throw 'Bad password';
    }
  }).catch((error) => {
    if (error === 'No user found' || 'Bad password'){
      res.status(403).send("Invalid phone number or password");
      return;
    } else {
      res.status(500).send("Something went wrong");
    }
  });
});

app.post('/changePassword', sessionChecker, (req: Request, res: Response, next: any) => {
  const { phoneNumber, password, newPassword } = req.body;

  // Validate phone number format
  if (!phoneNumber || typeof phoneNumber !== 'string' || !/\d{10}/.test(phoneNumber)) {
    // Invalid phone number
    res.status(400).send("Bad phone number");
    return;
  }

  if (!password || !newPassword) {
    // Missing passwords
    res.status(400).send("Need passwords");
    return;
  }
  
  AuthenticationUser.findOne({ phoneNumber }).then((user: IAuthenticationUser) => {
    if (!user){
      throw 'No user found';
    }
    
    if (bcrypt.compareSync(password, user.password)){


      const salt = bcrypt.genSaltSync(12);
      const hash = bcrypt.hashSync(newPassword, salt);
      user.password = hash;
      user.save()
        .then(() => {
          // @ts-ignore
          if (req.session.user && req.cookies.user_sid) {
            res.clearCookie('user_sid');
          }
          res.status(201).send("Password successfully changed");
          return;
        })
        .catch((error) => {
          console.error("Error saving user password! Log omitted for security");
          res.status(500).send("Something went wrong");
          return;
        });
    } else {
      throw 'Bad password';
    }
  }).catch((error) => {
    if (error === 'No user found' || 'Bad password'){
      res.status(403).send("Invalid phone number or password");
      return;
    } else {
      res.status(500).send("Something went wrong");
    }
  });
});

try {
  helpers.routing(app, sessionChecker);

  app.use('/*', (req, res, next) => {
    res.status(200).sendFile(path.resolve(__dirname + '../../public/index.html'));
  });

  app.use((err: any, req: Request, res: Response, next: any) => {
    console.log(err);

    if (err) {
      res.status(err.status).send(err.message);
      return;
    }
    res.status(200).sendFile(path.resolve(__dirname + '../../public/index.html'));
  })
} catch (err) {
  console.error(err);
}

app.listen(3000, () => {
  console.log("Listening on port 3000");
});

startup();
