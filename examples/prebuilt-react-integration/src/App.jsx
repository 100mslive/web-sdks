import { HMSPrebuilt } from '@100mslive/roomkit-react';
import { getRoomCodeFromUrl } from './utils';

export default function App() {
  const roomCode = getRoomCodeFromUrl();

  return <HMSPrebuilt roomCode={roomCode} />;
}
