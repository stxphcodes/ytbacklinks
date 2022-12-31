import { useEffect, useState } from 'react';

import {
    AffiliateLinkRequest, AffiliateLinkResponse, postAffiliateLink
} from '../../utils/postAffiliateLinkRequest';
import { TResponseWrapper } from '../../utilsLibrary/responseWrapper';
import Error from '../error';
import { ArrowDownIcon } from '../icons/arrow-down';
import { LoadingIcon } from '../icons/loading-animation';

export default function AffiliateLinkCheck(props: {Href: string}) {
  const [response, setResponse] = useState<AffiliateLinkResponse | null>(null);
  const [error, setError] = useState<null | TResponseWrapper>(null);

  useEffect(() => {
    async function run(request: AffiliateLinkRequest) {
      let resp = await postAffiliateLink(request);
      if (resp.Ok) {
        setResponse(resp.Message);
      } else {
        setError(resp);
      }
    }

    run({Href: props.Href});
  }, []);

  if (error) {
    return (
      <Error
        header={`${error.Status} ${error.StatusText}`}
        message={error.Message}
      />
    );
  }

  if (!response || !response.Redirects || response.Redirects.length === 0) {
    return <LoadingIcon />;
  }

  return (
    <div>
      {response.Redirects.map((redirectURL, index) => (
        <div className="px-12" key={redirectURL.Href}>
          {index === 0 && (
            <div className="ml-6 my-1 p-1 text-white bg-theme-yt-red-1 rounded-lg text-xs inline-block">
              Original Link
            </div>
          )}
          <div className={`pl-6 underline break-all ${index !== 0 && "-mt-8"}`}>
            <a href={redirectURL.Href} target="_blank">
              {redirectURL.Href}
            </a>
          </div>
          {redirectURL.HasRedirect ? (
            <div className="flex -ml-20 items-start">
              <ArrowDownIcon />{" "}
              <div className="p-2 text-theme-yt-red-1 text-sm">
                {redirectURL.RedirectType}
              </div>
            </div>
          ) : (
            <div className="ml-6 my-1 p-1 text-white bg-theme-yt-red-1 rounded-lg text-xs inline-block">
              {" "}
              Final Link
            </div>
          )}
        </div>
      ))}
      <ResultsTable response={response} />
    </div>
  );
}

function ResultsTable(props: {response: AffiliateLinkResponse}) {
  return (
    <div className="grid grid-cols-3 gap-x-4 py-4">
      <div className="col-span-3 font-bold py-2">Results</div>
      <div className="col-span-2">Number of redirects:</div>
      <div>{props.response.RedirectCount}</div>
      <div className="col-span-2">Is the link shared an affiliate link?</div>
      <div>{props.response.IsAffiliate}</div>
    </div>
  );
}
