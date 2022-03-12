const CHANNEL_TITLE = 'Jenn Im';
const CHANNEL_ID = 'UCgWfS_47YPVbKx5EK4FLm4A';
const CHANNEL_USERNAME = 'clothesencounters';

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

export async function getUploadPlaylistId(): Promise<string> {
  type ContentItem = {
    kind: string;
    id: string;
    contentDetails: {
      relatedPlaylists: {
        likes: string;
        uploads: string;
      }
    }
  };

  type Content = {
    kind: string;
    etag: string;
    items: ContentItem[];
  };

  let youtubeAPI = new URL(YOUTUBE_API_URL);
  youtubeAPI.pathname = `${youtubeAPI.pathname}/channels`;
  youtubeAPI.searchParams.append('part', 'contentDetails');
  youtubeAPI.searchParams.append('forUsername', CHANNEL_USERNAME);
  youtubeAPI.searchParams.append('key', process.env.YOUTUBE_API_KEY || '');

  let response = await fetch(youtubeAPI.toString());
  if (response.ok) {
    let c: Content = await response.json();

    return c.items[0].contentDetails.relatedPlaylists.uploads;
  }

  return '';
}

export async function getVideoDescriptions(playlistID: string): Promise<string[]> {
  type Snippet = {
    publishedAt: string;
    title: string;
    description: string;
    resourceId: {
      videoId: string;
    };
  };

  type Item = {
    kind: string;
    id: string;
    snippet: Snippet;
  }

  type ContentResponse = {
    kind: string;
    items: Item[];
  };

  let videoDescriptions: string[] = [];

  let youtubeAPI = new URL(YOUTUBE_API_URL);
  youtubeAPI.pathname = `${youtubeAPI.pathname}/playlistItems`;
  youtubeAPI.searchParams.append('part', 'snippet');
  youtubeAPI.searchParams.append('maxResults', '10');
  youtubeAPI.searchParams.append('playlistId', playlistID);
  youtubeAPI.searchParams.append('key', process.env.YOUTUBE_API_KEY || '');

  let response = await fetch(youtubeAPI.toString());
  if (response.ok) {
    let c: ContentResponse = await response.json();
    c.items.map(item => {
      videoDescriptions.push(item.snippet.description);
    });

    return videoDescriptions;
  }

  return videoDescriptions;
}