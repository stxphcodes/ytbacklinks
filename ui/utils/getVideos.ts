import { collection, Firestore, getDocs } from 'firebase/firestore';

import { VideoUI } from '../utilsLibrary/firestoreTypes';
import { ErrUnknown, ResponseWrapper, TResponseWrapper } from '../utilsLibrary/responseWrapper';

export async function getVideos(
  firestore: Firestore,
  channelId: string
): Promise<TResponseWrapper> {
  let r = new ResponseWrapper();

  try {
    let videos: VideoUI[] = [];
    const videoDocs = await getDocs(collection(firestore, channelId));

    videoDocs.forEach(vdoc => {
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
      videos.push(video);
    });

    await Promise.all(
      videos.map(async video => {
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

        // sort linsk alphabetically
        video.Links.sort()
        // then sort links by longest description to shortest description
        video.Links.sort((a, b) => b.Description.length - a.Description.length)
      })
    );

    // sort by publish date 
    videos.sort((a, b) => b.PublishedAt.localeCompare(a.PublishedAt));

    r.SetDefaultOk();
    r.RawMessage = videos;
    r.Message = videos;
  } catch (error: any) {
    r.Ok && r.SetDefaultError();
    r.Message = error.Message || error.message || ErrUnknown;
    r.RawMessage = error.cause || error.RawMessage || `In ${getVideos.name}`;
  }

  return r.Serialize();
}
