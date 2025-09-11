// import { HMSPrebuilt, Diagnostics } from '@100mslive/roomkit-react';
import { useEffect, useRef } from 'react';
// import { getRoomCodeFromUrl } from './utils';

export default function App() {
  // const roomCode = getRoomCodeFromUrl();
  // const isDiagnostics = location.pathname.startsWith('/diagnostics');
  const prebuiltRef = useRef();

  useEffect(() => {
    if (prebuiltRef.current) {
      // you can access the prebuilt instance methods here
      console.log('HMSPrebuilt instance:', prebuiltRef.current);
      const { hmsActions } = prebuiltRef.current;
      hmsActions.enableBeamSpeakerLabelsLogging();
    }
  }, []);

  // if (isDiagnostics) {
  //   return <Diagnostics />;
  // }

  return (
    <iframe
      title="<title>"
      allow="camera *;microphone *;display-capture *"
      id="100ms-iframe"
      src="https://dashboard-app-git-update-example-with-ref-100mslive.vercel.app/thirsty-malachite-quail"
      style={{ border: 'none', width: '640px', height: '100vh' }}
    ></iframe>
  );
}
