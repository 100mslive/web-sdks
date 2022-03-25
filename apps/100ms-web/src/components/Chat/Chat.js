import React, { useState } from "react";
import { Box, Flex } from "@100mslive/react-ui";
import { ChatFooter } from "./ChatFooter";
import { ChatHeader } from "./ChatHeader";
import { ChatBody } from "./ChatBody";
import { ChatSelector } from "./ChatSelector";

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
        onToggle={() => {
          setChatOptions(state => ({
            ...state,
            selectorOpen: !state.selectorOpen,
          }));
        }}
        onClose={onClose}
      />
      <Box
        css={{
          flex: "1 1 0",
          overflowY: "auto",
          bg: "$bgSecondary",
          position: "relative",
          pt: "$4",
        }}
      >
        <ChatBody role={chatOptions.role} peerId={chatOptions.peerId} />
        {chatOptions.selectorOpen && (
          <ChatSelector
            role={chatOptions.role}
            peerId={chatOptions.peerId}
            onSelect={data => {
              setChatOptions(state => ({
                ...state,
                ...data,
                selectorOpen: false,
              }));
            }}
          />
        )}
      </Box>
      <ChatFooter role={chatOptions.role} peerId={chatOptions.peerId} />
    </Flex>
  );
};
