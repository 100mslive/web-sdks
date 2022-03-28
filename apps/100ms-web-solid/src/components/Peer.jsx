// @ts-check
import { useVideo } from '@100mslive/solid-sdk';

function Peer(props) {
  const { videoRef } = useVideo({
    trackId: props.peer.videoTrack,
  });
  return (
    <div className="peer-container">
      <video ref={videoRef} className={`peer-video ${props.peer.isLocal ? 'local' : ''}`} autoPlay muted playsInline />
      <div className="peer-name">
        {props.peer.name} {props.peer.isLocal ? '(You)' : ''}
      </div>
    </div>
  );
}

export default Peer;
