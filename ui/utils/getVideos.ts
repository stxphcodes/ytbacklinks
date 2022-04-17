import { Link, VideoUI } from './types';

const FIREBASE_URL = 'https://backlinks-81c44-default-rtdb.firebaseio.com/';

export type VideoResponse = {
  [key: string]: VideoUI;
};

export async function getVideos(
  channelId: string
): Promise<VideoResponse | null> {
  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `videosByChannels/${channelId}.json`;

  let response = await fetch(firebase.toString());
  if (!response.ok) {
    return null;
  }

  let r: VideoResponse = await response.json();

  await Promise.all(
    Object.keys(r).map(async videoId => {
      r[videoId].Links = await getLinks(channelId, videoId);
    })
  );

  return r;
}

export type LinkResponse = {
  [key: string]: Link;
};

async function getLinks(channelId: string, videoId: string): Promise<Link[]> {
  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `linksByChannelsAndVideos/${channelId}/${videoId}.json`;

  let response = await fetch(firebase.toString());

  let links: Link[] = [];
  if (response.ok) {
    let r: LinkResponse | null = await response.json();

    if (r === null) {
      return links;
    }

    Object.entries(r).map(([linkId, link]) => {
      links.push(link);
    });
  }

  return links;
}
