import Link from 'next/link';

import ErrorPage from '../components/error';
import { TApiResponse } from '../utils/apiResponse';
import { ChannelsResponse, getChannels } from '../utils/getChannels';

type Props = {
  channels: ChannelsResponse | null;
  error: TApiResponse | null;
};

export async function getServerSideProps() {
  let apiResponse = await getChannels();

  if (apiResponse.Ok) {
    return {
      props: {
        channels: apiResponse.Message,
        error: null,
      },
    };
  }

  return {
    props: {channels: null, error: apiResponse},
  };
}

export default function Index({channels, error}: Props) {
  if (error) {
    return <ErrorPage response={error} />;
  }

  return (
    <div className="p-12">
      <h1 className="text-center my-12 font-black tracking-tight text-6xl">
        YT BackLinks
      </h1>
      <h3 className="text-center my-4 font-black tracking-tight text-3xl">
        Featured Channels
      </h3>

      <div className="grid grid-cols-3 gap-x-2">
        {channels &&
          Object.entries(channels).map(([channelId, channel]) => {
            return (
              <Link href={`/channels/${channelId}`}>
                <button className="shadow-sm border-2 text-left p-1">
                  <div className="grid grid-cols-3 gap-x-2">
                    <div>
                      <img
                        alt={`${channel.Title} channel thumbnail`}
                        src={channel.ThumbnailUrl}
                        className="w-fit h-auto"
                      />
                    </div>

                    <div className="col-span-2">
                      <h1 className="font-black pb-2">{channel.Title}</h1>
                      <p className="pb-2">{channel.Description}</p>

                      <p>
                        {' '}
                        {channel.VideoCount} Videos | {channel.LinkCount} Links
                      </p>
                    </div>
                  </div>
                </button>
              </Link>
            );
          })}
      </div>
    </div>
  );
}
