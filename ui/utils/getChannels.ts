import { collection, doc, Firestore, getDoc, getDocs } from 'firebase/firestore';

import { ChannelUI } from '../utilsLibrary/firestoreTypes';
import {
    ErrUnknown, ResponseError, ResponseWrapper, TResponseWrapper
} from '../utilsLibrary/responseWrapper';

export type ChannelsResponse = {
  [key: string]: ChannelUI;
};

export async function getChannels(firestore: Firestore): Promise<TResponseWrapper> {
  let channels: ChannelsResponse = {};
  let r = new ResponseWrapper();
  
  try {
    const docs = await getDocs(collection(firestore, 'channels'));
    docs.forEach(doc => {
      let data = doc.data();
    
      channels[data.Id] = {
        Id: data.Id,
        Title: data.Title,
        Description: data.Description,
        CustomUrl: data.CustomUrl,
        UploadPlaylistId: data.UploadPlaylistId,
        ThumbnailUrl: data.ThumbnailUrl,
        LastUpdated: data.LastUpdated,
        VideoCount: 0,
        LinkCount: 0,
      };;
    });

    await Promise.all(
      Object.values(channels).map(async channelUI => {
        let channelResponse = await getChannel(firestore, channelUI.Id);
        if (!channelResponse.Ok) {
          return Promise.reject(channelResponse);
        }

        channelUI.VideoCount = channelResponse.Message.VideoCount;
        channelUI.LinkCount = channelResponse.Message.LinkCount;
      })
    );

    r.SetDefaultOk();
    r.Message = channels;
    r.RawMessage = channels;
  } catch (error: any) {
    r.Ok && r.SetDefaultError();
    r.Message =  error.Message || error.message || ErrUnknown;
    r.RawMessage = error.cause || error.RawMessage || `In ${getChannels.name}`;
  }

  return r.Serialize();
}

export async function getChannel(firestore: Firestore, channelId: string): Promise<TResponseWrapper> {
  let r = new ResponseWrapper();

  try {
    const docRef = doc(firestore, 'channels', channelId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new ResponseError(`Document channels/${channelId} doesn't exist`);
    }

    let data = docSnap.data();

    r.Message = {
      Id: data.Id,
      Title: data.Title,
      Description: data.Description,
      CustomUrl: data.CustomUrl,
      UploadPlaylistId: data.UploadPlaylistId,
      ThumbnailUrl: data.ThumbnailUrl,
      LastUpdated: data.LastUpdated,
      VideoCount: data.VideoCount,
      LinkCount: data.LinkCount,  
    };
    r.SetDefaultOk()
  } catch (error: any) {
    r.Ok && r.SetDefaultError();
    r.Message = error.message || error.Message || ErrUnknown;
    r.RawMessage = error.cause || error.RawMessage || `In ${getChannel.name}`;
  }

  return r.Serialize();
}