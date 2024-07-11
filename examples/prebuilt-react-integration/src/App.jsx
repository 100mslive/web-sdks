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
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MjA3ODA5MDcsInBlZXJfaWQiOiIyMjk5MGUwZi1mZjc2LTQxMzAtOTM0Mi0zZmRhNzFhYzk3YzciLCJ1c2VyX2lkIjoiNThkZDYyMmEtZDBjMC00YWJkLTg2N2EtOWFhYjM1YmViMzlmIiwidXNlcl9uYW1lIjoiY2xpbnRvbiIsInVzZXJfcm9sZSI6ImJyb2FkY2FzdGVyIiwiYm9hcmRfaWQiOiI2NjhmYjZlYjZlN2QxMzM0YWM0ZjYwMDEiLCJuYW1lc3BhY2UiOiI2NWE4ZTlkYTk4NzM0OTQwMTJjZTM1NDQtNjY4ZmI2ZTAwMDMwZGU5MmZhNmZmNWM5IiwicGVybWlzc2lvbnMiOlsicmVhZCIsIndyaXRlIiwiYWRtaW4iXX0.2mP-Hwt_uFJUti7QPgGSywtWEu3m5A1hvXbBGlXuDRg'
        }
      />
    );
  }

  return <HMSPrebuilt roomCode={roomCode} />;
}
