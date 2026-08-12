import { HMSPrebuilt, Diagnostics, EchoRepro } from '@100mslive/roomkit-react';
import { getRoomCodeFromUrl } from './utils';

export default function App() {
  const roomCode = getRoomCodeFromUrl();
  const isDiagnostics = location.pathname.startsWith('/diagnostics');
  const isEchoRepro = location.pathname.startsWith('/echo');

  if (isEchoRepro) {
    return <EchoRepro />;
  }

  if (isDiagnostics) {
    return <Diagnostics />;
  }

  return <HMSPrebuilt roomCode={roomCode} />;
}
