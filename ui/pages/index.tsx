import Link from 'next/link';
import { useEffect, useState } from 'react';

import { CategoryCheckboxes } from '../components/checkboxes';
import ErrorPage from '../components/error';
import { ChevronDownIcon, ChevronUpIcon } from '../components/icons/chevron';
import { CogIcon } from '../components/icons/cog';
import { getChannelCategories, getChannels } from '../utils/getChannels';
import { getFirestoreClient } from '../utils/getFirestoreClient';
import { Channel } from '../utilsLibrary/firestoreTypes';
import { ResponseWrapper, TResponseWrapper } from '../utilsLibrary/responseWrapper';

type Props = {
  channels: Channel[] | null;
  channelCategories: string[] | null;
  error: TResponseWrapper | null;
};

export async function getServerSideProps() {
  let firestoreResponse = getFirestoreClient();
  if (!firestoreResponse.Ok) {
    return {
      props: {
        channels: null,
        channelCategories: null,
        error: firestoreResponse,
      },
    };
  }
  let firestoreClient = firestoreResponse.Message;

  let categoriesResponse = await getChannelCategories(firestoreClient);
  if (!categoriesResponse.Ok) {
    return {
      props: {
        channels: null,
        channelCategories: null,
        error: categoriesResponse,
      },
    };
  }

  let response = await getChannels(firestoreClient);
  if (response.Ok) {
    return {
      props: {
        channels: response.Message,
        channelCategories: categoriesResponse.Message,
        error: null,
      },
    };
  }

  return {
    props: { channels: null, channelCategories: null, error: response },
  };
}

export default function Index({ channels, channelCategories, error }: Props) {
  if (error) {
    return <ErrorPage response={error} />;
  }

  if (!channels || !channelCategories) {
    return (
      <ErrorPage
        response={new ResponseWrapper(
          false,
          500,
          "Server Error",
          "Unable to load channels."
        ).Serialize()}
      />
    );
  }

  return <HomePage channels={channels} channelCategories={channelCategories} />;
}

function HomePage(props: { channels: Channel[]; channelCategories: string[] }) {
  const [showCategories, setShowCategories] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [channelsToDisplay, setChannelsToDisplay] = useState<Channel[]>(
    props.channels
  );

  function handleCogButtonClick(event: any) {
    setShowCategories(!showCategories);
  }

  function handleCategoryCheck(event: any) {
    let newArray = [...selectedCategories];

    let index = newArray.indexOf(event.target.value);
    if (index > -1) {
      newArray.splice(index, 1);
    } else {
      newArray.push(event.target.value);
    }

    setSelectedCategories(newArray);
  }

  useEffect(() => {
    if (selectedCategories.length === 0) {
      setChannelsToDisplay(props.channels);
      return;
    }

    let channelsFiltered: Channel[] = props.channels
      .map((channel) => {
        let display = false;
        selectedCategories.forEach((category) => {
          if (channel.Categories && channel.Categories.includes(category)) {
            display = true;
            return;
          }
        });

        if (display) {
          return channel;
        }
      })
      // typescript hack - "user defined type guard"
      .filter((elem): elem is Channel => !!elem);

    setChannelsToDisplay(channelsFiltered);
  }, [selectedCategories]);

  return (
    <div className="p-12 bg-theme-beige">
      <Header />
      <FeaturedChannels
        showCategories={showCategories}
        handleCogButtonClick={handleCogButtonClick}
      />
      <div className={showCategories ? "block" : "hidden"}>
        <CategoryCheckboxes
          channelCategories={props.channelCategories}
          handleCategoryCheck={handleCategoryCheck}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {channelsToDisplay.map((channel) => {
          return <ChannelCard channel={channel} key={channel.Id} />;
        })}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="my-12 text-center">
      <h1 className="text-3xl md:text-5xl lg:text-6xl font-black">
        <span className="text-theme-yt-red">Youtube</span> BackLinks
      </h1>
      <h3 className="mb-6">
        <span className="font-black">back·link</span>{" "}
        <span className="text-theme-beige-3">(noun)</span>{" "}
        <span className="italic">
          an incoming hyperlink from one web page to another website{" "}
        </span>
      </h3>
      <p className="text-xs sm:text-tiny">

        This site is an archive of youtube video description boxes with a focus on making the links/products found within them easily searchable. <br />
         Click on a channel and search for any
        term - from brand or product name to key phrases - to find video
        descriptions that contain the term!
      </p>
    </div>
  );
}

function FeaturedChannels(props: {
  showCategories: boolean;
  handleCogButtonClick: any;
}) {
  return (
    <div className="flex items-center justify-center my-4">
      <h3 className="flex-none font-black text-theme-yt-red text-xl sm:text-3xl">
        Featured Channels
      </h3>

      <button
        onClick={props.handleCogButtonClick}
        className="flex rounded-lg text-white bg-theme-yt-red p-1 md:p-2 shadow-lg ml-2 hover:bg-theme-yt-red-1 hover:cursor-pointer"
      >
        <CogIcon />
        <span>
          {props.showCategories ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </span>
      </button>
    </div>
  );
}

function ChannelCard(props: { channel: Channel }) {
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

        <h1 className="font-black md:text-l lg:text-xl py-2 break-words">
          {props.channel.Title}
        </h1>

        <p className="text-center">
          {props.channel.VideoCount} Videos | {props.channel.LinkCount} Links
        </p>
      </button>
    </Link>
  );
}
