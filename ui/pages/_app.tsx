import '../styles/base.css';

import Navbar from '../components/navbar';

import type {AppProps} from 'next/app';

function MyApp({Component, pageProps}: AppProps) {
  return (
    <>
      <Navbar />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
