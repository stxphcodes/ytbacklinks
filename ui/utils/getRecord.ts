import fs from 'fs';

const  DATA_DIR = "../../data/"
const CHANNEL_ID = 'UCgWfS_47YPVbKx5EK4FLm4A';

const DATA_FILE = "utils/data.json"



export type ChannelRecord = {
    ChannelUsername: string;
    ChannelId: string;
    LastUpdated: string;
    Links: Link[];
}

export type Link = {
    Href: string;
    Brand: string;
    Description: string;
    Category: string;
    Tags: string[];
    PublishedAt: string;
    VideoId: string;
    VideoTitle: string;
}



export function getRecord(): ChannelRecord{
    let file = fs.readFileSync(DATA_FILE).toString('utf8');
    let record: ChannelRecord = JSON.parse(file);

    return record
  }