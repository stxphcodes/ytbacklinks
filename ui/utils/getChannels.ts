import { ApiResponse, Channel, ChannelUI } from './types';

const FIREBASE_URL = 'https://backlinks-81c44-default-rtdb.firebaseio.com/';

export type ChannelsResponse = {
  [key: string]: ChannelUI;
};

export async function getChannels(): Promise<ApiResponse> {
  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `channels.json`;

  let response = await fetch(firebase.toString());
  let a: ApiResponse = {
    Ok: response.ok,
    Status: response.status,
    StatusText: response.statusText,
    Message: null,
    RawMessage: null,
  };

  if (!response.ok) {
    a.Message = 'Unable to fetch channels';
    return a;
  }

  try {
    let r: ChannelsResponse = await response.json();

    await Promise.all(
      Object.keys(r).map(async channelId => {
        let videoCountResp = await getVideoCount(channelId);
        if (!videoCountResp.Ok) {
          return Promise.reject(videoCountResp);
        }
        r[channelId].VideoCount = videoCountResp.Message;

        let linkCountResp = await getLinkCount(channelId);
        if (!linkCountResp.Ok) {
          return Promise.reject(linkCountResp);
        }
        r[channelId].LinkCount = linkCountResp.Message;
      })
    );

    a.RawMessage = r;
    a.Message = r;
    return a;
  } catch (error: any) {
    return {
      Ok: false,
      Status: 500,
      StatusText: 'Internal Server',
      Message: 'error getting channels response',
      RawMessage: null,
    }
  }
}

export async function getChannel(channelId: string): Promise<ApiResponse> {
  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `channels/${channelId}.json`;

  let response = await fetch(firebase.toString());
  let a: ApiResponse = {
    Ok: response.ok,
    Status: response.status,
    StatusText: response.statusText,
    Message: null,
    RawMessage: null,
  };

  if (!response.ok) {
    a.Message = 'Unable to fetch channel';
    return a;
  }

  try {
    let c: Channel = await response.json();
    if (c) {
      a.Message = c;
      return a;
    }

    return {
      Ok: false,
      Status: 404,
      StatusText: 'Not found',
      Message: `${channelId} not found`,
      RawMessage: null,
    };
  } catch {
    return {
      Ok: false,
      Status: 500,
      StatusText: 'Internal Service',
      Message: 'response type unexpected',
      RawMessage: null,
    };
  }
}

async function getVideoCount(channelId: string): Promise<ApiResponse> {
  type Response = {
    [key: string]: boolean;
  };

  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `videosByChannels/${channelId}.json`;
  firebase.searchParams.append('shallow', 'true');

  let response = await fetch(firebase.toString());
  let a: ApiResponse = {
    Ok: response.ok,
    Status: response.status,
    StatusText: response.statusText,
    Message: null,
    RawMessage: null,
  };

  if (!a.Ok) {
    a.Message = 'Unable to get video counts';
    return a;
  }

  let r: Response = await response.json();
  a.RawMessage = r;
  a.Message = Object.keys(r).length;
  return a;
}

// async function getVideoCount(channelId: string): Promise<number> {
//   type Response = {
//     [key: string]: boolean;
//   };

//   let firebase = new URL(FIREBASE_URL);
//   firebase.pathname = `videosByChannels/${channelId}.json`;
//   firebase.searchParams.append('shallow', 'true');

//   let response = await fetch(firebase.toString());
//   if (response.ok) {
//     let r: Response = await response.json();
//     return Object.keys(r).length;
//   }

//   return -1;
// }

async function getLinkCount(channelId: string): Promise<ApiResponse> {
  type Response = {
    [key: string]: boolean;
  };

  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `linksByChannels/${channelId}.json`;
  firebase.searchParams.append('shallow', 'true');

  let response = await fetch(firebase.toString());
  let a: ApiResponse = {
    Ok: response.ok,
    Status: response.status,
    StatusText: response.statusText,
    Message: null,
    RawMessage: null,
  };

  if (!a.Ok) {
    a.Message = 'Unable to get link count';
    return a;
  }

  let r: Response = await response.json();
  a.RawMessage = r;
  a.Message = Object.keys(r).length;
  return a;
}
