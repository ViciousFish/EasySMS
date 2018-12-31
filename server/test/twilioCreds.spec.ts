import 'jest';
import mockingoose from 'mockingoose';
import { Request } from 'jest-express/lib/request';
import { Response } from 'jest-express/lib/response';

import { checkTwilioCredentials } from '../src/middleware/twilio';

let request: Request;
let response: Response;

describe("Twilio Creds middleware", () => {

  beforeEach(() => {
    request = new Request('/', {
      headers: {
        Accept: 'text/json'
      }
    });
    response = new Response();
  });

  afterEach(() => {
    request.resetMocked();
    response.resetMocked();
  });
  test("Should call next", async () => {
    const nextMock = jest.fn();
    const creds = {
      user_id: 'asdf',
      account_sid: 'asdf',
      auth_token: 'asdfasdf',
      phone: "+11234567890"
    };
    mockingoose.TwilioCredentials.toReturn(creds, "findOne");

    // @ts-ignore
    request.user = 'asdf';
    // @ts-ignore
    await checkTwilioCredentials(request, response, nextMock);

    expect(nextMock).toBeCalledTimes(1);
    expect(response.status).toBeCalledTimes(0);
    expect(response.send).toBeCalledTimes(0);
  
  });

  test("Should return 403", async () => {
    const nextMock = jest.fn();
    mockingoose.TwilioCredentials.toReturn(null, "findOne");

    // @ts-ignore
    request.user = 'asdf';
    // @ts-ignore
    await checkTwilioCredentials(request, response, nextMock);

    expect(nextMock).toBeCalledTimes(0);
    expect(response.status).toBeCalledTimes(1);
    expect(response.status).toBeCalledWith(403);
    expect(response.send).toBeCalledTimes(1);
  })
});
