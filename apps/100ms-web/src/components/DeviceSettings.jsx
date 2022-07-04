import React, { useRef, useState, useEffect, Fragment } from "react";
import { useDevices, DeviceType } from "@100mslive/react-sdk";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MicOnIcon,
  SpeakerIcon,
  VideoOnIcon,
} from "@100mslive/react-icons";
import {
  Button,
  Text,
  Flex,
  Dropdown,
  Box,
  textEllipsis,
} from "@100mslive/react-ui";

/**
 * wrap the button on click of whom settings should open, this component will take care of the rest,
 * it'll give the user options to change input/output device as well as check speaker.
 * There is also another controlled way of using this by passing in open and onOpenChange.
 */
const Settings = () => {
  const { allDevices, selectedDeviceIDs, updateDevice } = useDevices();
  const { videoInput, audioInput, audioOutput } = allDevices;
  return (
    <Fragment>
      <Text variant="h5" css={{ mb: "$12" }}>
        Device Settings
      </Text>
      {videoInput?.length ? (
        <DeviceSelector
          title="Video"
          devices={videoInput}
          icon={<VideoOnIcon />}
          selection={selectedDeviceIDs.videoInput}
          onChange={deviceId =>
            updateDevice({
              deviceId,
              deviceType: DeviceType.videoInput,
            })
          }
        />
      ) : null}
      {audioInput?.length ? (
        <DeviceSelector
          title="Microphone"
          icon={<MicOnIcon />}
          devices={audioInput}
          selection={selectedDeviceIDs.audioInput}
          onChange={deviceId =>
            updateDevice({
              deviceId,
              deviceType: DeviceType.audioInput,
            })
          }
        />
      ) : null}
      {audioOutput?.length ? (
        <DeviceSelector
          title="Speaker"
          icon={<SpeakerIcon />}
          devices={audioOutput}
          selection={selectedDeviceIDs.audioOutput}
          onChange={deviceId =>
            updateDevice({
              deviceId,
              deviceType: DeviceType.audioOutput,
            })
          }
        >
          <TestAudio id={selectedDeviceIDs.audioOutput} />
        </DeviceSelector>
      ) : null}
    </Fragment>
  );
};

const DeviceSelector = ({
  title,
  devices,
  selection,
  onChange,
  icon,
  children = null,
}) => {
  const [open, setOpen] = useState(false);
  return (
    <Box css={{ mb: "$10" }}>
      <Text css={{ mb: "$4" }}>{title}</Text>
      <Flex align="center">
        <Dropdown.Root open={open} onOpenChange={setOpen}>
          <Dropdown.Trigger
            asChild
            data-testid={`${title}_selector`}
            css={{
              border: "1px solid $borderLight",
              bg: "$surfaceLight",
              r: "$1",
              p: "$6 $9",
              ...(children
                ? {
                    flex: "1 1 0",
                    minWidth: 0,
                  }
                : {}),
            }}
          >
            <Flex
              css={{
                display: "flex",
                justifyContent: "space-between",
                color: "$textHighEmp",
                w: "100%",
              }}
            >
              {icon}
              <Text
                css={{
                  color: "inherit",
                  ...textEllipsis("90%"),
                  flex: "1 1 0",
                  mx: "$6",
                }}
              >
                {devices.find(({ deviceId }) => deviceId === selection)?.label}
              </Text>
              {open ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </Flex>
          </Dropdown.Trigger>
          <Dropdown.Content align="start" sideOffset={8} css={{ w: "unset" }}>
            {devices.map(device => {
              return (
                <Dropdown.Item
                  key={device.label}
                  onSelect={() => onChange(device.deviceId)}
                  css={{
                    px: "$9",
                    bg:
                      device.deviceId === selection
                        ? "$primaryDark"
                        : undefined,
                  }}
                >
                  {device.label}
                </Dropdown.Item>
              );
            })}
          </Dropdown.Content>
        </Dropdown.Root>
        {children}
      </Flex>
    </Box>
  );
};

const TEST_AUDIO_URL = "https://100ms.live/test-audio.wav";

const TestAudio = ({ id }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (audioRef.current && id) {
      try {
        if (typeof audioRef.current.setSinkId !== "undefined") {
          audioRef.current.setSinkId(id);
        }
      } catch (error) {
        console.log(error);
      }
    }
  }, [id]);
  return (
    <>
      <Button
        variant="standard"
        css={{
          backgroundColor: "$secondaryDefault",
          color: "$textPrimary",
          flexShrink: 0,
          ml: "$4",
          p: "$6 $9",
          border: "1px solid $secondaryDefault",
        }}
        onClick={() => audioRef.current?.play()}
        disabled={playing}
      >
        <SpeakerIcon />
        &nbsp;Test
      </Button>
      <audio
        ref={audioRef}
        src={TEST_AUDIO_URL}
        onEnded={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
    </>
  );
};

export default Settings;
