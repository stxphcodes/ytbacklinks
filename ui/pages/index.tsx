import Link from 'next/link';

import ErrorPage from '../components/error';
import { getChannels } from '../utils/getChannels';
import { getFirestoreClient } from '../utils/getFirestoreClient';
import { Channel } from '../utilsLibrary/firestoreTypes';
import { ResponseWrapper, TResponseWrapper } from '../utilsLibrary/responseWrapper';

type Props = {
  channels: Channel[] | null;
  error: TResponseWrapper | null;
};

export async function getServerSideProps() {
  let firestoreResponse = getFirestoreClient();
  if (!firestoreResponse.Ok) {
    return {
      props: {channels: null, error: firestoreResponse},
    };
  }
  let firestoreClient = firestoreResponse.Message;

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

  if (!channels) {
    return (
      <ErrorPage
        response={new ResponseWrapper(
          false,
          500,
          'Server Error',
          'Unable to load channels.'
        ).Serialize()}
      />
    );
  }

  return <HomePage channels={channels} />;
}

function HomePage(props: {channels: Channel[]}) {
  return (
    <div className="p-12 bg-theme-beige">
      <h1 className="text-center my-12 font-black text-6xl">YT BackLinks</h1>
      <h3 className="text-center my-4 font-black text-theme-yt-red text-3xl">
        Featured Channels
      </h3>

      <div className="grid grid-cols-4 gap-x-2 gap-y-2">
        {props.channels.map(channel => {
          return <ChannelCard channel={channel} />;
        })}
      </div>
    </div>
  );
}

function ChannelCard(props: {channel: Channel}) {
  return (
    <Link href={`/channels/${props.channel.Id}`} key={props.channel.Id}>
      <button className="bg-white shadow-lg border-2 text-left p-1">
        <img
          alt={`${props.channel.Title} channel thumbnail`}
          src={props.channel.ThumbnailUrl}
          className="w-fit h-auto"
          // Fixes 403 error: https://stackoverflow.com/a/61042200
          referrerPolicy="no-referrer"
        />

        <h1 className="font-black text-xl text-center">
          {props.channel.Title}
        </h1>

        <p className="text-center">
          {props.channel.VideoCount} Videos | {props.channel.LinkCount} Links
        </p>
      </button>
    </Link>
  );
}
