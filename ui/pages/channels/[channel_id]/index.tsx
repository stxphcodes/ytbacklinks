import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';

import ErrorPage from '../../../components/error';
import SearchBar from '../../../components/searchbar';
import Toggle from '../../../components/toggle';
import { getChannel } from '../../../utils/getChannels';
import { getFirestoreClient } from '../../../utils/getFirestoreClient';
import { getTypesenseServerUrl } from '../../../utils/getTypesenseServer';
import { getVideos } from '../../../utils/getVideos';
import { postSearchRequest } from '../../../utils/postSearchRequest';
import { Channel, Link, VideoUI } from '../../../utilsLibrary/firestoreTypes';
import {
    ErrUrlParam, ResponseWrapper, TResponseWrapper
} from '../../../utilsLibrary/responseWrapper';
import {
    LinkSearchResponse, SearchRequest, VideoSearchResponse
} from '../../../utilsLibrary/searchTypes';

type Props = {
  channel: Channel | null;
  videos: VideoUI[] | null;
  error: TResponseWrapper | null;
  typesenseUrl: string | null;
};

export const getServerSideProps: GetServerSideProps = async context => {
  const channel_id = context.params?.channel_id;
  if (typeof channel_id !== 'string') {
    return {
      props: {
        error: new ResponseWrapper(
          false,
          400,
          'Bad Request',
          `${ErrUrlParam} ${channel_id}`
        ).Serialize(),
      },
    };
  }

  let firestoreResponse = getFirestoreClient();
  if (!firestoreResponse.Ok) {
    return {
      props: {error: firestoreResponse},
    };
  }
  let firestoreClient = firestoreResponse.Message;

  let typesenseUrlResponse = getTypesenseServerUrl();
  if (!typesenseUrlResponse.Ok) {
    return {
      props: {error: typesenseUrlResponse},
    };
  }
  let typesenseUrl = typesenseUrlResponse.Message;

  let channelResponse = await getChannel(firestoreClient, channel_id);
  if (!channelResponse.Ok) {
    return {
      props: {error: channelResponse},
    };
  }

  let videoResponse = await getVideos(firestoreClient, channel_id);
  if (!videoResponse.Ok) {
    return {
      props: {error: videoResponse},
    };
  }

  return {
    props: {
      channel: channelResponse.Message,
      videos: videoResponse.Message,
      typesenseUrl: typesenseUrl,
      error: null,
    },
  };
};

export default function Index({videos, channel, typesenseUrl, error}: Props) {
  if (error) {
    return <ErrorPage response={error} />;
  }

  if (!channel || !videos || !typesenseUrl) {
    return (
      <ErrorPage
        response={new ResponseWrapper(
          false,
          500,
          'Server Error',
          'Unable to get channel info and videos.'
        ).Serialize()}
      />
    );
  }

  return (
    <ChannelPage
      channel={channel}
      videos={videos}
      typesenseUrl={typesenseUrl}
    />
  );
}

function ChannelPage(props: {
  channel: Channel;
  videos: VideoUI[];
  typesenseUrl: string;
}) {
  // search term user entered in the search bar.
  const [searchTerm, setSearchTerm] = useState('');

  // display option user selects in the toggle switch.
  const [displayOption, setDisplayOption] = useState('linksOnly');

  // videos to show. Defaults to all videos if no search term is entered.
  // Updated when search is entered.
  const [videosToShow, setVideosToShow] = useState(props.videos);

  // searchResponse returned in postSearchRequest.
  const [searchResponse, setSearchResponse] = useState<TResponseWrapper | null>(
    null
  );

  // searchError is updated if !searchResponse.Ok
  const [searchError, setSearchError] = useState<TResponseWrapper | null>(null);

  // linkSearchResponse is updated if searchResponse is successful.
  // linkSearchResponse contains matched links from the search request.
  const [linkSearchResponse, setLinkSearchResponse] =
    useState<LinkSearchResponse | null>(null);

  // videoSearchResponse is udpated if searchResponse is successful.
  // videoSearchResponse contains matched video descriptions from the search request.
  const [videoSearchResponse, setVideoSearchResponse] =
    useState<VideoSearchResponse | null>(null);

  function handleToggleClick(event: any) {
    if (displayOption === 'linksOnly') {
      setDisplayOption('descriptionBoxes');
    } else {
      setDisplayOption('linksOnly');
    }
  }

  async function handleSearchSubmit(event: React.FormEvent<HTMLButtonElement>) {
    event.preventDefault();

    let request: SearchRequest = {
      channelId: props.channel.Id,
      term: searchTerm,
    };

    if (request.term === '') {
      setSearchResponse(null);
      return;
    }

    let response = await postSearchRequest(props.typesenseUrl, request);
    setSearchResponse(response);
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSearchTerm(event.target.value);
  }

  // Runs every time search response changes.
  // searchResponse.message is the type CombinedSearchResponse.
  useEffect(() => {
    // SearchResponse is null at intial state and
    // whenever search term is blank. Reset search
    // response states to default.
    if (!searchResponse) {
      setVideosToShow(props.videos);
      setLinkSearchResponse(null);
      setVideoSearchResponse(null);
      setSearchError(null);
      return;
    }

    // searchResponse returned error.
    if (!searchResponse.Ok) {
      setSearchError(searchResponse);
      setLinkSearchResponse(null);
      setVideoSearchResponse(null);
      setVideosToShow([]);
      return;
    }

    let linkSearchResponse: LinkSearchResponse =
      searchResponse.Message.LinkSearchResponse;
    let videoSearchResponse: VideoSearchResponse =
      searchResponse.Message.VideoSearchResponse;

    // searchResponse returned 0 results for both display options.
    if (!linkSearchResponse.HitCount && !videoSearchResponse.HitCount) {
      setSearchError(
        new ResponseWrapper(
          false,
          404,
          'Not found',
          'No results found for search term.',
          null
        ).Serialize()
      );
      setLinkSearchResponse(null);
      setVideoSearchResponse(null);
      setVideosToShow([]);
      return;
    }

    // If the display option chosen returned 0 results, set error telling user
    // to switch to the other display option.
    if (
      (displayOption === 'linksOnly' && !linkSearchResponse.HitCount) ||
      (displayOption === 'fullDescriptionBoxes' &&
        !videoSearchResponse.HitCount)
    ) {
      setSearchError(
        new ResponseWrapper(
          false,
          405,
          'Not found',
          'No results found for in this view. Toggle switch to change view.',
          null
        ).Serialize()
      );
      setLinkSearchResponse(null);
      setVideoSearchResponse(null);
      setVideosToShow([]);
      return;
    }

    // Show matched results.
    setVideosToShow(
      props.videos.filter(video => {
        if (displayOption === 'linksonly') {
          return linkSearchResponse.VideoIds.includes(video.Id);
        } else {
          return videoSearchResponse.VideoIds.includes(video.Id);
        }
      })
    );
    setLinkSearchResponse(linkSearchResponse);
    setVideoSearchResponse(videoSearchResponse);
    setSearchError(null);
    return;
  }, [searchResponse, displayOption]);

  return (
    <div className="grid grid-cols-5">
      <div className="col-span-1 bg-theme-beige p-8">
        <ChannelSidebar channel={props.channel} />
      </div>

      <div className="col-span-4 bg-theme-beige-2 p-8">
        <div className="bg-theme-beige-2  py-2 sticky top-14">
          <SearchBar
            inputValue={searchTerm}
            handleSubmit={handleSearchSubmit}
            handleInputChange={handleInputChange}
          />
          <Toggle
            displayOption={displayOption}
            handleClick={handleToggleClick}
          />
        </div>

        <SearchResults
          error={searchError}
          videos={videosToShow}
          linkSearchResponse={linkSearchResponse}
          videoSearchResponse={videoSearchResponse}
          displayOption={displayOption}
          searchTerm={searchTerm}
        />
      </div>
    </div>
  );
}

function ChannelSidebar(props: {channel: Channel}) {
  return (
    <div className="rounded-lg sticky top-14 py-2">
      <img src={props.channel.ThumbnailUrl} referrerPolicy="no-referrer"></img>

      <h1 className="py-4 font-black text-theme-yt-red text-4xl">
        {props.channel.Title}
      </h1>
      <table className="table-auto text-theme-yt-red">
        <tbody>
          <tr>
            <td className="font-black">Link Count</td>
            <td>{props.channel.LinkCount}</td>
          </tr>
          <tr>
            <td className="font-black">Video Count</td>
            <td>{props.channel.VideoCount}</td>
          </tr>
        </tbody>
      </table>
      <p>{props.channel.Description}</p>
    </div>
  );
}

function SearchResults(props: {
  videos: VideoUI[];
  error: TResponseWrapper | null;
  linkSearchResponse: LinkSearchResponse | null;
  videoSearchResponse: VideoSearchResponse | null;
  displayOption: string;
  searchTerm?: string;
}) {
  if (props.error) {
    if (props.error.Status === 404) {
      return (
        <>
          <HitCount totalLinkHits={0} totalVideoHits={0} />
        </>
      );
    }

    return (
      <div>
        <p>
          {props.error.Status} - {props.error.StatusText}
        </p>
        <p>{props.error.Message}</p>
      </div>
    );
  }

  // this only happens when search is empty (default state so show all videos)
  if (!props.linkSearchResponse && !props.videoSearchResponse) {
    return (
      <>
        {props.videos.map(video => {
          return (
            <VideoCard
              video={video}
              titleHit={false}
              linkHits={[]}
              key={video.Id}
              displayOption={props.displayOption}
              searchTerm={''}
            />
          );
        })}
      </>
    );
  }

  return (
    <>
      <HitCount
        totalLinkHits={
          props.linkSearchResponse ? props.linkSearchResponse.HitCount : 0
        }
        totalVideoHits={
          props.videoSearchResponse ? props.videoSearchResponse.HitCount : 0
        }
      />
      {props.displayOption === 'linksOnly' ? (
        <>
          {props.videos.map(video => {
            if (
              props.linkSearchResponse &&
              (!props.linkSearchResponse.LinkHits[video.Id] ||
                !props.linkSearchResponse.LinkHits[video.Id].length)
            ) {
              return (
                <VideoCard
                  key={video.Id}
                  video={video}
                  titleHit={
                    props.linkSearchResponse.VideoTitleHits[video.Id] !==
                    undefined
                  }
                  linkHits={[]}
                  displayOption={props.displayOption}
                  searchTerm={props.searchTerm || ''}
                />
              );
            }

            return (
              <VideoCard
                key={video.Id}
                video={video}
                titleHit={
                  props.linkSearchResponse
                    ? props.linkSearchResponse.VideoTitleHits[video.Id] !==
                      undefined
                    : false
                }
                linkHits={
                  props.linkSearchResponse &&
                  props.linkSearchResponse.LinkHits[video.Id]
                }
                displayOption={props.displayOption}
                searchTerm={props.searchTerm || ''}
              />
            );
          })}
        </>
      ) : (
        <>
          {props.videos.map(video => {
            return (
              <VideoCard
                key={video.Id}
                video={video}
                titleHit={
                  props.videoSearchResponse
                    ? props.videoSearchResponse.VideoTitleHits[video.Id] !==
                      undefined
                    : false
                }
                linkHits={[]}
                displayOption={props.displayOption}
                searchTerm={props.searchTerm || ''}
              />
            );
          })}
        </>
      )}
    </>
  );
}

function VideoCard(props: {
  video: VideoUI;
  titleHit: boolean;
  linkHits: string[];
  displayOption: string;
  searchTerm: string;
}) {
  return (
    <div
      className="bg-theme-beige-1 grid grid-cols-4 gap-x-8 mt-4 p-4 rounded-lg shadow-sm"
      key={props.video.Id}
    >
      <div className="col-span-1">
        <img src={props.video.ThumbnailUrl} />
        {props.titleHit ? (
          <h1 className="font-black text-theme-yt-red py-2">
            <a
              href={`https://youtube.com/watch?v=${props.video.Id}`}
              target="_blank"
            >
              {props.video.Title}
            </a>
          </h1>
        ) : (
          <h1 className="font-black py-2">
            <a
              href={`https://youtube.com/watch?v=${props.video.Id}`}
              target="_blank"
            >
              {props.video.Title}
            </a>
          </h1>
        )}
        <p>{props.video.PublishedAt}</p>
      </div>

      <div className="col-span-3">
        <ul className="flex flex-wrap place-content-start">
          {props.displayOption === 'linksOnly' ? (
            <>
              {props.video.Links.map(link => {
                return (
                  <LinkButton
                    link={link}
                    active={props.linkHits.includes(link.Id)}
                    key={link.Id}
                    term={props.searchTerm}
                  />
                );
              })}
            </>
          ) : (
            <span className="whitespace-pre-line">
              {props.searchTerm == '' ? (
                <p
                  dangerouslySetInnerHTML={{
                    __html: findUrl(props.video.Description),
                  }}
                />
              ) : (
                <p
                  dangerouslySetInnerHTML={{
                    __html: findUrl(
                      highlightTerm(props.video.Description, props.searchTerm)
                    ),
                  }}
                />
              )}
            </span>
          )}
        </ul>
      </div>
    </div>
  );
}

function findUrl(text: string) {
  var urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, function (url: string) {
    return (
      '<a href="' +
      url +
      '" class="text-theme-yt-red" target="_blank">' +
      url +
      '</a>'
    );
  });
}

function highlightTerm(text: string, term: string) {
  let textSplit = text.split(' ');
  textSplit.forEach((word, index) => {
    if (word.includes(term)) {
      if (!word.includes('https')) {
        textSplit[index] = word.replace(
          term,
          '<span class="bg-theme-yellow" >' + term + '</span>'
        );
      }
    }
  });

  return textSplit.join(' ');
}

function LinkButton(props: {link: Link; active: boolean; term: string}) {
  let buttonText =
    props.link.Brand !== ''
      ? `${props.link.Brand} - ${props.link.Description}`
      : props.link.Description;
  if (props.term != '') {
    buttonText = highlightTerm(buttonText, props.term);
  }

  return (
    <li key={props.link.Id} className="p-2">
      <a href={props.link.Href} target="_blank">
        {props.active ? (
          <button className="bg-theme-beige border-2 border-theme-yt-red hover:bg-theme-beige-2 hover:border-none hover:text-theme-yt-red hover:shadow-inner p-2 rounded shadow-lg text-left ">
            <p
              dangerouslySetInnerHTML={{
                __html: buttonText,
              }}
            />
          </button>
        ) : (
          <button className="bg-theme-beige hover:bg-theme-beige-2 hover:text-theme-yt-red hover:shadow-inner p-2 rounded shadow-lg text-left">
            <p
              dangerouslySetInnerHTML={{
                __html: buttonText,
              }}
            />
          </button>
        )}
      </a>
    </li>
  );
}

function HitCount(props: {totalLinkHits: number; totalVideoHits: number}) {
  return (
    <div className="flex flex-wrap place-content-start gap-x-2 text-sm">
      <div className="bg-theme-yt-red p-2 rounded  text-left text-white">
        Link Results: {props.totalLinkHits}
      </div>
      <div className="bg-theme-yt-red p-2 rounded  text-left text-white">
        Full Description Box Results: {props.totalVideoHits}
      </div>
    </div>
  );
}
