import { HMSPrebuilt } from '@100mslive/roomkit-react';
import { getRoomCodeFromUrl } from './utils';
import { Diagnostics } from './diagnostics';

export default function App() {
  const roomCode = getRoomCodeFromUrl();
  const isDiagnostics = location.pathname.includes('diagnostics');

  if (isDiagnostics) {
    return <Diagnostics />;
  }

  return (
    <HMSPrebuilt
      roomCode={roomCode}
      options={{
        endpoints: {
          tokenByRoomCode: 'https://auth-nonprod.100ms.live/v2/token',
          roomLayout: 'https://api-nonprod.100ms.live/v2/layouts/ui',
          init: 'https://qa-in2-ipv6.100ms.live/init',
        },
      }}
    />
  );
}
