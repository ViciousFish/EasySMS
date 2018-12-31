import 'jest';
import { Request } from 'jest-express/lib/request';
import { Response } from 'jest-express/lib/response';

import { secured } from '../src/middleware/auth';

let request: Request;
let response: Response;

describe("Auth middleware", () => {

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
  test("Should call next", () => {
    const nextMock = jest.fn();
    
    // @ts-ignore
    request.user = {};
    // @ts-ignore
    secured(request,response, nextMock);

    expect(nextMock).toBeCalledTimes(1);
  
  });

  test("Should return 401" , () => {
    const nextMock = jest.fn();

    // @ts-ignore
    secured(request,response, nextMock);

    expect(nextMock).toBeCalledTimes(0);
    expect(response.status).toBeCalledWith(401);
    expect(response.status).toBeCalledTimes(1);
    expect(response.send).toBeCalledTimes(1);
  })
});
