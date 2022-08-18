import Link from 'next/link';

import ErrorPage from '../components/error';
import { ChannelsResponse, getChannels } from '../utils/getChannels';
import { getFirestoreClient } from '../utils/getFirestoreClient';
import { TResponseWrapper } from '../utilsLibrary/responseWrapper';

type Props = {
  channels: ChannelsResponse | null;
  error: TResponseWrapper | null;
};

export async function getServerSideProps() {
  let firestoreResponse = getFirestoreClient()
  if (!firestoreResponse.Ok) {
    return {
      props: {channels: null, error: firestoreResponse}
    }
  }
  let firestoreClient = firestoreResponse.Message

  let response = await getChannels(firestoreClient);
  if (response.Ok) {
    return {
      props: {
        channels: response.Message,
        error: null,
      },
    };
  }

  return {
    props: {channels: null, error: response},
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
              <Link href={`/channels/${channelId}`} key={channelId}>
                <button className="shadow-sm border-2 text-left p-1">
                  <div className="grid grid-cols-3 gap-x-2">
                    <div>
                      <img
                        alt={`${channel.Title} channel thumbnail`}
                        src={channel.ThumbnailUrl}
                        className="w-fit h-auto"
                        // Fixes 403 error: https://stackoverflow.com/a/61042200
                        referrerPolicy="no-referrer"
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
