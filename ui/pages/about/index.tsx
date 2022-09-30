export default function Index() {
  return (
    <div className="p-12">
      <div className="px-12 pb-4 text-center">
        <h1 className="text-2xl font-black pb-8">
          {" "}
          Youtube Backlinks is an archive of youtube video description boxes
          with a focus on making the links/products found within them easily
          searchable.
        </h1>

        <div className="text-md">
          ** The site is still under development and acts more like a "proof of
          concept". If you'd like to add other channels, please email me at
          sitesbystephanie@gmail.com. I'm also considering doing something similar with other platforms like Instagram. If you have thoughts about this or any other suggestions to improve this site, I'd love to hear from you! **
        </div>
      </div>

      <div>
        <h2 className="text-center text-3xl font-black my-8">Backstory</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h2 className="font-black mb-4">The Short</h2>
            I'm Steph! I'm a programmer, dog mom and wine enthusiast.
            <img className="w-80 my-4" src="/static/profile.jpg"></img>
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
            videos, and will link the product (often with a discount code or
            affiliate link) in the description box. However, finding the link
            when I needed it hours or days later was always an arduous
            process. I would have to sift through multiple videos in my history
            before getting the right one since the youtube search box doesn't
            search through description box text.
            <br />
            <br /> So I created this site as a way to easily and quickly search
            for terms that appear in description boxes of some of my favorite
            youtubers. It's been pretty useful to me so far, I hope you find it
            useful too!
          </div>

          <div>
            <h2 className="font-black mb-4">The Technical</h2>
            If you're here because I mentioned this in my resume or a job
            application, here's the tech stack I used to create the site:
            <ul className="list-disc list-outside pl-4 pt-4 space-y-4 ">
              <li>
                Wrote an ETL pipeline in GoLang that extracts data from the
                Youtube API and loads it into a Firestore, GraphQL database
              </li>
              <li>
                Backend is a RESTful service written in Golang that creates a
                Typesense search engine to send queries to
              </li>
              <li>
                Frontend is a NextJS React app written in Typescript with
                TailwindCSS for styling{" "}
              </li>
              <li>
                The site is deployed to Google Kubernetes Eninge using kustomize
                files
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
