// @ts-ignore
import { LeftControls, RightControls, VideoControls } from './Controls';
// @ts-ignore
import { HMSVideo } from './HMSVideo';
import { PlayPauseButton } from './PlayPauseButton';
import { SeekControls } from './SeekControls';
import { VideoProgress } from './VideoProgress';
import { VideoTime } from './VideoTime';
import { VolumeControl } from './VolumeControl';

export const HMSVideoPlayer = {
  Root: HMSVideo,
  PlayPauseButton: PlayPauseButton,
  Progress: VideoProgress,
  Duration: VideoTime,
  Volume: VolumeControl,
  Controls: {
    Root: VideoControls,
    Left: LeftControls,
    Right: RightControls,
  },
  Seeker: SeekControls,
};
