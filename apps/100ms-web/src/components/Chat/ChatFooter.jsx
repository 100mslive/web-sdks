import React, { useRef } from "react";
import { Flex, IconButton, Input } from "@100mslive/react-ui";
import { useHMSActions } from "@100mslive/react-sdk";
import { ToastManager } from "../Toast/ToastManager";
import { SendIcon } from "@100mslive/react-icons";

export const ChatFooter = ({ role, peerId }) => {
  const hmsActions = useHMSActions();
  const inputRef = useRef(null);
  const sendMessage = async () => {
    const message = inputRef.current.value;
    if (!message || !message.trim().length) {
      return;
    }
    try {
      if (role) {
        await hmsActions.sendGroupMessage(message, [role]);
      } else if (peerId) {
        await hmsActions.sendDirectMessage(message, peerId);
      } else {
        await hmsActions.sendBroadcastMessage(message);
      }
      inputRef.current.value = "";
    } catch (error) {
      ToastManager.addToast({ title: error.message });
    }
  };
  return (
    <Flex
      align="center"
      css={{
        borderTop: "1px solid $borderDefault",
        bg: "$menuBg",
        minHeight: "$16",
        maxHeight: "$24",
      }}
    >
      <Input
        type="text"
        placeholder="Write something here"
        ref={inputRef}
        css={{ bg: "transparent", "&:focus": { boxShadow: "none" } }}
        onKeyPress={async event => {
          if (event.key === "Enter") {
            if (!event.shiftKey) {
              event.preventDefault();
              await sendMessage();
            }
          }
        }}
      />
      <IconButton
        onClick={sendMessage}
        css={{ ml: "auto", height: "max-content", mr: "$4" }}
      >
        <SendIcon />
      </IconButton>
    </Flex>
  );
};
