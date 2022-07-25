import { IconButton, Tooltip } from "@100mslive/react-ui";
import { PauseIcon, PlayIcon } from "@100mslive/react-icons";

export const PlayButton = ({ videoRef }) => {
  return videoRef.current ? (
    <>
      <Tooltip title={`${videoRef.current.paused ? "Play" : "Pause"}`}>
        <IconButton
          onClick={() => {
            videoRef.current.paused
              ? videoRef.current.play()
              : videoRef.current.pause();
          }}
          data-testid="play_pause_btn"
        >
          {videoRef.current.paused ? (
            <PlayIcon width={32} height={32} />
          ) : (
            <PauseIcon width={32} height={32} />
          )}
        </IconButton>
      </Tooltip>
    </>
  ) : null;
};
