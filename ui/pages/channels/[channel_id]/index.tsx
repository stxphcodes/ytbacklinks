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
import { SearchChannelResponse, SearchRequest } from '../../../utilsLibrary/searchTypes';

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
  const [searchResponse, setSearchResponse] = useState<TResponseWrapper | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [videosToShow, setVideosToShow] = useState(props.videos);
  const [searchError, setSearchError] = useState<TResponseWrapper | null>(null);
  const [searchHits, setSearchHits] = useState<SearchChannelResponse | null>(
    null
  );
  const [resultType, setResultType] = useState('links');

  function handleToggleClick(event: any) {
    if (resultType === 'links') {
      setResultType('descriptionBoxes');
    } else {
      setResultType('links');
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
  useEffect(() => {
    // SearchResponse is null at intial state and
    // whenever search term is blank.
    // Reset search related states to default.
    if (!searchResponse) {
      setVideosToShow(props.videos);
      setSearchHits(null);
      setSearchError(null);
      return;
    }

    if (!searchResponse.Ok) {
      setSearchError(searchResponse);
      setSearchHits(null);
      setVideosToShow([]);
      return;
    }

    if (!searchResponse.Message.HitCount) {
      setSearchError(
        new ResponseWrapper(
          false,
          404,
          'Not found',
          'No results found for search term.',
          null
        ).Serialize()
      );
      setSearchHits(null);
      setVideosToShow([]);
      return;
    }

    setVideosToShow(
      props.videos.filter(video =>
        searchResponse.Message.VideoIds.includes(video.Id)
      )
    );
    setSearchHits(searchResponse.Message);
    setSearchError(null);
  }, [searchResponse]);

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
          <Toggle resultType={resultType} handleClick={handleToggleClick} />
        </div>

        <SearchResults
          error={searchError}
          videos={videosToShow}
          searchHits={searchHits}
          resultType={resultType}
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
  searchHits: SearchChannelResponse | null;
  resultType: string;
}) {
  if (props.error) {
    if (props.error.Status === 404) {
      return <HitCount totalHits={0} />;
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

  if (!props.searchHits) {
    return (
      <>
        {props.videos.map(video => {
          return (
            <VideoCard
              video={video}
              titleHit={false}
              linkHits={[]}
              key={video.Id}
              resultType={props.resultType}
            />
          );
        })}
      </>
    );
  }

  return (
    <>
      <HitCount totalHits={props.searchHits.HitCount} />
      {props.videos.map(video => {
        if (
          props.searchHits &&
          (!props.searchHits.LinkHits[video.Id] ||
            !props.searchHits.LinkHits[video.Id].length)
        ) {
          return (
            <VideoCard
              key={video.Id}
              video={video}
              titleHit={props.searchHits.VideoTitleHits[video.Id] !== undefined}
              linkHits={[]}
              resultType={props.resultType}
            />
          );
        }

        return (
          <VideoCard
            key={video.Id}
            video={video}
            titleHit={
              props.searchHits
                ? props.searchHits.VideoTitleHits[video.Id] !== undefined
                : false
            }
            linkHits={props.searchHits && props.searchHits.LinkHits[video.Id]}
            resultType={props.resultType}
          />
        );
      })}
    </>
  );
}

function VideoCard(props: {
  video: VideoUI;
  titleHit: boolean;
  linkHits: string[];
  resultType: string;
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
          {props.resultType === 'links' ? (
            <>
              {props.video.Links.map(link => {
                return (
                  <LinkButton
                    link={link}
                    active={props.linkHits.includes(link.Id)}
                    key={link.Id}
                  />
                );
              })}
            </>
          ) : (
            <span className="whitespace-pre-line">
              <p
                dangerouslySetInnerHTML={{
                  __html: findUrl(props.video.Description),
                }}
              />
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

function LinkButton(props: {link: Link; active: boolean}) {
  return (
    <li key={props.link.Id} className="p-2">
      <a href={props.link.Href} target="_blank">
        {props.active ? (
          <button className="bg-theme-beige border-2 border-theme-yt-red hover:bg-theme-beige-2 hover:border-none hover:text-theme-yt-red hover:shadow-inner p-2 rounded shadow-lg text-left ">
            {props.link.Brand !== ''
              ? `${props.link.Brand} - ${props.link.Description}`
              : props.link.Description}
          </button>
        ) : (
          <button className="bg-theme-beige hover:bg-theme-beige-2 hover:text-theme-yt-red hover:shadow-inner p-2 rounded shadow-lg text-left">
            {props.link.Brand !== ''
              ? `${props.link.Brand} - ${props.link.Description}`
              : props.link.Description}
          </button>
        )}
      </a>
    </li>
  );
}

function HitCount(props: {totalHits: number}) {
  return (
    <div className="flex flex-wrap place-content-start">
      <div className="bg-theme-yt-red p-2 rounded  text-left text-white">
        Total Results: {props.totalHits}
      </div>
    </div>
  );
}
