export type SearchRequest = {
    channelId: string;
    term: string;
};

export type SearchChannelResponse = {
    HitCount: number;
    Term: string;
    VideoIds: string[];
    LinkHits: Map<string, string[]>;
    VideoTitleHits: Map<string, string[]>;
}