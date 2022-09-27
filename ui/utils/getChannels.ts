import { collection, doc, Firestore, getDoc, getDocs } from 'firebase/firestore';

import { Channel } from '../utilsLibrary/firestoreTypes';
import {
    ErrUnknown, ResponseError, ResponseWrapper, TResponseWrapper
} from '../utilsLibrary/responseWrapper';

export async function getChannels(
  firestore: Firestore
): Promise<TResponseWrapper> {
  let channels: Channel[] = [];
  let r = new ResponseWrapper();

  try {
    const docs = await getDocs(collection(firestore, 'channels'));
    docs.forEach(doc => {
      let data = doc.data();

      channels.push({
        Id: data.Id,
        Title: data.Title,
        Description: data.Description,
        Categories: data.Categories,
        CustomUrl: data.CustomUrl,
        UploadPlaylistId: data.UploadPlaylistId,
        ThumbnailUrl: data.ThumbnailUrl,
        LastUpdated: data.LastUpdated,
        VideoCount: data.VideoCount,
        LinkCount: data.LinkCount,
      });
    });

    r.SetDefaultOk();
    r.Message = channels;
    r.RawMessage = channels;
  } catch (error: any) {
    r.Ok && r.SetDefaultError();
    r.Message = error.Message || error.message || ErrUnknown;
    r.RawMessage = error.cause || error.RawMessage || `In ${getChannels.name}`;
  }

  return r.Serialize();
}

export async function getChannel(
  firestore: Firestore,
  channelId: string
): Promise<TResponseWrapper> {
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
      Categories: data.Categories,
      CustomUrl: data.CustomUrl,
      UploadPlaylistId: data.UploadPlaylistId,
      ThumbnailUrl: data.ThumbnailUrl,
      LastUpdated: data.LastUpdated,
      VideoCount: data.VideoCount,
      LinkCount: data.LinkCount,
    };
    r.SetDefaultOk();
  } catch (error: any) {
    r.Ok && r.SetDefaultError();
    r.Message = error.message || error.Message || ErrUnknown;
    r.RawMessage = error.cause || error.RawMessage || `In ${getChannel.name}`;
  }

  return r.Serialize();
}

export async function getChannelCategories(firestore: Firestore): Promise<TResponseWrapper> {
  let r = new ResponseWrapper();

  try {
    const docRef = doc(firestore, 'etl-metadata/channel-categories');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new ResponseError(`Document etl-metadata/channel-categories doesn't exist`);
    }

    let data = docSnap.data();

    r.Message = data.categories
    r.SetDefaultOk();
  } catch (error: any) {
    r.Ok && r.SetDefaultError();
    r.Message = error.message || error.Message || ErrUnknown;
    r.RawMessage = error.cause || error.RawMessage || `In ${getChannelCategories.name}`;
  }

  return r.Serialize();
}

