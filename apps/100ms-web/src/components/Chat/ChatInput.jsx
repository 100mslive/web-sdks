import React, { useRef } from "react";
import { Flex, IconButton, Input } from "@100mslive/react-ui";
import { useHMSActions } from "@100mslive/react-sdk";
import { ToastManager } from "../Toast/ToastManager";
import { SendIcon } from "@100mslive/react-icons";

export const ChatInput = ({ selection }) => {
  const hmsActions = useHMSActions();
  const inputRef = useRef(null);
  const sendMessage = async () => {
    const message = inputRef.current.value;
    if (!message || !message.trim().length) {
      return;
    }
    try {
      if (selection.role) {
        await hmsActions.sendGroupMessage(message, [selection.role]);
      } else if (selection.peerId) {
        await hmsActions.sendDirectMessage(message, selection.peerId);
      } else {
        await hmsActions.sendBroadcastMessage(message);
      }
    } catch (error) {
      ToastManager.addToast({ title: error.message });
    }
  };
  return (
    <Flex>
      <Input
        type="text"
        placeholder="Enter message"
        ref={inputRef}
        onKeyPress={async event => {
          if (event.key === "Enter") {
            if (!event.shiftKey) {
              event.preventDefault();
              await sendMessage();
            }
          }
        }}
      />
      <IconButton onClick={sendMessage}>
        <SendIcon />
      </IconButton>
    </Flex>
  );
};
