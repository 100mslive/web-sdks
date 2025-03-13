/* eslint-disable react/prop-types */
import { HMSPrebuilt, Diagnostics, Button } from '@100mslive/roomkit-react';
import { useState } from 'react';
import { getRoomCodeFromUrl } from './utils';

const Permission = function ({ next, type }) {
  const requestPermission = async () => {
    const stream = await navigator.mediaDevices.getUserMedia(type === 'cam' ? { video: true } : { audio: true });
    stream.getTracks().forEach(track => track.stop());
    next();
  };

  return <Button onClick={requestPermission}>Request {type} Permission</Button>;
};

export default function App() {
  const roomCode = getRoomCodeFromUrl();
  const isDiagnostics = location.pathname.startsWith('/diagnostics');
  const [state, setState] = useState('cam');

  if (isDiagnostics) {
    return <Diagnostics />;
  }

  if (state === 'cam') {
    return <Permission next={() => setState('mic')} type={state} />;
  } else if (state === 'mic') {
    return <Permission next={() => setState('')} type={state} />;
  }
  return <HMSPrebuilt roomCode={roomCode} screens={{ preview: null }} />;
}
