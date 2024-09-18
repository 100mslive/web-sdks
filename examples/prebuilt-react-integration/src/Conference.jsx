import { selectPeers, useHMSStore } from "@100mslive/react-sdk";
import Peer from "./Peer";

const Conference = () => {
  const peers = useHMSStore(selectPeers);
  return (
    <div className="conference-section">
      <h2>Conference</h2>
      <div className="peers-container">
        {peers.map((peer) => (
          <Peer key={peer.id} peer={peer}></Peer>
        ))}
      </div>
    </div>
  );
};
export default Conference;