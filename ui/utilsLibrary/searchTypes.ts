export type SearchRequest = {
    channelId: string;
    term: string;
};

export type SearchChannelResponse = {
    HitCount: number;
    Term: string;
    VideoIds: string[];
    LinkHits: any; // map-like type: [string, string[]]
    VideoTitleHits: any; // map-like type: [string, string[]]
}