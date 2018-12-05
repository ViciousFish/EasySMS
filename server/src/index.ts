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
import passport from 'passport';
import Auth0Strategy from 'passport-auth0';

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
  cookie: {},
  store: new MongoStore({
    url: mongoUrl
  }),
  resave: false,
  saveUninitialized: true
}));


// @ts-ignore
const strategy = new Auth0Strategy({
  domain: process.env.AUTH0_DOMAIN,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  callbackURL:
    process.env.AUTH0_CALLBACK_URL || 'http://192.168.99.100:3000/login/callback'
},
function (accessToken:any, refreshToken: any, extraParams: any, profile: any, done:any) {
  // accessToken is the token to call Auth0 API (not needed in the most cases)
  // extraParams.id_token has the JSON Web Token
  // profile has all the information from the user
  return done(null, profile);
})


passport.serializeUser(function (user: any, done) {
  done(null, user.id);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

passport.use(strategy);

app.use(passport.initialize());
app.use(passport.session());

app.use('/', express.static('public'));

app.get('/login', passport.authenticate('auth0', {
  scope: 'openid email profile'
}), (req, res) => {
  res.redirect('/');
});

app.get('/login/callback', (req: Request, res: Response, next: any) => {
  passport.authenticate('auth0', (err: any, user: any, info: any) => {
    if (err){
      return next(err);
    }
    if (!user) {
      return res.redirect('/login');
    }
    console.log("USER", user);
    req.logIn(user, (error) => {
      if (err){
        return next(error);
      }
      const returnTo = req.session.returnTo;
      delete req.session.returnTo;
      res.redirect(returnTo || '/');
    });
  })(req, res, next);
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

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

const secured = (req: Request, res: Response, next: any) => {
  if (req.user){
    return next();
  }
  res.status(403).send();
}

try {
  helpers.routing(app, secured);

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
