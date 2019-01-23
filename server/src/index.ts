import path from 'path';
import dotenv from 'dotenv';
if (process.env.RUN_MODE === 'local') {
  const result = dotenv.config({ path: path.resolve(__dirname, "../.env") });
  if (result.error) {
    throw result.error;
  }
}

import Auth0Strategy from 'passport-auth0';
import bcrypt from 'bcryptjs';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import passport from 'passport';
import session from 'express-session';
import twilio from 'twilio';


import { AuthenticationUser, IAuthenticationUser } from './models/AuthenticationUser';
import { Campaign, IUser } from './models/Campaign';
import { Delivery } from './models/Delivery';
import { indexOfMessageSearch } from './helpers/messageSender.helper';
import { Preference } from './models/Preference';
import { startup } from './helpers/startup.helper';
import { CampaignRoutes } from './routes/campaign';
import { ReportsRoutes } from './routes/reports';
import { TwilioCredentialsRoutes } from './routes/twiliocredentials';
import { TwilioCredentials } from './models/TwilioCredentials';
import { secured } from './middleware/auth';
import { checkTwilioCredentials } from './middleware/twilio';
import { MessageResponse } from './models/MessageResponse';


const MongoStore = require('connect-mongo')(session);

const secret = process.env.SESSION_SECRET || 'test';

const mongoUrl = process.env.MONGO_URL || 'mongodb://mongo/ohack'
mongoose.connect(mongoUrl);

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true
}));
// if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
// }

app.use(session({
  name: 'user_sid',
  secret,
  cookie: {
    maxAge: 1000*60*60*24*30, //30 days
    httpOnly: true
  },
  store: new MongoStore({
    url: mongoUrl
  }),
  resave: false,
  saveUninitialized: false
}));


// @ts-ignore
const strategy = new Auth0Strategy({
  domain: process.env.AUTH0_DOMAIN,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  callbackURL:
    process.env.AUTH0_CALLBACK_URL || 'http://localhost:3000/login/callback'
},
  function (accessToken: any, refreshToken: any, extraParams: any, profile: any, done: any) {
    console.log("PROFILE", profile);
    return done(null, profile.id);
  })


passport.serializeUser(function (user_id: string, done) {
  console.log("Serialize", user_id);
  done(null, user_id);
});

passport.deserializeUser(function (user_id: string, done) {
  console.log("Deserialize", user_id);
  done(null, user_id);
});

passport.use(strategy);

app.use(passport.initialize());
app.use(passport.session());

app.use('/', express.static('public'));

app.get('/login', (req, res, next) => {
  req.session.returnTo = req.query.returnTo;
  next();
}, passport.authenticate('auth0', {
  scope: 'openid email profile'
}), (req, res) => {
  res.redirect('/');
});

app.get('/login/callback', (req: Request, res: Response, next: any) => {
  passport.authenticate('auth0', (err: any, user: any, info: any) => {
    if (err) {
      console.error("auth error", err);
      return next(err);
    }
    console.log("USER", user);
    if (user == undefined || user == null) {
      return res.redirect('/login');
    }
    req.logIn(user, (error) => {
      if (error) {
        console.error("Failed to log user in", error);
        return next(error);
      }
      const returnTo = req.session.returnTo;
      delete req.session.returnTo;
      res.redirect(returnTo || '/');
    });
  })(req, res, next);
});

app.get('/logout', (req, res) => {
  req.session.destroy((err: any) => {
    if (err){
      console.error("Failed to destory session", err);
    }
    req.logOut();
    res.clearCookie('user_sid');
    res.redirect(`https://${process.env.AUTH0_DOMAIN}/v2/logout?returnTo=${encodeURIComponent(process.env.RUN_MODE === 'local' ? 'http://localhost:8080' : 'https://easysms.now.sh')}`);
  });
});

// In local mode, we don't want to enforce this
// const twilioWebhookMiddleware = process.env.RUN_MODE === 'local' ? (_: any, __: any, next: any) => { next() } : twilio.webhook();

// TODO: create twilio delivery status update handler
app.post('/deliveryupdate', (req: Request, res: Response, next) => {
  res.status(200).send();
});

app.post('/smsresponse', async (req: Request, res: Response) => {
  const user_identifier = req.body.From;
  
  Delivery.findOne({ user: user_identifier, from: req.body.To }).sort({ date: -1 }).limit(1)
  .then(async (delivery) => {
    const campaign = await Campaign.findById(delivery.campaign);
    const index = await indexOfMessageSearch(campaign.messages, delivery.message);
    const newResponse = new MessageResponse({
      campaign_id: campaign.id,
      campaign_name: campaign.name,
      message_id: campaign.messages[index].uuid,
      user_id: campaign.user_id,
      text: req.body.Body,
      date: Date.now()
    });

    newResponse.save();
    res.status(200).send();
  })
  .catch(error => {
    res.status(500).send("Failed to handle response");
  });
});



try {
  app.use(secured);

  app.get('/api/status', (req: Request, res: Response) => {
    res.status(200).send();
  });

  TwilioCredentialsRoutes(app);

  app.use(checkTwilioCredentials);

  ReportsRoutes(app);
  CampaignRoutes(app);

  app.use('/*', (req, res, next) => {
    res.status(200).sendFile(path.resolve(__dirname + '../../public/index.html'));
  });

  app.use((err: any, req: Request, res: Response, next: any) => {
    console.log(err);

    if (err) {
      res.status(err.status || 500).send(err.message);
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
