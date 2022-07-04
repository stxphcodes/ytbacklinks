import { ApiResponse, Link, VideoUI } from './types';

const FIREBASE_URL = 'https://backlinks-81c44-default-rtdb.firebaseio.com/';

export async function getVideos(channelId: string): Promise<ApiResponse> {
  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `videosByChannels/${channelId}.json`;

  let response = await fetch(firebase.toString());
  let a: ApiResponse = {
    Ok: response.ok,
    Status: response.status,
    StatusText: response.statusText,
    Message: null,
    RawMessage: null,
  }

  if (!response.ok) {
   a.Message = "Unable to fetch  videos"
   return a
  }
  

  let data: {[videoId: string]: VideoUI} = await response.json();

  let sorted = Object.values(data).sort((videoA, videoB) =>
    videoB.PublishedAt.localeCompare(videoA.PublishedAt)
  );

  try {
    await Promise.all(
    sorted.map(async (video, index) => {
      let linksResponse = await getLinks(channelId, video.Id);
      if (!linksResponse.Ok){
        return Promise.reject(linksResponse)
      }

      sorted[index].Links = linksResponse.Message

      // sorted[index].Links = await getLinks(channelId, video.Id);
    })
  )}catch (error: any) {

return error;
  };

  a.Message = sorted;

  return a
}

async function getLinks(channelId: string, videoId: string): Promise<ApiResponse> {
  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `linksByChannelsAndVideos/${channelId}/${videoId}.json`;

  let response = await fetch(firebase.toString());
  let a: ApiResponse = {
    Ok: response.ok,
    Status: response.status,
    StatusText: response.statusText,
    Message: null,
    RawMessage: null,
  }

  if (!response.ok) {
   a.Message = "Unable to fetch links"
   return a
  }

  let links: Link[] = [];
 
    let r: {[linkId: string]: Link} = await response.json();
    r && Object.entries(r).map(([linkId, link]) => {
      links.push(link);
    });
  

    a.Message = links
    return a
}
