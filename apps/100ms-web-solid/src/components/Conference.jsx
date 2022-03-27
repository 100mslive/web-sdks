// @ts-check
import { selectPeers, useHMSStore } from '@100mslive/solid-sdk';
import Peer from './Peer';
import DeviceSettings from './DeviceSettings';
import { For } from 'solid-js';

function Conference() {
  const peers = useHMSStore(selectPeers);

  return (
    <div className="conference-section">
      <h2>Conference</h2>
      <DeviceSettings />
      <div className="peers-container">
        <For each={peers()}>{peer => <Peer key={peer.id} peer={peer} />}</For>
      </div>
    </div>
  );
}

export default Conference;
