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
      <Header />

      <h3 className="font-black text-center text-theme-yt-red text-3xl">
        Featured Channels
      </h3>
      <div className="grid grid-cols-4 gap-4">
        {props.channels.map(channel => {
          return <ChannelCard channel={channel} />;
        })}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="my-12 text-center">
      <h1 className="text-6xl mb-8 font-black">
        <span className="text-theme-yt-red">Youtube</span> BackLinks
      </h1>
      <h3>
        <span className="font-black">back·link</span>{' '}
        <span className="text-theme-beige-3">(noun)</span>{' '}
        <span className="italic">
          an incoming hyperlink from one web page to another website{' '}
        </span>
      </h3>
    </div>
  );
}

function ChannelCard(props: {channel: Channel}) {
  return (
    <Link href={`/channels/${props.channel.Id}`} key={props.channel.Id}>
      <button className="bg-white shadow-lg text-center p-2 hover:scale-105">
        <img
          alt={`${props.channel.Title} channel thumbnail`}
          src={props.channel.ThumbnailUrl}
          className="w-fit h-auto"
          // Fixes 403 error: https://stackoverflow.com/a/61042200
          referrerPolicy="no-referrer"
        />

        <h1 className="font-black text-xl py-2">
          {props.channel.Title}
        </h1>

        <p className="text-center">
          {props.channel.VideoCount} Videos | {props.channel.LinkCount} Links
        </p>
      </button>
    </Link>
  );
}
