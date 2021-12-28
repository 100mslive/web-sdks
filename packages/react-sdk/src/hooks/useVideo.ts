import { selectTrackByID, HMSPeerID } from '@100mslive/hms-video-store';
import { useCallback, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useHMSActions, useHMSStore } from './HmsRoomProvider';

export const useVideo = (trackId: HMSPeerID) => {
  const actions = useHMSActions();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { ref: inViewRef, inView } = useInView({ threshold: 0.5 });
  const setRefs = useCallback(
    node => {
      videoRef.current = node;
      inViewRef(node);
    },
    [inViewRef],
  );
  const hmsStoreVideoTrack = useHMSStore(selectTrackByID(trackId));
  useEffect(() => {
    (async () => {
      if (videoRef.current && hmsStoreVideoTrack) {
        if (inView) {
          if (hmsStoreVideoTrack.enabled) {
            console.log('****** ENABLE VIDEO *******');
            // attach when in view and enabled
            await actions.attachVideo(hmsStoreVideoTrack.id, videoRef.current);
          } else {
            console.log('****** DETACH VIDEO *******');
            // detach when in view but not enabled
            await actions.detachVideo(hmsStoreVideoTrack.id, videoRef.current);
          }
        } else {
          // detach when not in view
          console.log('****** DETACH VIDEO *******');
          await actions.detachVideo(hmsStoreVideoTrack.id, videoRef.current);
        }
      }
    })();
  }, [
    inView,
    videoRef,
    hmsStoreVideoTrack?.id,
    hmsStoreVideoTrack?.enabled,
    hmsStoreVideoTrack?.deviceID,
    hmsStoreVideoTrack?.plugins,
  ]);
  return setRefs;
};
