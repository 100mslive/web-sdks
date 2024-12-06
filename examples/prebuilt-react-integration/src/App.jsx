import { HMSPrebuilt, Diagnostics } from '@100mslive/roomkit-react';
import { getRoomCodeFromUrl } from './utils';
import { init } from 'zipyai';
import { useEffect } from 'react';

export default function App() {
  const roomCode = getRoomCodeFromUrl();
  const isDiagnostics = location.pathname.startsWith('/diagnostics');

  useEffect(() => {
    init('d3c5934b')
  }, []);

  if (isDiagnostics) {
    return <Diagnostics />;
  }

  return <HMSPrebuilt roomCode={roomCode} />;
}
