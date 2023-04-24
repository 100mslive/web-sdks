import { useCallback, useEffect, useRef, useState } from "react";
import { useMedia } from "react-use";
import {
  selectLocalPeerID,
  selectPeerNameByID,
  useHMSStore,
  useHMSVanillaStore,
} from "@100mslive/react-sdk";
import { config as cssConfig } from "@100mslive/react-ui";
import { emojiIdMapping } from "../common/constants";
import "./FlyingEmoji.css";

export function FlyingEmoji() {
  const localPeerId = useHMSStore(selectLocalPeerID);
  const vanillaStore = useHMSVanillaStore();
  const flyingEmojisContainerRef = useRef();
  const [emojis, setEmojis] = useState([]);
  const isMobile = useMedia(cssConfig.media.md);

  const handleRemoveFlyingEmoji = useCallback(node => {
    if (!flyingEmojisContainerRef.current) return;
    flyingEmojisContainerRef.current.removeChild(node);
  }, []);

  const showFlyingEmoji = useCallback(
    config => {
      if (!flyingEmojisContainerRef.current || !config?.emoji || !config?.name)
        return;
      setEmojis([
        ...emojis,
        {
          ...config,
          wiggleClass:
            Math.random() < 0.5
              ? "emoji wiggle-left-right"
              : "emoji wiggle-right-left",
          startingPoint: `${5 + Math.random() * (isMobile ? 40 : 20)}%`,
        },
      ]);
      const node = document.createElement("div");
      const emojiElement = document.createElement("div");
      emojiElement.innerHTML = config.emoji;
      const senderNameElement = document.createElement("div");
      senderNameElement.innerHTML = config.name;
      senderNameElement.className = "reaction-sender-name";

      node.className =
        Math.random() < 0.5
          ? "emoji wiggle-left-right"
          : "emoji wiggle-right-left";
      node.style.left = `${5 + Math.random() * 20}%`;
      node.src = "";

      node.appendChild(emojiElement);
      node.appendChild(senderNameElement);
      flyingEmojisContainerRef.current.appendChild(node);

      node.addEventListener("animationend", e => {
        handleRemoveFlyingEmoji(e.target);
      });
    },
    [handleRemoveFlyingEmoji, isMobile, emojis]
  );

  const showFlyingEmojiUsingEmojiId = useCallback(
    (emojiId, senderPeerId) => {
      const emoji = emojiIdMapping.find(emoji => emoji.emojiId === emojiId);
      const senderPeerName = vanillaStore.getState(
        selectPeerNameByID(senderPeerId)
      );
      const nameToShow = localPeerId === senderPeerId ? "You" : senderPeerName;

      const config = { emoji: emoji?.emoji, name: nameToShow };
      showFlyingEmoji(config);
    },
    [showFlyingEmoji, localPeerId, vanillaStore]
  );

  // putting the function to send on window for quick access
  useEffect(() => {
    window.showFlyingEmojiUsingEmojiId = showFlyingEmojiUsingEmojiId;
  }, [showFlyingEmojiUsingEmojiId]);

  return (
    <div
      className="flying-emojis-container"
      ref={flyingEmojisContainerRef}
    ></div>
  );
}
