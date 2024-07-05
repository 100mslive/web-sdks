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
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MjAxNzcyODIsInBlZXJfaWQiOiJiYzgzZDA0Mi1lMWFiLTQyYTktYjE0NS05NTE0ZDI0MWU5YjMiLCJ1c2VyX2lkIjoiZTMzYWQ0NjEtZGY5YS00M2U2LWFmMjktMTUzZjgyMmRkNDExIiwidXNlcl9uYW1lIjoiZXN3YXIxMTEiLCJ1c2VyX3JvbGUiOiJicm9hZGNhc3RlciIsImJvYXJkX2lkIjoiNjY4NjgwMGU2ZTdkMTMzNGFjNGY1ZWQ2IiwibmFtZXNwYWNlIjoiNjVhOGU5ZGE5ODczNDk0MDEyY2UzNTQ0LTY2ODY3ZmM1MDAzMGRlOTJmYTZlZjgwMyIsInBlcm1pc3Npb25zIjpbInJlYWQiLCJ3cml0ZSIsImFkbWluIl19.NpuCfH1k0TKcUC7ch0k4PpnXNN7QytM8ipvOX16Vnfw'
        }
      />
    );
  }

  return <HMSPrebuilt roomCode={roomCode} />;
}
