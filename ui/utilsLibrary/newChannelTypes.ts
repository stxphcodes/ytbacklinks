export type NewChannelRequest = {
    channelName: string;
    channelCategories: string[];
    email ?: string;
};

export type NewChannelResponse = {
    channelAdded: boolean;
}