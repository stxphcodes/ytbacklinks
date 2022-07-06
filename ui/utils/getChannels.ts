import { ApiResponse, TApiResponse } from './apiResponse';
import { Channel, ChannelUI } from './types';

//const FIREBASE_URL = 'https://links-81c44-default-rtdb.firebaseio.com/';
const FIREBASE_URL = 'https://backlinks-81c44-default-rtdb.firebaseio.com/';

export type ChannelsResponse = {
  [key: string]: ChannelUI;
};

export async function getChannels(): Promise<TApiResponse> {
  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `channels.json`;

  let a = new ApiResponse();

  await fetch(firebase.toString())
    .then(response => {
      a.UpdateWithResponse(response);

      // throw if non-networking error is encountered
      if (!a.Ok) {
        throw new Error('Error calling url');
      }

      return response.json();
    })
    .then(async (r: ChannelsResponse) => {
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
      a.Ok && a.SetDefaultError();
      a.Message = error.message || 'Unknown';
    });

  return a.Serialize();
}


export async function getChannel(channelId: string): Promise<TApiResponse> {
  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `channels/${channelId}.json`;

  let a = new ApiResponse();

  await fetch(firebase.toString())
    .then(response => {
      a.UpdateWithResponse(response);

      // throw if non-networking error is encountered
      if (!a.Ok) {
        throw new Error('Error calling url');
      }

      return response.json();
    })
    .then((c: Channel) => {
      if (!c) {
        throw new Error(`${channelId} not found in database`);
      }

      a.Message = c;
    })
    .catch(error => {
      a.Ok && a.SetDefaultError();
      a.Message = error.message || 'Unknown error';
    });

  return a.Serialize();
}

async function getVideoCount(channelId: string): Promise<TApiResponse> {
  type Response = {
    [key: string]: boolean;
  };

  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `videosByChannels/${channelId}.json`;
  firebase.searchParams.append('shallow', 'true');

  let a = new ApiResponse();
  await fetch(firebase.toString())
    .then(response => {
      a.UpdateWithResponse(response);

      // throw if non-networking error is encountered
      if (!a.Ok) {
        throw new Error('Error calling url. Unable to get video count');
      }

      return response.json();
    })
    .then((r: Response) => {
      if (!r) {
        throw new Error('Error calling getVideoCount. Type not expected');
      }

      a.RawMessage = r;
      a.Message = Object.keys(r).length;
    })
    .catch(error => {
      a.Ok && a.SetDefaultError();
      a.Message = error.message || 'Unknown error';
    });

  return a.Serialize();
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

async function getLinkCount(channelId: string): Promise<TApiResponse> {
  type Response = {
    [key: string]: boolean;
  };

  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `linksByChannels/${channelId}.json`;
  firebase.searchParams.append('shallow', 'true');

  let a = new ApiResponse();
  await fetch(firebase.toString())
    .then(response => {
      a.UpdateWithResponse(response);

      // throw if non-networking error is encountered
      if (!a.Ok) {
        throw new Error('Error calling url. Unable to get video count');
      }

      return response.json();
    })
    .then((r: Response) => {
      if (!r) {
        throw new Error('Error calling getVideoCount. Type not expected');
      }

      a.RawMessage = r;
      a.Message = Object.keys(r).length;
    })
    .catch(error => {
      a.Ok && a.SetDefaultError();
      a.Message = error.message || 'Unknown error';
    });

  return a.Serialize();
}
