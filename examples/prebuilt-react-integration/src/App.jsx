import { HMSPrebuilt, Diagnostics } from '@100mslive/roomkit-react';
import { useEffect } from 'react';
import { getRoomCodeFromUrl } from './utils';

export default function App() {
  const roomCode = getRoomCodeFromUrl();
  const isDiagnostics = location.pathname.startsWith('/diagnostics');

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('Service Worker registered!', reg))
        .catch(err => console.log('Service Worker registration failed', err));
    }
    
  }, []);

  if (isDiagnostics) {
    return <Diagnostics />;
  }

  return <HMSPrebuilt roomCode={roomCode} />;
}
