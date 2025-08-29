import { Diagnostics } from '@100mslive/roomkit-react';

export default function App() {
  const isDiagnostics = location.pathname.startsWith('/diagnostics');

  if (isDiagnostics) {
    return <Diagnostics />;
  }

  return (
    <iframe
      title="100ms-app"
      allow="camera *;microphone *;display-capture *"
      src="https://ravitheja.app.100ms.live/preview/thirsty-malachite-quail"
      style={{ height: '100vh', width: '640px', border: 0 }}
    ></iframe>
  );
}
