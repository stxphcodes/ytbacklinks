import { ApiResponse, TApiResponse } from './apiResponse';
import { Link, VideoUI } from './types';

const FIREBASE_URL = 'https://backlinks-81c44-default-rtdb.firebaseio.com/';

export async function getVideos(channelId: string): Promise<TApiResponse> {
  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `videosByChannels/${channelId}.json`;

  let a = new ApiResponse();
  await fetch(firebase.toString())
    .then(response => {
      a.UpdateWithResponse(response);
      if (!response.ok) {
        throw new Error('Unable to fetch videos');
      }

      return response.json();
    })
    .then(async (data: {[videoId: string]: VideoUI}) => {
      if (!data) {
        throw new Error('Unexpected respoonse in getVideos');
      }

      let sorted = Object.values(data).sort((videoA, videoB) =>
        videoB.PublishedAt.localeCompare(videoA.PublishedAt)
      );

      await Promise.all(
        sorted.map(async (video, index) => {
          let linksResponse = await getLinks(channelId, video.Id);
          console.log('this is links repsonse');
          console.log(linksResponse);

          if (!linksResponse.Ok) {
            return Promise.reject(linksResponse.Message);
          }

          sorted[index].Links = linksResponse.Message;
        })
      );

      a.Message = sorted;
    })
    .catch(error => {
      a.Ok && a.SetDefaultError();
      a.Message = error.message || error || 'Unknown';
    });

  return a.Serialize();
}

async function getLinks(
  channelId: string,
  videoId: string
): Promise<TApiResponse> {
  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `linksByChannelsAndVideos/${channelId}/${videoId}.json`;

  let a = new ApiResponse();

  await fetch(firebase.toString())
    .then(response => {
      a.UpdateWithResponse(response);
      if (!a.Ok) {
        throw new Error('Unable to fetch links');
      }
      return response.json();
    })
    .then((r: {[linkId: string]: Link}) => {
      let links: Link[] = [];

      r &&
        Object.entries(r).map(([linkId, link]) => {
          links.push(link);
        });
      a.Message = links;
    })
    .catch(error => {
      a.Ok && a.SetDefaultError();
      a.Message = error.message || 'Unknown';
    });

  return a.Serialize();
}
