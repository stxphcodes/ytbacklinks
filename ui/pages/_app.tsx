import '../styles/base.css';

import Banner from '../components/banner';
import Navbar from '../components/navbar';

import type {AppProps} from 'next/app';

function MyApp({Component, pageProps}: AppProps) {
  return (
    <>
      <Navbar />
      <Banner />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
