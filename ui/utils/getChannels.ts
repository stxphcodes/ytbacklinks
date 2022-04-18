import { Channel, ChannelUI } from './types';

const FIREBASE_URL = 'https://backlinks-81c44-default-rtdb.firebaseio.com/';

export type ChannelsResponse = {
  [key: string]: ChannelUI;
};

export async function getChannels(): Promise<ChannelsResponse | null> {
  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `channels.json`;

  let response = await fetch(firebase.toString());
  if (!response.ok) {
    return null;
  }

  let r: ChannelsResponse = await response.json();

  await Promise.all(
    Object.keys(r).map(async channelId => {
      r[channelId].VideoCount = await getVideoCount(channelId);
      r[channelId].LinkCount = await getLinkCount(channelId);
    })
  );

  return r;
}

export async function getChannel(channelId: string):Promise<Channel | null> {
    let firebase = new URL(FIREBASE_URL);
    firebase.pathname = `channels/${channelId}.json`;
  
    let response = await fetch(firebase.toString());
    if (!response.ok) {
      return null;
    }
  
    let r: Channel | null = await response.json();
    return r;
}

async function getVideoCount(channelId: string): Promise<number> {
  type Response = {
    [key: string]: boolean;
  };

  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `videosByChannels/${channelId}.json`;
  firebase.searchParams.append('shallow', 'true');

  let response = await fetch(firebase.toString());
  if (response.ok) {
    let r: Response = await response.json();
    return Object.keys(r).length;
  }

  return -1;
}

async function getLinkCount(channelId: string): Promise<number> {
    type Response = {
      [key: string]: boolean;
    };
  
    let firebase = new URL(FIREBASE_URL);
    firebase.pathname = `linksByChannels/${channelId}.json`;
    firebase.searchParams.append('shallow', 'true');
  
    let response = await fetch(firebase.toString());
    if (response.ok) {
      let r: Response = await response.json();
      return Object.keys(r).length;
    }
  
    return -1;
  }
