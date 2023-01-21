import Link from 'next/link';

import SEOHeader from '../../components/seo/header';

export async function getStaticProps() {
  return {
    props: {
      metadata: {
        title: "About",
        description:
          "YoutubeBacklinks was created to make searching the description box text in youtube videos easy.",
      },
    },
  };
}

export default function Index(props: {metadata: any}) {
  return (
    <>
      <SEOHeader
        title={props.metadata.title}
        description={props.metadata.description}
      />
      <div className="pb-4 text-center">
        <h1 className="text-md sm:text-2xl font-black pb-8">
          {" "}
          YoutubeBacklinks catalogs video description box text for Youtube
          channels with a focus on making the links, products and discount codes
          found within them easily searchable.
        </h1>

        <div className="text-tiny sm:text-md">
          ** The site is still under development and acts more like a "proof of
          concept". If you have any suggestions on how the site could be more
          useful, I'd love to hear it! Please email sitesbystephanie@gmail.com.
          **
        </div>
      </div>

      <div className="md:px-20">
        <h2 className="text-center text-3xl font-black my-8">Backstory</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h2 className="font-black mb-4">The Short</h2>
            I'm Steph! I'm a programmer, dog mom and wine enthusiast.
            <img
              className="w-80 my-4"
              src="/static/profile.jpg"
              alt="Programmer with her dog at a winery."
            />
          </div>
          <div>
            <h2 className="font-black mb-4">The Long</h2>
            I created YoutubeBacklinks to fix a problem that I experienced
            personally. As someone who watches a lot of lifestyle, DIY and tech
            videos on Youtube, I'm often left aimlessly searching for product
            links or discount codes days or weeks after watching a video because
            the native Youtube search engine doesn't parse through description
            box text.
            <br />
            <br />
            The search engine behind YoutubeBacklinks prioritizes description
            box text, and it also displays description boxes for multiple videos
            in one screen so it makes it easier to sift through and find what
            you're looking for. <br /> <br />I hope this site can be as useful
            to you as it is to me! Feel free to add a new channel by filling out{" "}
            <Link href="/channels/new">
              <a className="text-theme-yt-red">this form</a>
            </Link>
            .
          </div>

          <div>
            <h2 className="font-black mb-4">The Technical</h2>
            How I created YoutubeBacklinks:
            <ul className="list-disc list-outside pl-4 pt-4 space-y-4 ">
              <li>
                Wrote an ETL pipeline in GoLang that extracts data from the
                Youtube API and loads it into a database. The ETL runs weekly as
                a cronjob to update the database with new videos and links.
              </li>
              <li>
                The backend is a RESTful service written in Golang. On startup,
                the service loads the database into Typesense, the search
                engine. Afterwards, the server is ready to accept requests from
                the client.
              </li>
              <li>
                The frontend is a NextJS React app written in Typescript with
                TailwindCSS for styling.
              </li>
              <li>The site is deployed to Google Kubernetes Engine.</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
