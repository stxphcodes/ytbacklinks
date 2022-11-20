import {
    ErrNullResponse, ErrRequest, ErrUnknown, ResponseError, ResponseWrapper
} from '../utilsLibrary/responseWrapper';
import {
    CombinedSearchResponse, LinkSearchResponse, SearchRequest, VideoSearchResponse
} from '../utilsLibrary/searchTypes';

export async function postSearchRequest(serverUrl: string, request: SearchRequest) {
  if (process.env.NODE_ENV !== "development") {
    serverUrl = window.location.href
  } else {
    // postSearchRequest is executed at the client level
    // and doesn't have access to server container.
    serverUrl = "http://localhost:8000"
  }

  let linkSearchResponse = await postLinkSearchRequest(serverUrl, request);
  if (!linkSearchResponse.Ok) {
    return linkSearchResponse;
  }

  let videoSearchResponse = await postVideoSearchRequest(serverUrl, request);
  if (!videoSearchResponse.Ok) {
    return videoSearchResponse;
  }

  let combinedResponse: CombinedSearchResponse = {
    LinkSearchResponse: linkSearchResponse.Message,
    VideoSearchResponse: videoSearchResponse.Message,
  }

  let r = new ResponseWrapper();
  r.SetDefaultOk();
  r.Message = combinedResponse
  return r.Serialize();
}

async function postLinkSearchRequest(serverUrl: string, request: SearchRequest) {
  let url = new URL(serverUrl);
  url.pathname = `/links/search`;

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
    .then((data: LinkSearchResponse) => {
      if (!data) {
        throw new ResponseError(ErrNullResponse);
      }

      r.RawMessage = data;
      r.Message = data;
    })
    .catch(error => {
      r.Ok && r.SetDefaultError();
      r.Message = error.Message || error.message || ErrUnknown;
      r.RawMessage = error.RawMessage || `In ${postLinkSearchRequest.name}`;
    });

  return r.Serialize();
}

async function postVideoSearchRequest(serverUrl: string, request: SearchRequest) {
  let url = new URL(serverUrl);
  url.pathname = `/videos/search`;

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
    .then((data: VideoSearchResponse) => {
      if (!data) {
        throw new ResponseError(ErrNullResponse);
      }

      r.RawMessage = data;
      r.Message = data;
    })
    .catch(error => {
      r.Ok && r.SetDefaultError();
      r.Message = error.Message || error.message || ErrUnknown;
      r.RawMessage = error.RawMessage || `In ${postVideoSearchRequest.name}`;
    });

  return r.Serialize();
}
