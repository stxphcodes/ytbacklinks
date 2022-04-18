import { Link, VideoUI } from './types';

const FIREBASE_URL = 'https://backlinks-81c44-default-rtdb.firebaseio.com/';

export async function getVideos(channelId: string): Promise<VideoUI[] | null> {
  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `videosByChannels/${channelId}.json`;

  let response = await fetch(firebase.toString());
  if (!response.ok) {
    console.log(response);
    return null;
  }

  let data: {[videoId: string]: VideoUI} = await response.json();

  let sorted = Object.values(data).sort((videoA, videoB) =>
    videoB.PublishedAt.localeCompare(videoA.PublishedAt)
  );

  await Promise.all(
    sorted.map(async (video, index) => {
      sorted[index].Links = await getLinks(channelId, video.Id);
    })
  );

  return sorted;
}

async function getLinks(channelId: string, videoId: string): Promise<Link[]> {
  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `linksByChannelsAndVideos/${channelId}/${videoId}.json`;

  let response = await fetch(firebase.toString());

  let links: Link[] = [];
  if (response.ok) {
    let r: {[linkId: string]: Link} = await response.json();

    if (r === null) {
      return links;
    }

    Object.entries(r).map(([linkId, link]) => {
      links.push(link);
    });
  }

  return links;
}
