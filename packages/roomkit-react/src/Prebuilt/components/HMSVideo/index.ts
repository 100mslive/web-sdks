// @ts-ignore
import { LeftControls, RightControls, VideoControls } from './Controls';
// @ts-ignore
import { HMSVideo } from './HMSVideo';
import { PlayPauseSeekControls, PlayPauseSeekOverlayControls } from './PlayPauseSeekControls';
import { VideoProgress } from './VideoProgress';
import { VideoTime } from './VideoTime';
import { VolumeControl } from './VolumeControl';

export const HMSVideoPlayer = {
  Root: HMSVideo,
  Progress: VideoProgress,
  Duration: VideoTime,
  Volume: VolumeControl,
  Controls: {
    Root: VideoControls,
    Left: LeftControls,
    Right: RightControls,
  },
  PlayPauseSeekControls: {
    Overlay: PlayPauseSeekOverlayControls,
    Button: PlayPauseSeekControls,
  },
};
