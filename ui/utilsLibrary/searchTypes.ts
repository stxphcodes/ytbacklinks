import { Channel } from './firestoreTypes';

export type SearchRequest = {
    channelId?: string;
    term: string;
};

export type LinkSearchResponse = {
    HitCount: number;
    Term: string;
    VideoIds: string[];
    LinkHits: any; // map-like type: [string, string[]]
    VideoTitleHits: any; // map-like type: [string, struct{}]
}

export type VideoSearchResponse = {
    HitCount: number;
    Term: string;
    VideoIds: string[];
    VideoTitleHits: any; //map-like type: [string, struct{}]
    VideoDescriptionHits: any; //map-like type: [string, struct{}]
}

export type CombinedSearchResponse = {
    LinkSearchResponse: LinkSearchResponse;
    VideoSearchResponse: VideoSearchResponse;
}

export type Channels = {
    Count: number;
    Channels: Channel[];
}

export type ChannelSearchResponse = {
    HitCount: number;
    TypesenseCount: number;
    Term: string;
    ChannelIds: string[];
    LinkHitCount: any;  //map-like type: [channelid: string -> link hit count: number]
}
