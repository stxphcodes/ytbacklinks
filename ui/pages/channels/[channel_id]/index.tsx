import { GetServerSideProps } from 'next';

import { getChannel } from '../../../utils/getChannels';
import { getVideos } from '../../../utils/getVideos';
import { Channel, VideoUI } from '../../../utils/types';

type Props = {
  videos: VideoUI[] | null;
  channel: Channel | null;
};

export const getServerSideProps: GetServerSideProps = async context => {
  const channel_id = context.params?.channel_id;

  if (typeof channel_id === 'string') {
    let videos = await getVideos(channel_id);
    let channel = await getChannel(channel_id);

    return {
      props: {videos, channel},
    };
  }

  return {
    props: {},
  };
};

export default function Index({videos, channel}: Props) {
  if (channel === null) {
    return <div>500 error</div>;
  }

  return (
    <div className="p-12">
      <div className="grid grid-cols-4 gap-x-2">
        <div>
          <img src={channel.ThumbnailUrl}></img>

          <h1 className="py-4 font-black tracking-tight text-4xl">
            {channel.Title}
          </h1>
          <p className="pb-4">{channel.Description}</p>
          <p>Last Updated: {channel.LastUpdated}</p>
        </div>

        <div className="col-span-3">
          {videos &&
            videos.map(video => {
              return (
                <div className="shadow-sm border-2 p-4 grid grid-cols-4 gap-x-8">
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
                          if (link.Description.length > 60) {
                            return <></>;
                          }
                          return (
                            <li>
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
