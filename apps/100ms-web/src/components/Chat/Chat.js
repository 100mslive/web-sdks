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
    selection: "Everyone",
  });
  const [selectorOpen, setSelectorOpen] = useState(false);
  return (
    <Flex direction="column" css={{ size: "100%" }}>
      <ChatHeader
        open={selectorOpen}
        selection={chatOptions.selection}
        onToggle={() => {
          setSelectorOpen(value => !value);
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
        {selectorOpen && (
          <ChatSelector
            role={chatOptions.role}
            peerId={chatOptions.peerId}
            onSelect={data => {
              setChatOptions(state => ({
                ...state,
                ...data,
              }));
              setSelectorOpen(false);
            }}
          />
        )}
      </Box>
      <ChatFooter role={chatOptions.role} peerId={chatOptions.peerId} />
    </Flex>
  );
};
