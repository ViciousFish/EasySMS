import controllers from '../controllers';
import { Application } from 'express';

export default (app: Application, sessionCheckerMiddleware: any) => {
    app.use('/api', sessionCheckerMiddleware, new controllers.MainController(app).router);
    console.log("Routing Initialized");
}
