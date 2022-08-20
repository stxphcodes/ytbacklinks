import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';

import ErrorPage from '../../../components/error';
import SearchBar from '../../../components/searchbar';
import { getChannel } from '../../../utils/getChannels';
import { getFirestoreClient } from '../../../utils/getFirestoreClient';
import { getTypesenseServerUrl } from '../../../utils/getTypesenseServer';
import { getVideos } from '../../../utils/getVideos';
import { postSearchRequest } from '../../../utils/postSearchRequest';
import { Channel, Link, VideoUI } from '../../../utilsLibrary/firestoreTypes';
import {
    ErrUrlParam, ResponseWrapper, TResponseWrapper
} from '../../../utilsLibrary/responseWrapper';
import { SearchRequest } from '../../../utilsLibrary/searchTypes';

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
  const [searchResults, setSearchResults] = useState(['']);
  const [searchTerm, setSearchTerm] = useState('');
  const [videosToShow, setVideosToShow] = useState(props.videos);

  async function handleSearchSubmit(event: React.FormEvent<HTMLButtonElement>) {
    event.preventDefault();
    let request: SearchRequest = {
      channelId: props.channel.Id,
      term: searchTerm,
    };

    let response = await postSearchRequest(props.typesenseUrl, request);
    setSearchResults(response.Message.VideoIds);
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSearchTerm(event.target.value);
  }

  useEffect(() => {
    if (searchTerm == '') {
      setVideosToShow(props.videos);
    } else {
      setVideosToShow(
        props.videos.filter(video => searchResults.includes(video.Id))
      );
    }
  }, [searchResults]);

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
        </div>

        {videosToShow &&
          videosToShow.map(video => {
            return <VideoCard video={video} />;
          })}
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

function VideoCard(props: {video: VideoUI}) {
  return (
    <div
      className="bg-theme-beige-1 grid grid-cols-4 gap-x-8 mt-4 p-4 rounded-lg shadow-sm"
      key={props.video.Id}
    >
      <div className="col-span-1">
        <img src={props.video.ThumbnailUrl} />
        <h1 className="font-black py-2">
          <a
            href={`https://youtube.com/watch?v=${props.video.Id}`}
            target="_blank"
          >
            {props.video.Title}
          </a>
        </h1>

        <p>{props.video.PublishedAt}</p>
      </div>

      <div className="col-span-3">
        <ul className="flex flex-wrap place-content-start">
          {props.video.Links.map(link => {
            return <LinkButton link={link} />;
          })}
        </ul>
      </div>
    </div>
  );
}

function LinkButton(props: {link: Link}) {
  return (
    <li key={props.link.Id} className="p-2">
      <a href={props.link.Href} target="_blank">
        <button className="bg-theme-beige hover:bg-theme-beige-2 hover:text-theme-yt-red hover:shadow-inner p-2 rounded shadow-lg text-left">
          {props.link.Brand !== ''
            ? `${props.link.Brand} - ${props.link.Description}`
            : props.link.Description}
        </button>
      </a>
    </li>
  );
}
