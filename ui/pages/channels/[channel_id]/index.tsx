import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';

import ErrorPage from '../../../components/error';
import SearchBar from '../../../components/searchbar';
import { getChannel } from '../../../utils/getChannels';
import { getFirestoreClient } from '../../../utils/getFirestoreClient';
import { getVideos } from '../../../utils/getVideos';
import { postSearchRequest } from '../../../utils/postSearchRequest';
import { Channel, VideoUI } from '../../../utilsLibrary/firestoreTypes';
import {
    ErrUrlParam, ResponseWrapper, TResponseWrapper
} from '../../../utilsLibrary/responseWrapper';
import { SearchRequest } from '../../../utilsLibrary/searchTypes';

type Props = {
  channel: Channel | null;
  videos: VideoUI[] | null;
  error: TResponseWrapper | null;
};

export const getServerSideProps: GetServerSideProps = async context => {
  const channel_id = context.params?.channel_id;
  if (typeof channel_id !== 'string') {
    return {
      props: {
        channel: null,
        videos: null,
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
      props: {
        channel: null,
        videos: null,
        error: firestoreResponse,
      },
    };
  }
  let firestoreClient = firestoreResponse.Message;

  let channelResponse = await getChannel(firestoreClient, channel_id);
  if (!channelResponse.Ok) {
    return {
      props: {
        channel: null,
        videos: null,
        error: channelResponse,
      },
    };
  }

  let videoResponse = await getVideos(firestoreClient, channel_id);
  if (!videoResponse.Ok) {
    return {
      props: {
        channel: null,
        videos: null,
        error: videoResponse,
      },
    };
  }

  return {
    props: {
      channel: channelResponse.Message,
      videos: videoResponse.Message,
      error: null,
    },
  };
};

export default function Index({videos, channel, error}: Props) {
  if (error) {
    return <ErrorPage response={error} />;
  }

  if (!channel || !videos) {
    return <ErrorPage response={
      new ResponseWrapper(
        false, 
        500, 
        'Server Error', 
        'Unable to get channel info and videos.').
      Serialize()} />;
  }

  return <ChannelPage channel={channel} videos={videos} />;
}

function ChannelPage(props: {channel: Channel; videos: VideoUI[]}) {
  const [searchResults, setSearchResults] = useState(['']);
  const [searchTerm, setSearchTerm] = useState('');
  const [videosToShow, setVideosToShow] = useState(props.videos);

  async function handleSearchSubmit(event: React.FormEvent<HTMLButtonElement>) {
    event.preventDefault();
    let request: SearchRequest = {
      channelId: props.channel.Id,
      term: searchTerm,
    };

    let response = await postSearchRequest(request);
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
    <div className="p-12">
      <div className="grid grid-cols-4 gap-x-2">
        <div>
          <img
            src={props.channel.ThumbnailUrl}
            referrerPolicy="no-referrer"
          ></img>

          <h1 className="py-4 font-black tracking-tight text-4xl">
            {props.channel.Title}
          </h1>
          <p className="pb-4">{props.channel.Description}</p>
          <p>Last Updated: {props.channel.LastUpdated}</p>
        </div>

        <div className="col-span-3">
          <SearchBar
            inputValue={searchTerm}
            handleSubmit={handleSearchSubmit}
            handleInputChange={handleInputChange}
          />

          {videosToShow &&
            videosToShow.map(video => {
              return (
                <div
                  className="shadow-sm border-2 p-4 grid grid-cols-4 gap-x-8"
                  key={video.Id}
                >
                  <div className="">
                    <img src={video.ThumbnailUrl} />
                    <h1 className="font-black py-2">
                      <a
                        href={`https://youtube.com/watch?v=${video.Id}`}
                        target="_blank"
                      >
                        {video.Title}
                      </a>
                    </h1>
                    <p className="py-2">{video.PublishedAt}</p>
                  </div>

                  <div className="col-span-3">
                    <h1 className="font-black">Links</h1>
                    <ul className="list-outside list-disc">
                      <div className="grid grid-cols-3 gap-x-6">
                        {video.Links.map(link => {
                          return (
                            <li key={link.Id}>
                              {' '}
                              <a
                                href={link.Href}
                                target="_blank"
                                className="text-sky-400"
                              >
                                {link.Brand !== ''
                                  ? `${link.Brand} - ${link.Description}`
                                  : link.Description}
                              </a>
                            </li>
                          );
                        })}
                      </div>
                    </ul>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
