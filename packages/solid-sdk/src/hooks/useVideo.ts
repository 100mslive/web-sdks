import { selectTrackByID, HMSTrackID } from '@100mslive/hms-video-store';
import { createEffect, onCleanup } from 'solid-js';
import { useInView } from '../ports/solid-intersection-observer';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';
import HMSLogger from '../utils/logger';

export interface useVideoInput {
  /**
   * TrackId that is to be rendered
   */
  trackId?: HMSTrackID;
  /**
   * Boolean stating whether to override the internal behaviour.
   * when attach is false, even if tile is inView or enabled, it won't be rendered
   */
  attach?: boolean;
}

export interface useVideoOutput {
  videoRef: React.RefCallback<HTMLVideoElement>;
}
/**
 * This hooks can be used to implement a video tile component. Given a track id it will return a ref.
 * The returned ref can be used to set on a video element meant to display the video.
 * The hook will take care of attaching and detaching video, and will automatically detach when the video
 * goes out of view to save on bandwidth.
 */
export const useVideo = (props: useVideoInput): useVideoOutput => {
  const actions = useHMSActions();
  let videoRef: HTMLVideoElement;
  const track = useHMSStore(selectTrackByID(props.trackId));
  const { ref: inViewRef, inView } = useInView({ threshold: 0.5 });

  const setRefs = (node: HTMLVideoElement) => {
    videoRef = node;
    inViewRef(node);
  };

  createEffect(() => {
    (async () => {
      if (videoRef && track?.id) {
        if (inView && track.enabled && props.attach !== false) {
          // attach when in view and enabled
          await actions.attachVideo(track.id, videoRef);
        } else {
          // detach when not in view
          await actions.detachVideo(track.id, videoRef);
        }
      }
    })();
  });

  // detach on unmount
  createEffect(() => {
    onCleanup(() => {
      (async () => {
        if (videoRef && track) {
          try {
            // detach on unmount
            await actions.detachVideo(track.id, videoRef);
          } catch (err) {
            HMSLogger.w('detach video error for track', track.id, err);
          }
        }
      })();
    });
  });

  return { videoRef: setRefs };
};
