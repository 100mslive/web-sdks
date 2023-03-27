import React, { Fragment, useCallback, useState } from "react";
import data from "@emoji-mart/data/sets/14/apple.json";
import { init } from "emoji-mart";
import { useCustomEvent, useHMSActions } from "@100mslive/react-sdk";
import { EmojiIcon } from "@100mslive/react-icons";
import {
  Box,
  Dropdown,
  Flex,
  styled,
  Text,
  Tooltip,
} from "@100mslive/react-ui";
import IconButton from "../IconButton";
import {
  emojiIdMapping,
  HLS_TIMED_METADATA_DOC_URL,
} from "../common/constants";

init({ data });
const emojiReactionList = [
  [
    { emojiId: "+1" },
    { emojiId: "-1" },
    { emojiId: "wave" },
    { emojiId: "clap" },
    { emojiId: "fire" },
  ],
  [
    { emojiId: "tada" },
    { emojiId: "heart_eyes" },
    { emojiId: "joy" },
    { emojiId: "open_mouth" },
    { emojiId: "sob" },
  ],
];
export const EmojiReaction = () => {
  const [open, setOpen] = useState(false);
  const hmsActions = useHMSActions();

  const onEmojiEvent = useCallback(data => {
    const emoji = emojiIdMapping.find(emoji => emoji.emojiId === data.emojiId);
    window.sendConfetti({ emojis: [emoji?.emoji] });
  }, []);

  const { sendEvent } = useCustomEvent({
    type: "EMOJI_REACTION",
    onEvent: onEmojiEvent,
  });

  const sendReaction = async emojiId => {
    const data = { triggerConfetti: true, emojiId: emojiId };
    sendEvent(data);
    await hmsActions.sendHLSTimedMetadata([
      {
        payload: btoa(JSON.stringify(data)),
        duration: 2,
      },
    ]);
  };

  return (
    <Fragment>
      <Dropdown.Root open={open} onOpenChange={setOpen}>
        <Dropdown.Trigger asChild data-testid="emoji_reaction_btn">
          <IconButton>
            <Tooltip title="Emoji Reaction">
              <Box>
                <EmojiIcon />
              </Box>
            </Tooltip>
          </IconButton>
        </Dropdown.Trigger>
        <Dropdown.Content
          sideOffset={5}
          align="center"
          css={{ p: "$8", bg: "$surfaceDefault" }}
        >
          {emojiReactionList.map((emojiLine, index) => (
            <Flex key={index} justify="between" css={{ mb: "$8" }}>
              {emojiLine.map(emoji => (
                <EmojiContainer
                  key={emoji.emojiId}
                  onClick={() => sendReaction(emoji.emojiId)}
                >
                  <em-emoji
                    id={emoji.emojiId}
                    size="100%"
                    set="apple"
                  ></em-emoji>
                </EmojiContainer>
              ))}
            </Flex>
          ))}
          <Text
            variant="sm"
            css={{ textAlign: "center", color: "$ textAccentMedium" }}
          >
            Reactions will be timed for Live Streaming viewers.{" "}
            <Text
              variant="sm"
              css={{
                display: "inline",
                textAlign: "center",
                color: "$primaryLight",
                fontWeight: "$semiBold",
              }}
            >
              <a
                href={HLS_TIMED_METADATA_DOC_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {"Learn more ->"}
              </a>
            </Text>
          </Text>
        </Dropdown.Content>
      </Dropdown.Root>
    </Fragment>
  );
};

const EmojiContainer = styled("span", {
  position: "relative",
  cursor: "pointer",
  width: "46px",
  height: "46px",
  p: "$4",
  "&:hover": {
    p: "7px",
    bg: "$surfaceLighter",
    borderRadius: "$1",
  },
});
