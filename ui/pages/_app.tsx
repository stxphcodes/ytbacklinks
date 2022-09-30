import '../styles/base.css';

import Head from 'next/head';

import Banner from '../components/banner';
import Navbar from '../components/navbar';

import type { AppProps } from "next/app";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Youtube Backlinks</title>
        <link rel="icon" type="image/x-icon" href="/static/favicon.png"></link>
      </Head>
      <Navbar />
      <Banner />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
