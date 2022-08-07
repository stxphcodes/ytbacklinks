import { GetServerSideProps } from 'next';

import ErrorPage from '../../../components/error';
import { getChannel } from '../../../utils/getChannels';
import { getFirestoreClient } from '../../../utils/getFirestoreClient';
import { getVideos } from '../../../utils/getVideos';
import { ErrUrlParam, ResponseWrapper, TResponseWrapper } from '../../../utils/responseWrapper';
import { Channel, VideoUI } from '../../../utils/types';

type Props = {
  channel: Channel | null;
  videos: VideoUI[] | null;
  error: TResponseWrapper | null;
};

export const getServerSideProps: GetServerSideProps = async context => {
  let channel = null;
  let videos = null;
  let error = null;

  const channel_id = context.params?.channel_id;
  if (typeof channel_id !== 'string') {
    let error = new ResponseWrapper(
      false,
      400,
      'Bad Request',
      `${ErrUrlParam} ${channel_id}`
    ).Serialize();

    return {
      props: {channel, videos, error},
    };
  }

  let firestoreResponse = getFirestoreClient()
  if (!firestoreResponse.Ok) {
    let error = firestoreResponse
    return {
      props: {channel, videos, error}
    }
  }
  let firestoreClient = firestoreResponse.Message

  let channelResponse = await getChannel(firestoreClient, channel_id);
  if (!channelResponse.Ok) {
    error = channelResponse;
    return {
      props: {videos, channel, error},
    };
  }
  channel = channelResponse.Message;

  let videoResponse = await getVideos(firestoreClient, channel_id);
  if (!videoResponse.Ok) {
    error = videoResponse;
    return {
      props: {videos, channel, error},
    };
  }
  videos = videoResponse.Message;

  return {
    props: {videos, channel, error},
  };
};

export default function Index({videos, channel, error}: Props) {
  if (error) {
    return <ErrorPage response={error} />;
  }

  return (
    <div className="p-12">
      <div className="grid grid-cols-4 gap-x-2">
        <div>
          <img src={channel?.ThumbnailUrl} referrerPolicy="no-referrer"></img>

          <h1 className="py-4 font-black tracking-tight text-4xl">
            {channel?.Title}
          </h1>
          <p className="pb-4">{channel?.Description}</p>
          <p>Last Updated: {channel?.LastUpdated}</p>
        </div>

        <div className="col-span-3">
          {videos &&
            videos.map(video => {
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
