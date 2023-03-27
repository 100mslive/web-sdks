import React, { Fragment, useState } from "react";
import data from "@emoji-mart/data/sets/14/apple.json";
import { init } from "emoji-mart";
import { useHMSActions } from "@100mslive/react-sdk";
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
  emojiReactionList,
  HLS_TIMED_METADATA_DOC_URL,
} from "../common/constants";

init({ data });

export const EmojiReaction = () => {
  const [open, setOpen] = useState(false);
  const hmsActions = useHMSActions();

  const sendReaction = async emojiId => {
    const data = { triggerConfetti: true, emojiId: emojiId };
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
