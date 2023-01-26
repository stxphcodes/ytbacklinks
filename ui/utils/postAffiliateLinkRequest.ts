

import {
    ErrNullResponse, ErrRequest, ErrUnknown, ResponseError, ResponseWrapper
} from '../utilsLibrary/responseWrapper';

export type AffiliateLinkRequest = {
  Href: string;
};

export type AffiliateLinkResponse = {
  Redirects: RedirectURL[];
  RedirectCount: number;
  IsAffiliate: string;
}

export type RedirectURL = {
  Href: string;
  HasRedirect: boolean;
  RedirectType: string;
}

export async function postAffiliateLink(request: AffiliateLinkRequest) {
  let serverUrl = new URL(window.location.href);

  // postAffiliateLink is executed at the client level
  // and doesn't have access to server container.
  if (process.env.NODE_ENV === "development") {
    serverUrl = new URL("http://localhost:8000");
  }

  serverUrl.pathname = "/api/affiliatelink";

  let r = new ResponseWrapper();
  await fetch(serverUrl.toString(), {
    method: "POST",
    body: JSON.stringify(request),
    headers: {"content-type": "application/json"},
  })
    .then((response) => {
      r.UpdateWithResponse(response);
      if (!r.Ok) {
        throw new ResponseError(`${ErrRequest}: ${serverUrl.toString()}`);
      }

      return response.json();
    })
    .then((data: AffiliateLinkResponse[]) => {
      if (!data) {
        throw new ResponseError(ErrNullResponse);
      }

      r.RawMessage = data;
      r.Message = data;
    })
    .catch((error) => {
      r.Ok && r.SetDefaultError();
      r.Message = error.Message || error.message || ErrUnknown;
      r.RawMessage = error.RawMessage || `In ${postAffiliateLink.name}`;
    });

  return r.Serialize();
}
