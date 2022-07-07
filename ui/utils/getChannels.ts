import {
    ErrNullResponse, ErrRequest, ErrUnknown, ResponseError, ResponseWrapper, TResponseWrapper
} from './responseWrapper';
import { Channel, ChannelUI } from './types';

//const FIREBASE_URL = 'https://links-81c44-default-rtdb.firebaseio.com/';
const FIREBASE_URL = 'https://backlinks-81c44-default-rtdb.firebaseio.com/';

export type ChannelsResponse = {
  [key: string]: ChannelUI;
};

export async function getChannels(): Promise<TResponseWrapper> {
  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `channels.json`;

  let r = new ResponseWrapper();
  await fetch(firebase.toString())
    .then(response => {
      r.UpdateWithResponse(response);
      if (!r.Ok) {
        throw new ResponseError(`${ErrRequest}: ${firebase.toString()}`);
      }

      return response.json();
    })
    .then(async (data: ChannelsResponse) => {
      if (!data) {
        throw new ResponseError(ErrNullResponse);
      }

      await Promise.all(
        Object.keys(data).map(async channelId => {
          let videoCountResp = await getVideoCount(channelId);
          if (!videoCountResp.Ok) {
            return Promise.reject(videoCountResp);
          }
          data[channelId].VideoCount = videoCountResp.Message;

          let linkCountResp = await getLinkCount(channelId);
          if (!linkCountResp.Ok) {
            return Promise.reject(linkCountResp);
          }
          data[channelId].LinkCount = linkCountResp.Message;
        })
      );

      r.RawMessage = data;
      r.Message = data;
    })
    .catch(error => {
      r.Ok && r.SetDefaultError();
      r.Message = error.Message || ErrUnknown;
      r.RawMessage = error.RawMessage || `In ${getChannels.name}`;
    });

  return r.Serialize();
}

export async function getChannel(channelId: string): Promise<TResponseWrapper> {
  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `channels/${channelId}.json`;

  let r = new ResponseWrapper();
  await fetch(firebase.toString())
    .then(response => {
      r.UpdateWithResponse(response);
      if (!r.Ok) {
        throw new ResponseError(`${ErrRequest} ${firebase.toString()}`);
      }

      return response.json();
    })
    .then((data: Channel) => {
      if (!data) {
        throw new ResponseError(ErrNullResponse);
      }

      r.Message = data;
    })
    .catch(error => {
      r.Ok && r.SetDefaultError();
      r.Message = error.Message || ErrUnknown;
      r.RawMessage = error.RawMessage || `In ${getChannel.name}`;
    });

  return r.Serialize();
}

async function getVideoCount(channelId: string): Promise<TResponseWrapper> {
  type Response = {
    [key: string]: boolean;
  };

  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `videosByChannels/${channelId}.json`;
  firebase.searchParams.append('shallow', 'true');

  let r = new ResponseWrapper();
  await fetch(firebase.toString())
    .then(response => {
      r.UpdateWithResponse(response);
      if (!r.Ok) {
        throw new ResponseError(`${ErrRequest} ${firebase.toString()}`);
      }

      return response.json();
    })
    .then((data: Response) => {
      if (!data) {
        throw new ResponseError(ErrNullResponse);
      }

      r.RawMessage = data;
      r.Message = Object.keys(data).length;
    })
    .catch(error => {
      r.Ok && r.SetDefaultError();
      r.Message = error.Message || ErrUnknown;
      r.RawMessage = error.RawMessage || `In ${getVideoCount.name}`;
    });

  return r.Serialize();
}

async function getLinkCount(channelId: string): Promise<TResponseWrapper> {
  type Response = {
    [key: string]: boolean;
  };

  let firebase = new URL(FIREBASE_URL);
  firebase.pathname = `linksByChannels/${channelId}.json`;
  firebase.searchParams.append('shallow', 'true');

  let r = new ResponseWrapper();
  await fetch(firebase.toString())
    .then(response => {
      r.UpdateWithResponse(response);
      if (!r.Ok) {
        throw new ResponseError(`${ErrRequest} ${firebase.toString()}`);
      }

      return response.json();
    })
    .then((data: Response) => {
      if (!data) {
        throw new ResponseError(ErrNullResponse);
      }

      r.RawMessage = data;
      r.Message = Object.keys(data).length;
    })
    .catch(error => {
      r.Ok && r.SetDefaultError();
      r.Message = error.Message || ErrUnknown;
      r.RawMessage = error.RawMessage || `In ${getLinkCount.name}`;
    });

  return r.Serialize();
}
