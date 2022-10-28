import '../styles/base.css';

import Head from 'next/head';

import Banner from '../components/banner';
import Footer from '../components/footer';
import Navbar from '../components/navbar';

import type { AppProps } from "next/app";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        {/* <!-- Google tag (gtag.js) --> */}
        {/* https://mariestarck.com/add-google-analytics-to-your-next-js-application-in-5-easy-steps/ */}
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}`}
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}', {
            page_path: window.location.pathname,
          });
          `,
          }}
        />
        <title>Youtube Backlinks</title>
        <link rel="icon" type="image/x-icon" href="/static/favicon.png"></link>
      </Head>

      <Navbar />
      <Banner bgcolor="theme-yt-red" textcolor="white" icon={true}>
        This website is still in beta phase and may have bugs. If you experience
        errors or have suggestions for improvement please email
        sitesbystephanie@gmail.com.
      </Banner>
      <div className="p-8 sm:p-12 bg-theme-beige max-w-screen-xl m-auto">
        <Component {...pageProps} />
      </div>
      <Footer />
    </>
  );
}

export default MyApp;
