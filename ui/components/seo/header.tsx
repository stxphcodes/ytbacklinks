import Head from 'next/head';

export type Metadata = {
  name: string;
  content: string;
};

export default function SEOHeader(props: {
  title?: string;
  description?: string;
  otherMetadata?: Metadata[];
}) {
  return (
    <Head>
      <title>{props.title ? props.title : "Youtube Backlinks"}</title>
      <meta
        name="description"
        content={
          props.description
            ? props.description
            : "View and search for product links and discount codes from popular youtubers"
        }
      />
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      {props.otherMetadata &&
        props.otherMetadata.map((metadata) => (
          <meta name={metadata.name} content={metadata.content} />
        ))}
      <link rel="icon" type="image/x-icon" href="/static/favicon.png"></link>
    </Head>
  );
}
