import React, { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import {
  selectHMSMessagesCount,
  selectPermissions,
  selectSessionMetadata,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import { ChevronDownIcon, CrossIcon, PinIcon } from "@100mslive/react-icons";
import { Box, Button, Flex, IconButton, Text } from "@100mslive/react-ui";
import { AnnotisedMessage, ChatBody } from "./ChatBody";
import { ChatFooter } from "./ChatFooter";
import { ChatHeader } from "./ChatHeader";
import { useSetPinnedMessage } from "../hooks/useSetPinnedMessage";
import { useUnreadCount } from "./useUnreadCount";

const PinnedMessage = ({ clearPinnedMessage }) => {
  const permissions = useHMSStore(selectPermissions);
  const pinnedMessage = useHMSStore(selectSessionMetadata);

  return pinnedMessage ? (
    <Flex
      css={{ p: "$8", color: "$textMedEmp", bg: "$surfaceLight", r: "$1" }}
      align="center"
      justify="between"
    >
      <Box>
        <PinIcon />
      </Box>
      <Box
        css={{
          ml: "$8",
          color: "$textMedEmp",
          w: "100%",
          maxHeight: "$18",
          overflowY: "auto",
        }}
      >
        <Text variant="sm">
          <AnnotisedMessage message={pinnedMessage} />
        </Text>
      </Box>
      {permissions.removeOthers && (
        <IconButton onClick={() => clearPinnedMessage()}>
          <CrossIcon />
        </IconButton>
      )}
    </Flex>
  ) : null;
};

export const Chat = () => {
  const [chatOptions, setChatOptions] = useState({
    role: "",
    peerId: "",
    selection: "Everyone",
  });
  const [isSelectorOpen, setSelectorOpen] = useState(false);
  const listRef = useRef([]);
  const hmsActions = useHMSActions();
  const { setPinnedMessage } = useSetPinnedMessage();

  const storeMessageSelector = selectHMSMessagesCount;

  const messagesCount = useHMSStore(storeMessageSelector) || 0;
  const scrollToBottom = useCallback(
    (unreadCount = 0) => {
      if (listRef.current && listRef.current.scrollToItem && unreadCount > 0) {
        console.log("is scroool called ", messagesCount, unreadCount);
        listRef.current?.scrollToItem(messagesCount, "end");
        requestAnimationFrame(() => {
          listRef.current?.scrollToItem(messagesCount, "end");
        });
        hmsActions.setMessageRead(true);
      }
    },
    [hmsActions, messagesCount]
  );

  return (
    <Flex direction="column" css={{ size: "100%" }}>
      <ChatHeader
        selectorOpen={isSelectorOpen}
        selection={chatOptions.selection}
        onSelect={setChatOptions}
        role={chatOptions.role}
        peerId={chatOptions.peerId}
        onToggle={() => {
          setSelectorOpen(value => !value);
        }}
      />
      <PinnedMessage clearPinnedMessage={setPinnedMessage} />
      <Flex
        direction="column"
        css={{
          flex: "1 1 0",
          overflowY: "auto",
          pt: "$4",
          position: "relative",
          // Below two are for pushing scroll to the edge of the box
          mr: "-$10",
          pr: "$10",
        }}
      >
        <ChatBody
          role={chatOptions.role}
          peerId={chatOptions.peerId}
          setPinnedMessage={setPinnedMessage}
          scrollToBottom={scrollToBottom}
          ref={listRef}
        />
        <ScrollHandler
          scrollToBottom={scrollToBottom}
          role={chatOptions.role}
          peerId={chatOptions.peerId}
        />
      </Flex>
      <ChatFooter
        role={chatOptions.role}
        peerId={chatOptions.peerId}
        onSend={() => scrollToBottom(1)}
      >
        {!isSelectorOpen && (
          <NewMessageIndicator
            role={chatOptions.role}
            peerId={chatOptions.peerId}
            scrollToBottom={scrollToBottom}
          />
        )}
      </ChatFooter>
    </Flex>
  );
};

const NewMessageIndicator = ({ role, peerId, scrollToBottom }) => {
  const unreadCount = useUnreadCount({ role, peerId });
  if (!unreadCount) {
    return null;
  }
  return (
    <Flex
      justify="center"
      css={{
        width: "100%",
        left: 0,
        bottom: "100%",
        position: "absolute",
      }}
    >
      <Button
        onClick={() => {
          scrollToBottom(unreadCount);
        }}
        css={{ p: "$2 $4", "& > svg": { ml: "$4" } }}
      >
        New Messages
        <ChevronDownIcon width={16} height={16} />
      </Button>
    </Flex>
  );
};

const ScrollHandler = ({ scrollToBottom, role, peerId }) => {
  const { ref, inView } = useInView({ threshold: 0.5 });
  const unreadCount = useUnreadCount({ role, peerId });
  useEffect(() => {
    if (inView && unreadCount) {
      scrollToBottom(unreadCount);
    }
  }, [inView, unreadCount, scrollToBottom]);
  return <div ref={ref} style={{ height: 1 }}></div>;
};
