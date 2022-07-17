import { PauseIcon, PlayIcon } from "@100mslive/react-icons";
import { Flex, IconButton, Text, Tooltip } from "@100mslive/react-ui";

export const PlaybackAndTimeControls = ({ videoEl }) => {
  if (!videoEl) {
    return;
  }
  let time = Math.floor(videoEl.currentTime);
  const hours = Math.floor(time / 3600);
  time = time - hours * 3600;
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time - minutes * 60);

  let videoTime = `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  if (hours) {
    videoTime = `${hours}:${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  }

  return (
    <Flex justify="start" align="center" gap={2}>
      <Tooltip title={`${videoEl.paused ? "Play" : "Pause"}`}>
        <IconButton
          onClick={() => {
            videoEl.paused ? videoEl.play() : videoEl.pause();
          }}
          data-testid="playlist_play_pause_btn"
        >
          {videoEl.paused ? (
            <PlayIcon width={32} height={32} />
          ) : (
            <PauseIcon width={32} height={32} />
          )}
        </IconButton>
      </Tooltip>
      <Text>{`${videoTime}`}</Text>
    </Flex>
  );
};
