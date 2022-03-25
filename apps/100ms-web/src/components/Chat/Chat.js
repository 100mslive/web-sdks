import React, { useState } from "react";
import { Box, Flex } from "@100mslive/react-ui";
import { ChatFooter } from "./ChatFooter";
import { ChatHeader } from "./ChatHeader";
import { ChatBody } from "./ChatBody";

export const Chat = ({ onClose }) => {
  const [chatOptions, setChatOptions] = useState({
    role: "",
    peerId: "",
    everyone: true,
    value: "Everyone",
    selectorOpen: false,
    unreadCount: 0,
  });
  return (
    <Flex direction="column" css={{ size: "100%" }}>
      <ChatHeader
        open={chatOptions.selectorOpen}
        selection={chatOptions.value}
        onClick={() => {
          setChatOptions(state => ({
            ...state,
            selectorOpen: !state.selectorOpen,
          }));
        }}
        onClose={onClose}
      />
      <Box
        css={{ flex: "1 1 0", overflowY: "auto", bg: "$bgSecondary", p: "$8" }}
      >
        <ChatBody role={chatOptions.role} peerId={chatOptions.peerId} />
      </Box>
      <ChatFooter role={chatOptions.role} peerId={chatOptions.peerId} />
    </Flex>
  );
};
