import { useState } from 'react';

import AffiliateLinkCheck from '../../components/affiliateLink';

export default function Index() {
  const [input, setInput] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);

  return (
    <div className="">
      <h1 className="text-4xl font-black">Affiliate Link Check</h1>

      <p className="my-4">
        An affiliate is an individual or company that has agreed
        to promote another company's product or service in exchange for
        commission. An affiliate link is a unique URL that typically contains
        the affiliate's username or ID to track the website traffic and/or sales
        sourced from the affiliate. In other words, affiliate links are how companies 
        
        
        are URLs that affiliates share to consumers
        to promote a product or service made by another retailer or marketing
        agency. track website traffic and/or sales
      </p>

      <div className="mb-6 flex">
        <label
          htmlFor="default-input"
          className="block mb-2 font-medium text-gray-900 dark:text-white mr-2"
        >
          Enter a URL:
        </label>
        <input
          type="text"
          id="affiliate-link-input"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          onChange={(e) => {
            setSubmitted(false);
            setInput(e.target.value);
          }}
          // onFocus={() => setSubmitted(false)}
          onKeyPress={(e) => {
            if (e.key.toLowerCase() === "enter") {
              setSubmitted(true);
            }
          }}
          value={input}
        />

        <button
          type="submit"
          className="bg-theme-yt-red font-medium hover:bg-theme-yt-red-2 ml-2 py-2 px-2 md:px-4 text-xs md:text-md rounded-lg text-white"
          onClick={() => setSubmitted(true)}
        >
          Submit
        </button>
      </div>
      {submitted && input.length > 0 && (
        <div className="">
          <AffiliateLinkCheck Href={input} />
        </div>
      )}
    </div>
  );
}
