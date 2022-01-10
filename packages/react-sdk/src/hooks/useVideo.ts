import { selectTrackByID, HMSPeerID } from '@100mslive/hms-video-store';
import { useCallback, useEffect, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { useHMSActions, useHMSStore } from './HmsRoomProvider';

// TODO: add some types, we are returning node here causes issue in passing as ref
export const useVideo = (trackId: HMSPeerID) => {
  const actions = useHMSActions();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { ref: inViewRef, inView } = useInView({ threshold: 0.5 });
  // TODO: need some help here
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
            // TODO: add logging functions here
            // attach when in view and enabled
            await actions.attachVideo(hmsStoreVideoTrack.id, videoRef.current);
          } else {
            // TODO: add logging functions here
            // detach when in view but not enabled
            await actions.detachVideo(hmsStoreVideoTrack.id, videoRef.current);
          }
        } else {
          // TODO: add logging functions here
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
