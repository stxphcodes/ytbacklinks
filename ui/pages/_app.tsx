import '../styles/base.css';

import Script from 'next/script';

import Banner from '../components/banner';
import Footer from '../components/footer';
import Navbar from '../components/navbar';

import type {AppProps} from "next/app";

function MyApp({Component, pageProps}: AppProps) {
  return (
    <>
    {/* https://nextjs.org/docs/messages/next-script-for-ga */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}`}
        strategy="afterInteractive"
      ></Script>
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
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
