import { useCallback, useEffect, useRef, useState } from "react";
import { useMedia } from "react-use";
import {
  selectLocalPeerID,
  selectPeerNameByID,
  useHMSStore,
  useHMSVanillaStore,
} from "@100mslive/react-sdk";
import { Box, config as cssConfig, Flex, Text } from "@100mslive/react-ui";
import { emojiIdMapping } from "../common/constants";
import "./FlyingEmoji.css";

let emojiId = 1;

export function FlyingEmoji() {
  const localPeerId = useHMSStore(selectLocalPeerID);
  const vanillaStore = useHMSVanillaStore();
  const flyingEmojisContainerRef = useRef();
  const [emojis, setEmojis] = useState([]);
  const isMobile = useMedia(cssConfig.media.md);

  const showFlyingEmoji = useCallback(
    config => {
      if (
        !flyingEmojisContainerRef.current ||
        !config?.emoji ||
        !config?.senderName
      ) {
        return;
      }

      setEmojis([
        ...emojis,
        {
          id: emojiId++,
          emoji: config.emoji,
          senderName: config.senderName,
          startingPoint: `${5 + Math.random() * (isMobile ? 40 : 20)}%`,
          wiggleClass:
            Math.random() < 0.5
              ? "emoji wiggle-left-right"
              : "emoji wiggle-right-left",
        },
      ]);
    },
    [isMobile, emojis]
  );

  const showFlyingEmojiUsingEmojiId = useCallback(
    (emojiId, senderPeerId) => {
      const emoji = emojiIdMapping.find(emoji => emoji.emojiId === emojiId);
      const senderPeerName = vanillaStore.getState(
        selectPeerNameByID(senderPeerId)
      );
      const nameToShow = localPeerId === senderPeerId ? "You" : senderPeerName;

      const config = { emoji: emoji?.emoji, senderName: nameToShow };
      showFlyingEmoji(config);
    },
    [showFlyingEmoji, localPeerId, vanillaStore]
  );

  // putting the function to send on window for quick access
  useEffect(() => {
    window.showFlyingEmojiUsingEmojiId = showFlyingEmojiUsingEmojiId;
  }, [showFlyingEmojiUsingEmojiId]);

  return (
    <Box
      css={{
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        overflow: "hidden",
        pointerEvents: "none",
        userSelect: "none",
        zIndex: 999,
      }}
      className="flying-emojis-container"
      ref={flyingEmojisContainerRef}
    >
      {emojis.map(emoji => {
        return (
          <Flex
            key={emoji.id}
            className={emoji.wiggleClass}
            css={{
              left: emoji.startingPoint,
              flexDirection: "column",
              alignItems: "center",
              position: "absolute",
              bottom: 0,
              fontSize: "$space$17",
              lineHeight: 1,
            }}
            onAnimationEnd={() => {
              setEmojis(emojis.filter(item => item.id !== emoji.id));
            }}
          >
            <Box>{emoji.emoji}</Box>
            <Box
              css={{
                width: "fit-content",
                padding: "$2 $4",
                background: "$surfaceLight",
                borderRadius: "$1",
              }}
            >
              <Text
                css={{
                  fontSize: "$space$6",
                  lineHeight: "$xs",
                  color: "$textHighEmp",
                }}
              >
                {emoji.senderName}
              </Text>
            </Box>
          </Flex>
        );
      })}
    </Box>
  );
}
