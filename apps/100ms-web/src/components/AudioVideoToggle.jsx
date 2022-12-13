import React, { Fragment, useEffect, useRef } from "react";
import {
  DeviceType,
  parsedUserAgent,
  selectAudioTrackByID,
  selectLocalAudioTrackID,
  useAVToggle,
  useDevices,
  useHMSStore,
} from "@100mslive/react-sdk";
import {
  MicOffIcon,
  MicOnIcon,
  VideoOffIcon,
  VideoOnIcon,
} from "@100mslive/react-icons";
import { Tooltip } from "@100mslive/react-ui";
import IconButton from "../IconButton";

const isMacOS = parsedUserAgent.getOS().name.toLowerCase() === "mac os";

export const AudioVideoToggle = () => {
  const { isLocalVideoEnabled, isLocalAudioEnabled, toggleAudio, toggleVideo } =
    useAVToggle();
  const audioTrackId = useHMSStore(selectLocalAudioTrackID);
  const { updateDevice } = useDevices();
  const track = useHMSStore(selectAudioTrackByID(audioTrackId));
  const ref = useRef(null);

  useEffect(() => {
    const visibilityListener = () => {
      console.error(
        "audio visibility ",
        { deviceId: track?.deviceID },
        document.visibilityState,
        ref
      );
      if (document.visibilityState === "hidden") {
        ref.current = track?.deviceID;
      } else if (ref.current) {
        (async () => {
          /*  await updateDevice({
            deviceId: "default",
            deviceType: DeviceType.audioInput,
          });
          console.log("device set to default"); */
          await updateDevice({
            deviceId: ref.current,
            deviceType: DeviceType.audioInput,
          });
          console.log("device set to prev selection");
        })();
      }
    };
    const isIOS = parsedUserAgent.getOS().name.toLowerCase() === "ios";
    console.log(
      "is IOS ",
      isIOS,
      parsedUserAgent.getOS(),
      "deviceId:",
      track?.deviceID
    );

    if (!isIOS) {
      return;
    }
    document.addEventListener("visibilitychange", visibilityListener);
    return () => {
      document.removeEventListener("visibilitychange", visibilityListener);
    };
  }, [track?.deviceID, updateDevice]);
  return (
    <Fragment>
      {toggleAudio ? (
        <Tooltip
          title={`Turn ${isLocalAudioEnabled ? "off" : "on"} audio (${
            isMacOS ? "⌘" : "ctrl"
          } + d)`}
        >
          <IconButton
            active={isLocalAudioEnabled}
            onClick={toggleAudio}
            key="toggleAudio"
            data-testid="audio_btn"
          >
            {!isLocalAudioEnabled ? (
              <MicOffIcon data-testid="audio_off_btn" />
            ) : (
              <MicOnIcon data-testid="audio_on_btn" />
            )}
          </IconButton>
        </Tooltip>
      ) : null}
      {toggleVideo ? (
        <Tooltip
          title={`Turn ${isLocalVideoEnabled ? "off" : "on"} video (${
            isMacOS ? "⌘" : "ctrl"
          } + e)`}
        >
          <IconButton
            key="toggleVideo"
            active={isLocalVideoEnabled}
            onClick={toggleVideo}
            data-testid="video_btn"
          >
            {!isLocalVideoEnabled ? (
              <VideoOffIcon data-testid="video_off_btn" />
            ) : (
              <VideoOnIcon data-testid="video_on_btn" />
            )}
          </IconButton>
        </Tooltip>
      ) : null}
    </Fragment>
  );
};
