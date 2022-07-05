import { ApiResponse, Channel, ChannelUI } from './types';

//const FIREBASE_URL = 'https://links-81c44-default-rtdb.firebaseio.com/';
const FIREBASE_URL = 'https://backlinks-81c44-default-rtdb.firebaseio.com/';

export type ChannelsResponse = {
  [key: string]: ChannelUI;
};

function handleResponse(response: Response, a: ApiResponse) {
  a.Ok = response.ok;
  a.Status = response.status;
  a.StatusText = response.statusText;

  // throw if non-networking error is encountered
  if (!a.Ok) {
    throw new Error('Error calling url');
  }

  return response;
}

export async function getChannels(): Promise<ApiResponse> {
  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `channels.json`;

  let a: ApiResponse = {
    Ok: false,
    Status: 500,
    StatusText: 'Internal Server',
    Message: null,
    RawMessage: null,
  };

  await fetch(firebase.toString())
    .then(response => {
      a.Ok = response.ok;
      a.Status = response.status;
      a.StatusText = response.statusText;

      // throw if non-networking error is encountered
      if (!a.Ok) {
        throw new Error('Error calling url');
      }

      return response;
    })
    .then(async response => {
      let r: ChannelsResponse = await response.json().catch(error => {
        throw new Error(
          error.message || 'Error calling json() on response object'
        );
      });

      // handle if r is null
      if (!r) {
        throw new Error('Unexpected response object type');
      }

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
    })
    .catch(error => {
      if (a.Ok) {
        a.Ok = false;
        a.Status = 500;
        a.StatusText = 'Internal Server';
      }

      a.Message = error.message || 'Unknown';
    });

  return a;
}

export async function getChannel(channelId: string): Promise<ApiResponse> {
  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `channels/${channelId}.json`;
  let a: ApiResponse = {
    Ok: false,
    Status: 500,
    StatusText: 'Internal Server',
    Message: null,
    RawMessage: null,
  };

  await fetch(firebase.toString())
    .then(response => {
      a.Ok = response.ok;
      a.Status = response.status;
      a.StatusText = response.statusText;

      // throw if non-networking error is encountered
      if (!a.Ok) {
        throw new Error('Error calling url');
      }

      return response;
    })
    .then(async response => {
      let c: Channel = await response.json().catch(error => {
        throw new Error(
          error.message || 'Error calling json() on response object'
        );
      });

      if (c) {
        a.Message = c;
        return;
      }

      a.Ok = false;
      a.Status = 404;
      a.StatusText = 'Not Found';
      throw new Error(`${channelId} not found in database`);
    })
    .catch(error => {
      if (a.Ok) {
        a.Ok = false;
        a.Status = 500;
        a.StatusText = 'Internal Server';
      }

      a.Message = error.message || 'Unknown error';
    });

  return a;
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
