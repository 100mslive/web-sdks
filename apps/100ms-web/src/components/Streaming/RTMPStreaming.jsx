import React, { Fragment, useRef, useState } from "react";
import {
  selectAppData,
  useHMSActions,
  useHMSStore,
  useRecordingStreaming,
} from "@100mslive/react-sdk";
import {
  AddCircleIcon,
  EndStreamIcon,
  GoLiveIcon,
  PencilIcon,
  SettingsIcon,
  TrashIcon,
} from "@100mslive/react-icons";
import {
  Accordion,
  Box,
  Button,
  Flex,
  Input,
  Label,
  Text,
} from "@100mslive/react-ui";
import { Container, ContentBody, ContentHeader, RecordStream } from "./Common";
import {
  UserPreferencesKeys,
  useUserPreferences,
} from "../hooks/useUserPreferences";
import { getDefaultMeetingUrl } from "../../common/utils";
import { APP_DATA } from "../../common/constants";

export const RTMPStreaming = ({ onBack }) => {
  const { isRTMPRunning } = useRecordingStreaming();

  return (
    <Container>
      <ContentHeader
        title="Start Streaming"
        content="Choose a destination"
        onBack={onBack}
      />
      <ContentBody Icon={SettingsIcon} title="Custom RTMP">
        Allows you to add a Custom RTMP or more than 1 channel of the same
        platform from our list of supported platforms.
      </ContentBody>
      {!isRTMPRunning ? <StartRTMP /> : <EndRTMP />}
    </Container>
  );
};

const StartRTMP = () => {
  const [rtmpPreference = [], setRTMPPreference] = useUserPreferences(
    UserPreferencesKeys.RTMP_URLS
  );
  const [rtmpStreams, setRTMPStreams] = useState(
    rtmpPreference.length > 0
      ? rtmpPreference
      : [
          {
            name: "Stream",
            id: Date.now(),
            rtmpURL: "",
            streamKey: "",
          },
        ]
  );
  const hmsActions = useHMSActions();
  const recordingUrl = useHMSStore(selectAppData(APP_DATA.recordingUrl));
  const [record, setRecord] = useState(false);
  return (
    <Fragment>
      {rtmpStreams.length > 0 && (
        <Box css={{ px: "$10", overflowY: "auto" }}>
          <Accordion.Root
            type="single"
            collapsible
            defaultValue={rtmpStreams[0].id}
          >
            {rtmpStreams.map(rtmp => {
              return (
                <Accordion.Item
                  value={rtmp.id}
                  key={rtmp.id}
                  css={{
                    border: "2px solid $surfaceLight !important",
                    r: "$1",
                    my: "$4",
                  }}
                >
                  <AccordionHeader
                    rtmp={rtmp}
                    setRTMPStreams={setRTMPStreams}
                  />
                  <Accordion.Content css={{ px: "$8", py: 0 }}>
                    <RTMPForm {...rtmp} setRTMPStreams={setRTMPStreams} />
                  </Accordion.Content>
                </Accordion.Item>
              );
            })}
          </Accordion.Root>
        </Box>
      )}
      <RecordStream record={record} setRecord={setRecord} />
      <Box css={{ p: "$8 $10" }}>
        {rtmpStreams.length < 3 && (
          <Button
            variant="standard"
            outlined
            icon
            css={{ mb: "$8", w: "100%" }}
            onClick={() => {
              setRTMPStreams(streams => [
                ...streams,
                {
                  name: "Stream",
                  id: Date.now(),
                  rtmpURL: "",
                  streamKey: "",
                },
              ]);
            }}
          >
            <AddCircleIcon /> Add Stream
          </Button>
        )}
        <Button
          variant="primary"
          icon
          css={{ w: "100%" }}
          disabled={
            rtmpStreams.length === 0 ||
            rtmpStreams.some(value => !value.rtmpURL || !value.streamKey)
          }
          onClick={async () => {
            try {
              hmsActions.startRTMPOrRecording({
                rtmpURLs: rtmpStreams.map(
                  value => `${value.rtmpURL}/${value.streamKey}`
                ),
                meetingURL: recordingUrl || getDefaultMeetingUrl(),
              });
              setRTMPPreference(rtmpStreams);
            } catch (error) {
              console.error(error);
            }
          }}
        >
          <GoLiveIcon />
          Go Live
        </Button>
      </Box>
    </Fragment>
  );
};

const EndRTMP = () => {
  const hmsActions = useHMSActions();
  return (
    <Box css={{ p: "$4 $10" }}>
      <Button
        variant="danger"
        css={{ w: "100%", r: "$0", my: "$8" }}
        icon
        onClick={async () => {
          await hmsActions.stopRTMPAndRecording();
        }}
      >
        <EndStreamIcon />
        End Stream
      </Button>
    </Box>
  );
};

const ActionIcon = ({ icon: Icon, onClick }) => {
  return (
    <Text as="span" css={{ mx: "$2", cursor: "pointer" }} onClick={onClick}>
      <Icon width={16} height={16} />
    </Text>
  );
};

const FormLabel = ({ id, children }) => {
  return (
    <Label
      htmlFor={id}
      css={{ color: "$textHighEmp", my: "$4", fontSize: "$sm" }}
    >
      {children}
    </Label>
  );
};

const RTMPForm = ({ rtmpURL, id, streamKey, setRTMPStreams }) => {
  const formRef = useRef(null);
  return (
    <Flex
      as="form"
      id={id}
      direction="column"
      ref={formRef}
      onSubmit={e => {
        e.preventDefault();
      }}
    >
      <FormLabel id="rtmpURL">RTMP URL</FormLabel>
      <Input
        placeholder="Enter RTMP URL"
        id="rtmpURL"
        name="rtmpURL"
        value={rtmpURL}
        onChange={e => {
          setRTMPStreams(streams =>
            updateStream({
              streams,
              id,
              value: e.target.value,
              key: e.target.name,
            })
          );
        }}
        required
      />
      <FormLabel id="streamKey">Stream Key</FormLabel>
      <Input
        placeholder="Enter Stream Key"
        id="streamKey"
        name="streamKey"
        Value={streamKey}
        onChange={e => {
          setRTMPStreams(streams =>
            updateStream({
              streams,
              id,
              value: e.target.value,
              key: e.target.name,
            })
          );
        }}
        required
      />
    </Flex>
  );
};

const AccordionHeader = ({ rtmp, setRTMPStreams }) => {
  const [edit, setEdit] = useState(false);
  return (
    <Accordion.Header css={{ px: "$8" }}>
      {edit ? (
        <Input
          defaultValue={rtmp.name}
          autoFocus
          onBlur={e => {
            const value = e.currentTarget.value.trim();
            if (value) {
              setRTMPStreams(streams =>
                streams.map(stream => {
                  if (stream.id === rtmp.id) {
                    stream.name = value;
                  }
                  return stream;
                })
              );
              setEdit(false);
            }
          }}
        />
      ) : (
        <Text css={{ flex: "1 1 0" }}>{rtmp.name}</Text>
      )}
      <Flex css={{ mx: "$4", gap: "$2" }}>
        <ActionIcon
          onClick={e => {
            e.stopPropagation();
            setEdit(true);
          }}
          icon={PencilIcon}
        />
        <ActionIcon
          onClick={() => {
            setRTMPStreams(streams =>
              streams.filter(stream => stream.id !== rtmp.id)
            );
          }}
          icon={TrashIcon}
        />
      </Flex>
    </Accordion.Header>
  );
};

const updateStream = ({ streams, id, key, value }) =>
  streams.map(stream => {
    if (stream.id === id) {
      return {
        ...stream,
        [key]: value,
      };
    }
    return stream;
  });
