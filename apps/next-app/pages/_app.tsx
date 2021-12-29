import '../styles/global.css';
import React from 'react';
import { HMSRoomProvider } from '@100mslive/react-sdk';

function MyApp({ Component, pageProps }) {
  return (
    <HMSRoomProvider>
      <Component {...pageProps} />
    </HMSRoomProvider>
  );
}

export default MyApp;
