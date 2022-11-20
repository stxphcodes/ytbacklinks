import { NewChannelRequest, NewChannelResponse } from '../utilsLibrary/newChannelTypes';
import {
    ErrNullResponse, ErrRequest, ErrUnknown, ResponseError, ResponseWrapper
} from '../utilsLibrary/responseWrapper';

export async function postNewChannelRequest(
  serverUrl: string,
  request: NewChannelRequest
) {
  if (process.env.NODE_ENV !== "development") {
    serverUrl = window.location.href;
  } else {
    // postNewChannelRequest is executed at the client level
    // and doesn't have access to server container.
    serverUrl = "http://localhost:8000";
  }

  let url = new URL(serverUrl);
  url.pathname = `/channel/new`;

  let r = new ResponseWrapper();
  await fetch(url.toString(), {
    method: "POST",
    body: JSON.stringify(request),
    headers: { "content-type": "application/json" },
  })
    .then((response) => {
      r.UpdateWithResponse(response);
      if (!r.Ok) {
        throw new ResponseError(`${ErrRequest}: ${url.toString()}`);
      }

      return response.json();
    })
    .then((data: NewChannelResponse) => {
      if (!data) {
        throw new ResponseError(ErrNullResponse);
      }

      r.RawMessage = data;
      r.Message = data;
    })
    .catch((error) => {
      r.Ok && r.SetDefaultError();
      r.Message = error.Message || error.message || ErrUnknown;
      r.RawMessage = error.RawMessage || `In ${postNewChannelRequest.name}`;
    });

  return r.Serialize();
}
