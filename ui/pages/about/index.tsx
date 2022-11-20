import Link from 'next/link';

export default function Index() {
  return (
    <>
      <div className="pb-4 text-center">
        <h1 className="text-md sm:text-2xl font-black pb-8">
          {" "}
          YoutubeBacklinks catalogs video description box text for Youtube channels with a focus on making the links, products and discount codes found within them easily searchable.
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
            As someone who grew up following aesthetic youtube vloggers and
            wanting to curate a life like theirs, I was stoked to move to a
            brand new apartment earlier this year with my partner and pup. I
            watched a lot of youtube vidoes to get inspiration on how to fill
            the new space, everything ranging from house decor and furniture to
            tech recommendations and culinary essentials.
            <br />
            <br />
            The youtubers I watch often review or mention products in their
            videos, and will link the product (usually with a discount code or
            affiliate link) in the description box. However, finding the link
            when I needed it days or weeks later was always an arduous process.
            I would have to sift through multiple videos in my history before
            getting the right one since the native Youtube search box doesn't
            search through all of the description box text.
            <br />
            <br /> That's the main reason I created this web app. The search
            engine behind YoutubeBacklinks prioritizes description box text, and
            it also displays description boxes for multiple videos in one screen
            so it makes it easier to sift through and find what you're looking
            for. <br /> <br />I hope this site can be as useful to you as it is
            to me! Feel free to add a new channel by filling out{" "}
            <Link href="/channels/new">
              <a className="text-theme-yt-red">this form</a>
            </Link>
            .
          </div>

          <div>
            <h2 className="font-black mb-4">The Technical</h2>
            If you're here because I mentioned this in my resume or a job
            application, the tech stack that I used to create the site:
            <ul className="list-disc list-outside pl-4 pt-4 space-y-4 ">
              <li>
                Wrote an ETL pipeline in GoLang that extracts data from the
                Youtube API and loads it into Firestore, a document-oriented
                database
              </li>
              <li>
                The backend is a RESTful service written in Golang that creates
                and loads data to a Typesense search engine to send queries to
              </li>
              <li>
                The frontend is a NextJS React app written in Typescript with
                TailwindCSS for styling
              </li>
              <li>
                The site is deployed to Google Kubernetes Eninge using kustomize
                files
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
