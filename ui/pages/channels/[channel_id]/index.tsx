import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';

import Error from '../../../components/error';
import ErrorPage from '../../../components/error/page';
import { LinkIcon } from '../../../components/icons/link';
import SearchBar from '../../../components/searchbar';
import Toggle from '../../../components/toggle';
import { getChannel } from '../../../utils/getChannels';
import { getServerUrl } from '../../../utils/getServer';
import { postSearchRequest } from '../../../utils/postSearchRequest';
import { Channel, Link, VideoUI } from '../../../utilsLibrary/firestoreTypes';
import {
    ErrUrlParam, ResponseWrapper, TResponseWrapper
} from '../../../utilsLibrary/responseWrapper';
import {
    LinkSearchResponse, SearchRequest, VideoSearchResponse
} from '../../../utilsLibrary/searchTypes';

type Props = {
  channel: Channel | null;
  videos: VideoUI[] | null;
  error: TResponseWrapper | null;
  serverUrl: string | null;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const channel_id = context.params?.channel_id;
  if (typeof channel_id !== "string") {
    return {
      props: {
        error: new ResponseWrapper(
          false,
          400,
          "Bad Request",
          `${ErrUrlParam} ${channel_id}`
        ).Serialize(),
      },
    };
  }

  let serverUrlResponse = getServerUrl();
  if (!serverUrlResponse.Ok) {
    return {
      props: { error: serverUrlResponse },
    };
  }
  let serverUrl = serverUrlResponse.Message;

  let channelResponse = await getChannel(serverUrl, channel_id);
  if (!channelResponse.Ok) {
    return {
      props: { error: channelResponse },
    };
  }

  return {
    props: {
      channel: channelResponse.Message.Channel,
      videos: channelResponse.Message.Videos,
      serverUrl: serverUrl,
      error: null,
    },
  };
};

export default function Index({ videos, channel, serverUrl, error }: Props) {
  if (error) {
    return <ErrorPage response={error} />;
  }

  if (!channel || !videos || !serverUrl) {
    return (
      <ErrorPage
        response={new ResponseWrapper(
          false,
          500,
          "Server Error",
          "Unable to get channel info and videos."
        ).Serialize()}
      />
    );
  }

  return (
    <ChannelPage channel={channel} videos={videos} serverUrl={serverUrl} />
  );
}

function ChannelPage(props: {
  channel: Channel;
  videos: VideoUI[];
  serverUrl: string;
}) {
  // search term user entered in the search bar.
  const [searchTerm, setSearchTerm] = useState("");

  // display option user selects in the toggle switch.
  const [displayOption, setDisplayOption] = useState("linksOnly");

  // videos to show. Defaults to all videos if no search term is entered.
  // Updated when search is entered.
  const [videosToShow, setVideosToShow] = useState(props.videos);

  // searchResponse returned in postSearchRequest.
  const [searchResponse, setSearchResponse] = useState<TResponseWrapper | null>(
    null
  );

  // searchError is updated if !searchResponse.Ok
  const [searchError, setSearchError] = useState<TResponseWrapper | null>(null);

  // linkSearchResponse is updated if searchResponse is successful.
  // linkSearchResponse contains matched links from the search request.
  const [linkSearchResponse, setLinkSearchResponse] =
    useState<LinkSearchResponse | null>(null);

  // videoSearchResponse is udpated if searchResponse is successful.
  // videoSearchResponse contains matched video descriptions from the search request.
  const [videoSearchResponse, setVideoSearchResponse] =
    useState<VideoSearchResponse | null>(null);

  function handleToggleClick(event: any) {
    if (displayOption === "linksOnly") {
      setDisplayOption("descriptionBoxes");
    } else {
      setDisplayOption("linksOnly");
    }
  }

  async function handleSearchSubmit(event: React.FormEvent<HTMLButtonElement>) {
    event.preventDefault();

    let request: SearchRequest = {
      channelId: props.channel.Id,
      term: searchTerm,
    };

    if (request.term === "") {
      setSearchResponse(null);
      return;
    }

    let response = await postSearchRequest(props.serverUrl, request);
    setSearchResponse(response);
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSearchTerm(event.target.value);
  }

  // Runs every time search response changes.
  // searchResponse.message is the type CombinedSearchResponse.
  useEffect(() => {
    // SearchResponse is null at intial state and
    // whenever search term is blank. Reset search
    // response states to default.
    if (!searchResponse) {
      setVideosToShow(props.videos);
      setLinkSearchResponse(null);
      setVideoSearchResponse(null);
      setSearchError(null);
      return;
    }

    // searchResponse returned error.
    if (!searchResponse.Ok) {
      setSearchError(searchResponse);
      setLinkSearchResponse(null);
      setVideoSearchResponse(null);
      setVideosToShow([]);
      return;
    }

    let linkSearchResponse: LinkSearchResponse =
      searchResponse.Message.LinkSearchResponse;
    let videoSearchResponse: VideoSearchResponse =
      searchResponse.Message.VideoSearchResponse;

    // searchResponse returned 0 results for both display options.
    if (!linkSearchResponse.HitCount && !videoSearchResponse.HitCount) {
      setSearchError(
        new ResponseWrapper(
          false,
          404,
          "Not found",
          "No results found for search term.",
          null
        ).Serialize()
      );
      setLinkSearchResponse(null);
      setVideoSearchResponse(null);
      setVideosToShow([]);
      return;
    }

    // Show matched results.
    setVideosToShow(
      props.videos.filter((video) => {
        if (displayOption === "linksonly") {
          return linkSearchResponse.VideoIds.includes(video.Id);
        } else {
          return videoSearchResponse.VideoIds.includes(video.Id);
        }
      })
    );
    setLinkSearchResponse(linkSearchResponse);
    setVideoSearchResponse(videoSearchResponse);
    setSearchError(null);

    // If the display option chosen returned 0 results, set error telling user
    // to switch to the other display option.
    if (
      (displayOption === "linksOnly" && !linkSearchResponse.HitCount) ||
      (displayOption === "fullDescriptionBoxes" &&
        !videoSearchResponse.HitCount)
    ) {
      setSearchError(
        new ResponseWrapper(
          false,
          405,
          "Not found",
          "No results found for in this view. Toggle switch to change view.",
          null
        ).Serialize()
      );
    }

    return;
  }, [searchResponse, displayOption]);

  return (
    <div className="-m-10 sm:-m-12 border-x border-theme-beige-1">
      <div className="w-full text-center bg-theme-beige-1 p-4 text-sm">
        {" "}
        YoutubeBacklinks currently only catalogs videos from 2022. We update the
        catalog weekly for new videos.
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5">
        <div className="hidden lg:block col-span-1 bg-theme-beige p-8">
          <ChannelSidebar channel={props.channel} />
        </div>
        <div className="col-span-4 bg-theme-beige-2 px-8 py-4">
          <div className="flex lg:hidden p-2">
            <ChannelHeader channel={props.channel} />
          </div>

          <div className="bg-theme-beige-2  py-2 sticky top-12 sm:top-16">
            <SearchBar
              inputValue={searchTerm}
              handleSubmit={handleSearchSubmit}
              handleInputChange={handleInputChange}
            />
            <Toggle
              displayOption={displayOption}
              handleClick={handleToggleClick}
            />
            {searchResponse && (
              <HitCounts
                totalLinkHits={
                  linkSearchResponse ? linkSearchResponse.HitCount : 0
                }
                totalVideoHits={
                  videoSearchResponse ? videoSearchResponse.HitCount : 0
                }
              />
            )}
          </div>

          <SearchResults
            error={searchError}
            videos={videosToShow}
            linkSearchResponse={linkSearchResponse}
            videoSearchResponse={videoSearchResponse}
            displayOption={displayOption}
            searchTerm={searchTerm}
          />
        </div>
      </div>
    </div>
  );
}

function ChannelSidebar(props: { channel: Channel }) {
  return (
    <div className="rounded-lg sticky top-14 py-2">
      <img src={props.channel.ThumbnailUrl} referrerPolicy="no-referrer"></img>
      <h1 className="py-4 font-black text-2xl lg:text-3xl ">
        {props.channel.Title}
      </h1>
      <div className="flex justify-between">
        <span className="font-black">Link Count</span>
        {props.channel.LinkCount}
      </div>
      <div className="flex justify-between">
        <span className="font-black">Video Count</span>
        {props.channel.VideoCount}
      </div>
      <p className="text-tiny xl:text-md pt-4">{props.channel.Description}</p>
    </div>
  );
}

function ChannelHeader(props: { channel: Channel }) {
  return (
    <>
      <img
        className="object-scale-down w-20"
        src={props.channel.ThumbnailUrl}
        referrerPolicy="no-referrer"
      />
      <div className="ml-8">
        <h1 className="font-black text-2xl md:text-3xl">
          {props.channel.Title}
        </h1>
        <div>
          <span className="text-sm font-black">Link Count</span>{" "}
          {props.channel.LinkCount}
        </div>
        <div>
          <span className="text-sm font-black">Video Count</span>{" "}
          {props.channel.VideoCount}
        </div>
      </div>
    </>
  );
}

function SearchResults(props: {
  videos: VideoUI[];
  error: TResponseWrapper | null;
  linkSearchResponse: LinkSearchResponse | null;
  videoSearchResponse: VideoSearchResponse | null;
  displayOption: string;
  searchTerm?: string;
}) {
  if (props.error) {
    return (
      <Error
        header={`${props.error.Status} ${props.error.StatusText}`}
        message={props.error.Message}
      />
    );
  }

  // this only happens when search is empty (default state so show all videos)
  if (!props.linkSearchResponse && !props.videoSearchResponse) {
    return (
      <>
        {props.videos.map((video) => {
          return (
            <VideoCard
              video={video}
              titleHit={false}
              linkHits={[]}
              key={video.Id}
              displayOption={props.displayOption}
              searchTerm={""}
            />
          );
        })}
      </>
    );
  }

  return (
    <>
      {props.displayOption === "linksOnly" ? (
        <>
          {props.videos.map((video) => {
            if (
              props.linkSearchResponse &&
              (!props.linkSearchResponse.LinkHits[video.Id] ||
                !props.linkSearchResponse.LinkHits[video.Id].length)
            ) {
              return (
                <VideoCard
                  key={video.Id}
                  video={video}
                  titleHit={
                    props.linkSearchResponse.VideoTitleHits[video.Id] !==
                    undefined
                  }
                  linkHits={[]}
                  displayOption={props.displayOption}
                  searchTerm={props.searchTerm || ""}
                />
              );
            }

            return (
              <VideoCard
                key={video.Id}
                video={video}
                titleHit={
                  props.linkSearchResponse
                    ? props.linkSearchResponse.VideoTitleHits[video.Id] !==
                      undefined
                    : false
                }
                linkHits={
                  props.linkSearchResponse &&
                  props.linkSearchResponse.LinkHits[video.Id]
                }
                displayOption={props.displayOption}
                searchTerm={props.searchTerm || ""}
              />
            );
          })}
        </>
      ) : (
        <>
          {props.videos.map((video) => {
            return (
              <VideoCard
                key={video.Id}
                video={video}
                titleHit={
                  props.videoSearchResponse
                    ? props.videoSearchResponse.VideoTitleHits[video.Id] !==
                      undefined
                    : false
                }
                linkHits={[]}
                displayOption={props.displayOption}
                searchTerm={props.searchTerm || ""}
              />
            );
          })}
        </>
      )}
    </>
  );
}

function VideoCard(props: {
  video: VideoUI;
  titleHit: boolean;
  linkHits: string[];
  displayOption: string;
  searchTerm: string;
}) {
  // links in alphabetical order.
  const links = new Map(
    props.video.Links.map((link) => {
      let text =
        link.Brand !== ""
          ? `${link.Brand} - ${link.Description}`
          : link.Description;

      if (props.searchTerm != "") {
        text = highlightTerm(text, props.searchTerm);
      }
      return [text, link.Href];
    })
  );

  return (
    <div
      className="bg-theme-beige-1 grid grid-cols-1 md:grid-cols-4 md:gap-x-8 mt-4 p-4 rounded-lg shadow-sm"
      key={props.video.Id}
    >
      <div className="col-span-1 ">
        <a
          href={`https://youtube.com/watch?v=${props.video.Id}`}
          target="_blank"
        >
          <img
            className="w-24 md:w-auto md:h-auto "
            src={props.video.ThumbnailUrl}
          />
        </a>

        {props.titleHit ? (
          <h1
            className="font-black py-2 text-sm md:text-md"
            dangerouslySetInnerHTML={{
              __html: findUrl(
                highlightTerm(props.video.Title, props.searchTerm)
              ),
            }}
          ></h1>
        ) : (
          <h1 className="font-black py-2 text-sm md:text-md">
            {props.video.Title}
          </h1>
        )}
        <p>{props.video.PublishedAt}</p>
      </div>

      <div className="col-span-3">
        {props.displayOption === "linksOnly" ? (
          <div>
            {props.video.Links.sort((a, b) => {
              let atext = a.Brand
                ? `${a.Brand} - ${a.Description}`
                : a.Description;
              let btext = b.Brand
                ? `${b.Brand} - ${b.Description}`
                : b.Description;

              return atext.toLowerCase().localeCompare(btext.toLowerCase());
            }).map((link) => {
              return (
                <LinkText
                  link={link}
                  active={props.linkHits.includes(link.Id)}
                  key={link.Id}
                  term={props.searchTerm}
                />
              );
            })}
          </div>
        ) : (
          // <ul className="flex flex-wrap md:place-content-start">
          //   {props.video.Links.sort((a, b) => {
          //     // a.Description.localeCompare(b.Description))
          //     let atext = a.Brand
          //       ? `${a.Brand} - ${a.Description}`
          //       : a.Description;
          //     let btext = b.Brand
          //       ? `${b.Brand} - ${b.Description}`
          //       : b.Description;

          //     return atext.toLowerCase().localeCompare(btext.toLowerCase());
          //   }).map((link) => {
          //     return (
          //       <LinkButton
          //         link={link}
          //         active={props.linkHits.includes(link.Id)}
          //         key={link.Id}
          //         term={props.searchTerm}
          //       />
          //     );
          //   })}
          // </ul>
          <span className="whitespace-pre-line">
            {props.searchTerm == "" ? (
              <p
                className="text-tiny md:text-md break-words"
                dangerouslySetInnerHTML={{
                  __html: findUrl(props.video.Description),
                }}
              />
            ) : (
              <p
                className="text-tiny md:text-md break-words"
                dangerouslySetInnerHTML={{
                  __html: findUrl(
                    highlightTerm(props.video.Description, props.searchTerm)
                  ),
                }}
              />
            )}
          </span>
        )}
      </div>
    </div>
  );
}

function findUrl(text: string) {
  var urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, function (url: string) {
    return (
      '<a href="' +
      url +
      '" class="text-theme-yt-red" target="_blank">' +
      url +
      "</a>"
    );
  });
}

function highlightTerm(text: string, term: string) {
  let textSplit = text.split(" ");
  let termSplit = term.split(" ");

  termSplit.forEach((termWord) => {
    if (!termWord) {
      return;
    }

    textSplit.forEach((word, index) => {
      let lowercaseWord = word.toLowerCase();
      if (lowercaseWord.includes(termWord.toLowerCase())) {
        if (!word.includes("https")) {
          textSplit[index] =
            '<span class="bg-theme-yellow" >' + word + "</span>";
        }
      }
    });
  });

  return textSplit.join(" ");
}

function LinkText(props: { link: Link; active: boolean; term: string }) {
  let text =
    props.link.Brand !== ""
      ? `${props.link.Brand} - ${props.link.Description}`
      : props.link.Description;

  if (props.term != "") {
    text = highlightTerm(text, props.term);
  }

  return (
    <div className="flex items-center">
      <LinkIcon />
      <a
        href={props.link.Href}
        className="break-all block pb-1 hover:text-theme-yt-red px-2"
        dangerouslySetInnerHTML={{
          __html: text,
        }}
      ></a>
    </div>
  );
}

function LinkButton(props: { link: Link; active: boolean; term: string }) {
  let buttonText =
    props.link.Brand !== ""
      ? `${props.link.Brand} - ${props.link.Description}`
      : props.link.Description;
  if (props.term != "") {
    buttonText = highlightTerm(buttonText, props.term);
  }

  return (
    <li key={props.link.Id} className="p-2">
      <a href={props.link.Href} target="_blank">
        {props.active ? (
          <button className="break-words bg-theme-beige border-2 border-theme-yt-red hover:bg-theme-beige-2 hover:border-none hover:text-theme-yt-red hover:shadow-inner p-2 rounded shadow-lg text-left text-sm md-text-md">
            <p
              className="break-all"
              dangerouslySetInnerHTML={{
                __html: buttonText,
              }}
            />
          </button>
        ) : (
          <button className="break-words bg-theme-beige hover:bg-theme-beige-2 hover:text-theme-yt-red hover:shadow-inner p-2 rounded shadow-lg text-left text-sm md:text-md">
            <p
              className="break-all"
              dangerouslySetInnerHTML={{
                __html: buttonText,
              }}
            />
          </button>
        )}
      </a>
    </li>
  );
}

function HitCounts(props: { totalLinkHits: number; totalVideoHits: number }) {
  return (
    <div className="flex flex-wrap place-content-start gap-x-2 gap-y-1 text-sm mt-4">
      <div className="bg-theme-yt-red p-2 rounded  text-left text-white">
        Link Results: {props.totalLinkHits}
      </div>
      <div className="bg-theme-yt-red p-2 rounded  text-left text-white">
        Full Description Box Results: {props.totalVideoHits}
      </div>
    </div>
  );
}
