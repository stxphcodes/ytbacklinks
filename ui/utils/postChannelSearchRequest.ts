import {
    ErrNullResponse, ErrRequest, ErrUnknown, ResponseError, ResponseWrapper
} from '../utilsLibrary/responseWrapper';
import { ChannelSearchResponse, SearchRequest } from '../utilsLibrary/searchTypes';

export async function postChannelSearchRequest(serverUrl: string, request: SearchRequest) {
  if (process.env.NODE_ENV !== "development") {
    serverUrl = window.location.href
  } else {
    // postSearchRequest is executed at the client level
    // and doesn't have access to server container.
    serverUrl = "http://localhost:8000"
  }
  
    let url = new URL(serverUrl);
    url.pathname = `/api/channels/search`;
  
    let r = new ResponseWrapper();
    await fetch(url.toString(), {
      method: 'POST',
      body: JSON.stringify(request),
      headers: {'content-type': 'application/json'},
    })
      .then(response => {
        r.UpdateWithResponse(response);
        if (!r.Ok) {
          throw new ResponseError(`${ErrRequest}: ${url.toString()}`);
        }
  
        return response.json();
      })
      .then((data: ChannelSearchResponse) => {
        if (!data) {
          throw new ResponseError(ErrNullResponse);
        }
  
        r.RawMessage = data;
        r.Message = data;
      })
      .catch(error => {
        r.Ok && r.SetDefaultError();
        r.Message = error.Message || error.message || ErrUnknown;
        r.RawMessage = error.RawMessage || `In ${postChannelSearchRequest.name}`;
      });
  
    return r.Serialize();
  }