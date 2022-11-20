import Link from 'next/link';
import { useEffect, useState } from 'react';

import { CategoryCheckboxes } from '../components/categoryCheckboxes';
import Error from '../components/error';
import ErrorPage from '../components/error/page';
import { ChevronDownIcon, ChevronUpIcon } from '../components/icons/chevron';
import { CogIcon } from '../components/icons/cog';
import SearchBar from '../components/searchbar';
import { getChannelCategories, getChannels } from '../utils/getChannels';
import { getServerUrl } from '../utils/getServer';
import { postChannelSearchRequest } from '../utils/postChannelSearchRequest';
import { Channel } from '../utilsLibrary/firestoreTypes';
import { ResponseWrapper, TResponseWrapper } from '../utilsLibrary/responseWrapper';
import { ChannelSearchResponse, SearchRequest } from '../utilsLibrary/searchTypes';

type Props = {
  channels: Channel[] | null;
  channelCategories: string[] | null;
  error: TResponseWrapper | null;
  serverUrl: string | null;
};

export async function getServerSideProps() {
  let categories = getChannelCategories();

  let serverUrlResponse = getServerUrl();
  if (!serverUrlResponse.Ok) {
    return {
      props: { error: serverUrlResponse },
    };
  }
  let serverUrl = serverUrlResponse.Message;

  let response = await getChannels(serverUrl);
  if (response.Ok) {
    return {
      props: {
        channels: response.Message,
        channelCategories: categories,
        error: null,
        serverUrl: serverUrl,
      },
    };
  }

  return {
    props: {
      channels: null,
      channelCategories: null,
      serverUrl: null,
      error: response,
    },
  };
}

export default function Index({
  channels,
  channelCategories,
  serverUrl,
  error,
}: Props) {
  if (error) {
    return <ErrorPage response={error} />;
  }

  if (!channels || !channelCategories || !serverUrl) {
    return (
      <ErrorPage
        response={new ResponseWrapper(
          false,
          500,
          "Server Error",
          "Unable to load channels. Missing props"
        ).Serialize()}
      />
    );
  }

  return (
    <HomePage
      channels={channels}
      channelCategories={channelCategories}
      serverUrl={serverUrl}
    />
  );
}

function HomePage(props: {
  channels: Channel[];
  channelCategories: string[];
  serverUrl: string;
}) {
  // Dropdown for categories was selected.
  const [showCategories, setShowCategories] = useState(false);

  // Categories to filter channels by.
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // search term user entered in the search bar.
  const [searchTerm, setSearchTerm] = useState("");

  // original search response from api.
  const [searchResponse, setSearchResponse] = useState<TResponseWrapper | null>(
    null
  );

  // channelSearchResponse gets updated if searchResponse is Ok and gets set to searchResponse.Message.
  const [channelSearchResponse, setChannelSearchResponse] =
    useState<ChannelSearchResponse | null>(null);

  // searchError gets updated if searchResponse is !Ok.
  const [searchError, setSearchError] = useState<TResponseWrapper | null>(null);

  // Channels that match the selectedCategories and the search term that was entered.
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

  async function handleSearchSubmit(event: React.FormEvent<HTMLButtonElement>) {
    event.preventDefault();

    let request: SearchRequest = {
      term: searchTerm,
    };

    if (request.term === "") {
      setSearchResponse(null);
      return;
    }

    let response = await postChannelSearchRequest(props.serverUrl, request);
    setSearchResponse(response);
    return;
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSearchTerm(event.target.value);
  }

  // useEffect runs whenever selectedCategories or searchResponse updates.
  useEffect(() => {
    if (selectedCategories.length === 0 && !searchResponse) {
      setChannelsToDisplay(props.channels);
      setSearchError(null);
      setChannelSearchResponse(null);
      return;
    }
    let channelsFiltered: Channel[] = props.channels;

    if (selectedCategories.length > 0) {
      channelsFiltered = props.channels
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
    }

    if (searchResponse) {
      if (!searchResponse.Ok) {
        setSearchError(searchResponse);
        setChannelSearchResponse(null);
        return;
      }

      let channelSearchResponse: ChannelSearchResponse = searchResponse.Message;
      setChannelSearchResponse(channelSearchResponse);
      setSearchError(null);

      channelsFiltered = channelsFiltered.filter((channel) =>
        channelSearchResponse.ChannelIds.includes(channel.Id)
      );
    }

    setChannelsToDisplay(channelsFiltered);
  }, [selectedCategories, searchResponse]);

  return (
    <>
      <Header />
      <div className="border-2">
        <div className="bg-theme-beige-2 sticky top-12 sm:top-16 py-2">
          <FeaturedChannels
            showCategories={showCategories}
            handleCogButtonClick={handleCogButtonClick}
          />
          <div className={showCategories ? "block" : "hidden"}>
            <CategoryCheckboxes
              styles="px-3 rounded-lg my-4 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8"
              channelCategories={props.channelCategories}
              handleCategoryCheck={handleCategoryCheck}
            />
          </div>

          <div className="bg-theme-beige-2  p-2 rounded ">
            <SearchBar
              inputValue={searchTerm}
              handleSubmit={handleSearchSubmit}
              handleInputChange={handleInputChange}
            />
          </div>
        </div>

        <ChannelsToDisplay
          error={searchError}
          searchResponse={channelSearchResponse}
          channels={channelsToDisplay}
        />
      </div>
    </>
  );
}

function Header() {
  return (
    <div className="text-center pb-12">
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
      <p className="text-lg font-black">
        View and search for linked products and discount codes from popular
        youtubers.
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

function ChannelsToDisplay(props: {
  error: TResponseWrapper | null;
  channels: Channel[] | null;
  searchResponse: ChannelSearchResponse | null;
  searchTerm?: string;
}) {
  if (props.error) {
    return (
      <Error
        header={`${props.error.Status} - ${props.error.StatusText}`}
        message={props.error.Message.HitCount}
      />
    );
  }

  if (!props.channels || props.channels.length === 0) {
    return (
      <Error
        header="405 Not Found"
        message="Please un-check the filter categories and/or refine your search."
      />
    );
  }

  if (!props.searchResponse) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-8">
        {props.channels.map((channel) => {
          return <ChannelCard channel={channel} key={channel.Id} />;
        })}
      </div>
    );
  }

  const m = new Map<string, number>(
    Object.entries(props.searchResponse.LinkHitCount)
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-8">
      {props.channels.map((channel) => {
        return (
          <ChannelCard
            channel={channel}
            key={channel.Id}
            hitCount={m.get(channel.Id) || 0}
          />
        );
      })}
    </div>
  );
}

function ChannelCard(props: { channel: Channel; hitCount?: number }) {
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

        {props.hitCount && (
          <div className="bg-theme-yt-red p-2 rounded  text-center text-white inline-block">
            {props.hitCount} Matches
          </div>
        )}
      </button>
    </Link>
  );
}
