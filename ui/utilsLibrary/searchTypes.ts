export type SearchRequest = {
    channelId: string;
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

