// @ts-check
import { selectPeers, useHMSStore } from '@100mslive/solid-sdk';
import Peer from './Peer';
import DeviceSettings from './DeviceSettings';

function Conference() {
  const peers = useHMSStore(selectPeers);

  return (
    <div className="conference-section">
      <h2>Conference</h2>
      <DeviceSettings />
      <div className="peers-container">
        {peers.map(peer => (
          <Peer key={peer.id} peer={peer} />
        ))}
      </div>
    </div>
  );
}

export default Conference;
