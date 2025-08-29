import { HMSPrebuilt, Diagnostics } from '@100mslive/roomkit-react';
import { getRoomCodeFromUrl } from './utils';

export default function App() {
  const roomCode = getRoomCodeFromUrl();
  const isDiagnostics = location.pathname.startsWith('/diagnostics');
  
  // Check for mobile override from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const mobileParam = urlParams.get('mobile');
  const isMobile = mobileParam === 'true' ? true : mobileParam === 'false' ? false : undefined;

  if (isDiagnostics) {
    return <Diagnostics />;
  }

  return <HMSPrebuilt roomCode={roomCode} isMobile={isMobile} />;
}
