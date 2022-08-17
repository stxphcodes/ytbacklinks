import { collection, Firestore, getDocs } from 'firebase/firestore';

import { VideoUI } from '../utilsLibrary/firestoreTypes';
import { ErrUnknown, ResponseWrapper, TResponseWrapper } from '../utilsLibrary/responseWrapper';

export async function getVideos(firestore: Firestore, channelId: string): Promise<TResponseWrapper> {
  let r = new ResponseWrapper();

  try {
    let filtered: VideoUI[] = [];
    const videoDocs = await getDocs(collection(firestore, channelId));
    
    videoDocs.forEach( vdoc => {
      let vdata = vdoc.data();
      let video: VideoUI = {
        Id: vdata.Id,
        Title: vdata.Title,
        ChannelId: vdata.ChannelId,
        Description: vdata.Description,
        PublishedAt: vdata.PublishedAt,
        ThumbnailUrl: vdata.ThumbnailUrl,
        LastUpdated: vdata.LastUpdated,
        Links: [],
      };
      filtered.push(video)
    })

    await Promise.all(
      filtered.map(async video => {
        const linkDocs = await getDocs(
          collection(firestore, `${channelId}/${video.Id}/links`)
        );
        linkDocs.forEach(ldoc => {
          let ldata = ldoc.data();
          video.Links.push({
            Id: ldata.Id,
            Href: ldata.Href,
            Brand: ldata.Brand,
            Description: ldata.Description,
            Category: ldata.Category,
            PublishedAt: ldata.PublishedAt,
            Tags: ldata.Tags,
            LastUpdated: ldata.LastUpdated,
          });
        });
      })
    );

    // sort by publish date
    filtered.sort((a, b) => b.PublishedAt.localeCompare(a.PublishedAt));

    r.SetDefaultOk();
    r.RawMessage = filtered;
    r.Message = filtered;
  } catch (error: any) {
    r.Ok && r.SetDefaultError();
    r.Message = error.Message || error.message || ErrUnknown;
    r.RawMessage = error.cause || error.RawMessage || `In ${getVideos.name}`;
  }

  return r.Serialize();
}
