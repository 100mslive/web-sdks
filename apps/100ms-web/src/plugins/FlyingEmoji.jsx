import { useCallback, useEffect, useState } from "react";
import { useMedia } from "react-use";
import {
  selectLocalPeerID,
  selectPeerNameByID,
  useHMSStore,
  useHMSVanillaStore,
} from "@100mslive/react-sdk";
import { Box, config as cssConfig, Flex, Text } from "@100mslive/react-ui";
import "./FlyingEmoji.css";

let emojiCount = 1;

export function FlyingEmoji() {
  const localPeerId = useHMSStore(selectLocalPeerID);
  const vanillaStore = useHMSVanillaStore();
  const [emojis, setEmojis] = useState([]);
  const isMobile = useMedia(cssConfig.media.md);

  const showFlyingEmoji = useCallback(
    (emojiId, senderPeerId) => {
      if (!emojiId || !senderPeerId) {
        return;
      }
      const senderPeerName = vanillaStore.getState(
        selectPeerNameByID(senderPeerId)
      );
      const nameToShow = localPeerId === senderPeerId ? "You" : senderPeerName;

      setEmojis(emojis => {
        return [
          ...emojis,
          {
            id: emojiCount++,
            emojiId: emojiId,
            senderName: nameToShow,
            startingPoint: `${5 + Math.random() * (isMobile ? 40 : 20)}%`,
            wiggleClass:
              Math.random() < 0.5
                ? "emoji wiggle-left-right"
                : "emoji wiggle-right-left",
          },
        ];
      });
    },
    [localPeerId, vanillaStore, isMobile]
  );

  useEffect(() => {
    window.showFlyingEmoji = showFlyingEmoji;
  }, [showFlyingEmoji]);

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
            }}
            onAnimationEnd={() => {
              setEmojis(emojis.filter(item => item.id !== emoji.id));
            }}
          >
            <Box>
              <em-emoji id={emoji.emojiId} size="56px" set="apple"></em-emoji>
            </Box>
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
