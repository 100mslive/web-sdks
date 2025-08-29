import { HMSPrebuilt, Diagnostics } from '@100mslive/roomkit-react';
import { getRoomCodeFromUrl } from './utils';

export default function App() {
  const roomCode = getRoomCodeFromUrl();
  const isDiagnostics = location.pathname.startsWith('/diagnostics');

  if (isDiagnostics) {
    return <Diagnostics />;
  }

  return (
    <div className="example-prebuilt-container">
      <HMSPrebuilt roomCode={roomCode} containerSelector=".example-prebuilt-container" />;
    </div>
  );
}
