import { HMSPrebuilt, Diagnostics } from '@100mslive/roomkit-react';
import { Whiteboard } from '@100mslive/hms-whiteboard';
import { getRoomCodeFromUrl } from './utils';

export default function App() {
  const roomCode = getRoomCodeFromUrl();
  const isDiagnostics = location.pathname.startsWith('/diagnostics');
  const isWhiteboard = location.pathname.startsWith('/whiteboard');

  if (isDiagnostics) {
    return <Diagnostics />;
  }

  if (isWhiteboard) {
    return (
      <Whiteboard
        token={
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MjA2MDYwOTEsInBlZXJfaWQiOiIyMDkzMDEzNy0zNGRlLTQwMTEtODZiOC1jM2YwYzExOWM0MWQiLCJ1c2VyX2lkIjoiMDdhZDliNWUtZTJkYS00NmVhLTliZGQtOWQxY2U3ZWNmODY4IiwidXNlcl9uYW1lIjoiY2xpbnRvbiIsInVzZXJfcm9sZSI6ImJyb2FkY2FzdGVyIiwiYm9hcmRfaWQiOiI2NjhkMGMwYjZlN2QxMzM0YWM0ZjVmOTMiLCJuYW1lc3BhY2UiOiI2NWE4ZTlkYTk4NzM0OTQwMTJjZTM1NDQtNjY4ZDBhYzQ5MmEwMDljOWUyNTRkMGY4IiwicGVybWlzc2lvbnMiOlsicmVhZCIsIndyaXRlIiwiYWRtaW4iXX0._UjnbjvsTaDC3qEqmxQRIlA5m3f2R-otTSjipTCM1gs'
        }
      />
    );
  }

  return <HMSPrebuilt roomCode={roomCode} />;
}
