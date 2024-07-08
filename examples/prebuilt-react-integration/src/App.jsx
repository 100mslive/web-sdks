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
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MjA1MTcwMDQsInBlZXJfaWQiOiJjNTUzYTczZC1jMGJjLTQxMjctOWQ3Ny1lODZhYTE2MmNmYWIiLCJ1c2VyX2lkIjoiNjRlMThiN2QtMjQxNS00MjQ0LWFkY2ItMTM4Yzc5OGQ5ZjUyIiwidXNlcl9uYW1lIjoiY2xpbnRvbiIsInVzZXJfcm9sZSI6ImJyb2FkY2FzdGVyIiwiYm9hcmRfaWQiOiI2NjhiYjAwYzZlN2QxMzM0YWM0ZjVmNjUiLCJuYW1lc3BhY2UiOiI2NWE4ZTlkYTk4NzM0OTQwMTJjZTM1NDQtNjY4YmIwMDI2MmJhODZjOTFlNjNiMGIzIiwicGVybWlzc2lvbnMiOlsicmVhZCIsIndyaXRlIiwiYWRtaW4iXX0.ENtJbc-ObMjZo2Hviaw4N27LoZbfQtPLsB9i9TV4nAs'
        }
      />
    );
  }

  return <HMSPrebuilt roomCode={roomCode} />;
}
