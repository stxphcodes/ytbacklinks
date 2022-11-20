

import {
    ErrNullResponse, ErrRequest, ErrUnknown, ResponseError, ResponseWrapper, TResponseWrapper
} from '../utilsLibrary/responseWrapper';

export async function getChannels(serverUrl: string): Promise<TResponseWrapper>{
  let url = new URL(serverUrl)
  url.pathname = `/channels`;

  let r = new ResponseWrapper();
  await fetch(url.toString(), {
    method: 'GET',
    headers: {'accept': 'application/json'},
  })
    .then(response => {
      r.UpdateWithResponse(response);
      if (!r.Ok) {
        throw new ResponseError(`${ErrRequest}: ${url.toString()}`);
      }

      return response.json();
    })
    .then((data: any) => {
      if (!data) {
        throw new ResponseError(ErrNullResponse);
      }

      r.RawMessage = data.Channels;
      r.Message = data.Channels;
    })
    .catch(error => {
      r.Ok && r.SetDefaultError();
      r.Message = error.Message || error.message || ErrUnknown;
      r.RawMessage = error.RawMessage || `In ${getChannels.name}`;
    });

  return r.Serialize();
}


export async function getChannel(
  serverUrl: string,
  channelId: string
): Promise<TResponseWrapper> {
  let url = new URL(serverUrl)
  url.pathname = `/channel/${channelId}`

  let r = new ResponseWrapper();
  await fetch(url.toString(), {
    method: 'GET',
    headers: {'accept': 'application/json'},
  })
    .then(response => {
      r.UpdateWithResponse(response);
      if (!r.Ok) {
        throw new ResponseError(`${ErrRequest}: ${url.toString()}`);
      }

      return response.json();
    })
    .then((data: any) => {
      if (!data) {
        throw new ResponseError(ErrNullResponse);
      }

      r.RawMessage = data;
      r.Message = data;
    })
    .catch(error => {
      r.Ok && r.SetDefaultError();
      r.Message = error.Message || error.message || ErrUnknown;
      r.RawMessage = error.RawMessage || `In ${getChannel.name}`;
    });

  return r.Serialize();
}

// hardcoding for now to avoid making calls to firestore
export function getChannelCategories(): string[] {
  return['beauty', 'lifestyle', 'fashion', 'technology', 'home', 'food', 'games', 'music']
}



// export async function getChannelCategories(firestore: Firestore): Promise<TResponseWrapper> {
//   let r = new ResponseWrapper();

//   try {
//     const docRef = doc(firestore, 'etl-metadata/channel-categories');
//     const docSnap = await getDoc(docRef);
//     if (!docSnap.exists()) {
//       throw new ResponseError(`Document etl-metadata/channel-categories doesn't exist`);
//     }

//     let data = docSnap.data();

//     r.Message = data.categories
//     r.SetDefaultOk();
//   } catch (error: any) {
//     r.Ok && r.SetDefaultError();
//     r.Message = error.message || error.Message || ErrUnknown;
//     r.RawMessage = error.cause || error.RawMessage || `In ${getChannelCategories.name}`;
//   }

//   return r.Serialize();
// }

