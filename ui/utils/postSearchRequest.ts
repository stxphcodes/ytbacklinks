import {
    ErrNullResponse, ErrRequest, ErrUnknown, ResponseError, ResponseWrapper
} from '../utilsLibrary/responseWrapper';
import {
    CombinedSearchResponse, LinkSearchResponse, SearchRequest, VideoSearchResponse
} from '../utilsLibrary/searchTypes';

export async function postSearchRequest(typesenseUrl: string, request: SearchRequest) {
  let serverUrl = ""
  if (process.env.NODE_ENV === "development") {
    serverUrl = typesenseUrl
  } else {
    serverUrl = new URL(window.location.href).toString()
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

async function postLinkSearchRequest(typesenseUrl: string, request: SearchRequest) {
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
    .then((data: LinkSearchResponse) => {
      if (!data) {
        throw new ResponseError(ErrNullResponse);
      }

      r.RawMessage = data;
      r.Message = data;
    })
    .catch(error => {
      r.Ok && r.SetDefaultError();
      r.Message = error.Message || ErrUnknown;
      r.RawMessage = error.RawMessage || `In ${postLinkSearchRequest.name}`;
    });

  return r.Serialize();
}

async function postVideoSearchRequest(typesenseUrl: string, request: SearchRequest) {
  let serverUrl = new URL(typesenseUrl);
  serverUrl.pathname = `/videos/search`;

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
    .then((data: VideoSearchResponse) => {
      if (!data) {
        throw new ResponseError(ErrNullResponse);
      }

      r.RawMessage = data;
      r.Message = data;
    })
    .catch(error => {
      r.Ok && r.SetDefaultError();
      r.Message = error.Message || ErrUnknown;
      r.RawMessage = error.RawMessage || `In ${postVideoSearchRequest.name}`;
    });

  return r.Serialize();
}
