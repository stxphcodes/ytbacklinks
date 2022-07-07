import {
    ErrNullResponse, ErrRequest, ErrUnknown, ResponseError, ResponseWrapper, TResponseWrapper
} from './responseWrapper';
import { Link, VideoUI } from './types';

const FIREBASE_URL = 'https://backlinks-81c44-default-rtdb.firebaseio.com/';

export async function getVideos(channelId: string): Promise<TResponseWrapper> {
  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `videosByChannels/${channelId}.json`;

  let r = new ResponseWrapper();
  await fetch(firebase.toString())
    .then(response => {
      r.UpdateWithResponse(response);
      if (!response.ok) {
        throw new ResponseError(`${ErrRequest} ${firebase.toString()}`);
      }

      return response.json();
    })
    .then(async (data: {[videoId: string]: VideoUI}) => {
      if (!data) {
        throw new ResponseError(ErrNullResponse);
      }

      let sorted = Object.values(data).sort((videoA, videoB) =>
        videoB.PublishedAt.localeCompare(videoA.PublishedAt)
      );

      await Promise.all(
        sorted.map(async (video, index) => {
          let linksResponse = await getLinks(channelId, video.Id);
          if (!linksResponse.Ok) {
            return Promise.reject(linksResponse);
          }

          sorted[index].Links = linksResponse.Message;
        })
      );

      r.Message = sorted;
    })
    .catch(error => {
      r.Ok && r.SetDefaultError();
      r.Message = error.Message || ErrUnknown;
      r.RawMessage = error.RawMessage || `In ${getVideos.name}`;
    });

  return r.Serialize();
}

async function getLinks(
  channelId: string,
  videoId: string
): Promise<TResponseWrapper> {
  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `linksByChannelsAndVideos/${channelId}/${videoId}.json`;

  let r = new ResponseWrapper();
  await fetch(firebase.toString())
    .then(response => {
      r.UpdateWithResponse(response);
      if (!r.Ok) {
        throw new ResponseError(`${ErrRequest} ${firebase.toString()}`);
      }
      return response.json();
    })
    .then((data: {[linkId: string]: Link}) => {
      let links: Link[] = [];

      data &&
        Object.entries(data).map(([linkId, link]) => {
          links.push(link);
        });

      r.Message = links;
    })
    .catch(error => {
      r.Ok && r.SetDefaultError();
      r.Message = error.Message || ErrUnknown;
      r.RawMessage = error.RawMessage || `In ${getLinks.name}`;
    });

  return r.Serialize();
}
