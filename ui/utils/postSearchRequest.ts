import {
    ErrNullResponse, ErrRequest, ErrUnknown, ResponseError, ResponseWrapper
} from '../utilsLibrary/responseWrapper';
import { SearchChannelResponse, SearchRequest } from '../utilsLibrary/searchTypes';

export async function postSearchRequest(typesenseUrl: string, request: SearchRequest) {
  let serverUrl = new URL(typesenseUrl);
  serverUrl.pathname = `/links/search`;

  let r = new ResponseWrapper();
  await fetch(serverUrl.toString(), {
    method: 'POST',
    body: JSON.stringify(request),
    headers: {'content-type': 'application/json'},
  })
    .then(response => {
      r.UpdateWithResponse(response);
      if (!r.Ok) {
        throw new ResponseError(`${ErrRequest}: ${serverUrl.toString()}`);
      }

      return response.json();
    })
    .then((data: SearchChannelResponse) => {
      if (!data) {
        throw new ResponseError(ErrNullResponse);
      }

      r.RawMessage = data;
      r.Message = data;
    })
    .catch(error => {
      r.Ok && r.SetDefaultError();
      r.Message = error.Message || ErrUnknown;
      r.RawMessage = error.RawMessage || `In ${postSearchRequest.name}`;
    });

  return r.Serialize();
}
