import { useState } from 'react';
import { HMSPrebuilt, Diagnostics } from '@100mslive/roomkit-react';
import { getRoomCodeFromUrl } from './utils';

export default function App() {
  const roomCode = getRoomCodeFromUrl();
  const isDiagnostics = location.pathname.startsWith('/diagnostics');
  const [forceMobile, setForceMobile] = useState(null);

  if (isDiagnostics) {
    return <Diagnostics />;
  }

  // Check URL params for mobile override
  const urlParams = new URLSearchParams(window.location.search);
  const mobileParam = urlParams.get('mobile');
  const isMobileOverride = mobileParam === 'true' ? true : mobileParam === 'false' ? false : forceMobile;

  return (
    <div style={{ height: '100vh', position: 'relative' }}>
      {/* Toggle button for testing */}
      <div style={{ 
        position: 'absolute', 
        top: 10, 
        right: 10, 
        zIndex: 1000,
        background: 'white',
        padding: '8px 12px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={isMobileOverride === true}
            onChange={(e) => setForceMobile(e.target.checked ? true : null)}
          />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Force Mobile View</span>
        </label>
        <div style={{ fontSize: '12px', marginTop: '4px', color: '#666' }}>
          Current: {isMobileOverride === true ? 'Mobile' : isMobileOverride === false ? 'Desktop' : 'Auto-detect'}
        </div>
      </div>
      
      <HMSPrebuilt 
        roomCode={roomCode} 
        isMobile={isMobileOverride}
      />
    </div>
  );
}
