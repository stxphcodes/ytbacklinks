export type Channel = {
  Id: string;
  Title: string;
  Description: string;
  Categories: string[];
  CustomUrl: string;
  UploadPlaylistId: string;
  ThumbnailUrl: string;
  LastUpdated: string;
  LinkCount: number;
  VideoCount: number;
};

export type VideoUI = {
  Id: string;
  Title: string;
  ChannelId: string;
  Description: string;
  PublishedAt: string;
  ThumbnailUrl: string;
  LastUpdated: string;
  Links: Link[];
};

export type Link = {
  Id: string;
  Href: string;
  Brand: string;
  Description: string;
  Category: string;
  PublishedAt: string;
  Tags: string[];
  LastUpdated: string;
};

export type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
};
