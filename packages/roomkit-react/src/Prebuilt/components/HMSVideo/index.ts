// @ts-ignore
import { LeftControls, RightControls, VideoControls } from './Controls';
// @ts-ignore
import { HMSVideo } from './HMSVideo';
import { PlayButton } from './PlayButton';
import { VideoProgress } from './VideoProgress';
import { VideoTime } from './VideoTime';
import { VolumeControl } from './VolumeControl';

export const HMSVideoPlayer = {
  Root: HMSVideo,
  PlayButton: PlayButton,
  Progress: VideoProgress,
  Duration: VideoTime,
  Volume: VolumeControl,
  Controls: {
    Root: VideoControls,
    Left: LeftControls,
    Right: RightControls,
  },
};
