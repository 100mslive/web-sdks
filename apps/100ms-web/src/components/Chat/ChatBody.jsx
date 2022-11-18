import React, { Fragment, useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import AutoSizer from "react-virtualized-auto-sizer";
import { VariableSizeList } from "react-window";
import {
  selectHMSMessages,
  selectLocalPeerID,
  selectLocalPeerRoleName,
  selectMessagesByPeerID,
  selectMessagesByRole,
  selectPeerNameByID,
  selectPermissions,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import { HorizontalMenuIcon, PinIcon } from "@100mslive/react-icons";
import {
  Box,
  Dropdown,
  Flex,
  IconButton,
  styled,
  Text,
  Tooltip,
} from "@100mslive/react-ui";

const formatTime = date => {
  if (!(date instanceof Date)) {
    return "";
  }
  let hours = date.getHours();
  let mins = date.getMinutes();
  const suffix = hours > 11 ? "PM" : "AM";
  if (hours < 10) {
    hours = "0" + hours;
  }
  if (mins < 10) {
    mins = "0" + mins;
  }
  return `${hours}:${mins} ${suffix}`;
};

const MessageTypeContainer = ({ left, right }) => {
  return (
    <Flex
      align="center"
      css={{
        ml: "auto",
        mr: "$4",
        p: "$2 $4",
        border: "1px solid $textDisabled",
        r: "$0",
      }}
    >
      {left && (
        <SenderName variant="tiny" as="span" css={{ color: "$textMedEmp" }}>
          {left}
        </SenderName>
      )}
      {left && right && (
        <Box
          css={{ borderLeft: "1px solid $textDisabled", mx: "$4", h: "$8" }}
        />
      )}
      {right && (
        <SenderName as="span" variant="tiny">
          {right}
        </SenderName>
      )}
    </Flex>
  );
};

const MessageType = ({ roles, hasCurrentUserSent, receiver }) => {
  const peerName = useHMSStore(selectPeerNameByID(receiver));
  const localPeerRoleName = useHMSStore(selectLocalPeerRoleName);
  if (receiver) {
    return (
      <MessageTypeContainer
        left={
          hasCurrentUserSent ? `${peerName ? `TO ${peerName}` : ""}` : "TO YOU"
        }
        right="PRIVATE"
      />
    );
  }

  if (roles && roles.length) {
    return (
      <MessageTypeContainer
        left="TO"
        right={hasCurrentUserSent ? roles.join(",") : localPeerRoleName}
      />
    );
  }
  return null;
};

const URL_REGEX =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const Link = styled("a", {
  color: "$brandDefault",
  wordBreak: "break-word",
  "&:hover": {
    textDecoration: "underline",
  },
});

export const AnnotisedMessage = ({ message }) => {
  if (!message) {
    return <Fragment />;
  }

  return (
    <Fragment>
      {message
        .trim()
        .split(/(\s)/)
        .map(part =>
          URL_REGEX.test(part) ? (
            <Link
              href={part}
              key={part}
              target="_blank"
              rel="noopener noreferrer"
            >
              {part}
            </Link>
          ) : (
            part
          )
        )}
    </Fragment>
  );
};

const getMessageType = ({ roles, receiver }) => {
  if (roles && roles.length > 0) {
    return "role";
  }
  return receiver ? "private" : "";
};

const ChatActions = ({ onPin }) => {
  const [open, setOpen] = useState(false);

  return (
    <Dropdown.Root open={open} onOpenChange={setOpen}>
      <Dropdown.Trigger asChild>
        <IconButton>
          <Tooltip title="More options">
            <Box
              css={{
                display: "flex",
                flexDirection: "row-reverse",
              }}
            >
              <HorizontalMenuIcon />
            </Box>
          </Tooltip>
        </IconButton>
      </Dropdown.Trigger>

      <Dropdown.Content sideOffset={5} align="center" css={{ width: "$48" }}>
        <Dropdown.Item data-testid="pin_message_btn" onClick={onPin}>
          <PinIcon />
          <Text variant="sm" css={{ ml: "$4" }}>
            Pin Message
          </Text>
        </Dropdown.Item>
      </Dropdown.Content>
    </Dropdown.Root>
  );
};

const SenderName = styled(Text, {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: "24ch",
  minWidth: 0,
});

const ChatMessage = React.memo(
  ({ index, style = {}, message, setRowHeight, onPin }) => {
    const { ref, inView } = useInView({ threshold: 0.5, triggerOnce: true });
    const rowRef = useRef(null);
    useEffect(() => {
      if (rowRef.current) {
        setRowHeight(index, rowRef.current.clientHeight);
      }
      // eslint-disable-next-line
    }, [rowRef]);

    const hmsActions = useHMSActions();
    const localPeerId = useHMSStore(selectLocalPeerID);
    const permissions = useHMSStore(selectPermissions);
    const messageType = getMessageType({
      roles: message.recipientRoles,
      receiver: message.recipientPeer,
    });
    // show pin action only if peer has remove others permission and the message is of broadcast type
    const showPinAction = permissions.removeOthers && !messageType;

    useEffect(() => {
      if (message.id && !message.read && inView) {
        hmsActions.setMessageRead(true, message.id);
      }
    }, [message.read, hmsActions, inView, message.id]);

    return (
      <Box
        ref={ref}
        css={{
          display: "flex",
          flexWrap: "wrap",
          align: "center",
          bg: messageType ? "$surfaceLight" : undefined,
          px: messageType ? "$4" : "$2",
          py: messageType ? "$4" : 0,
          mb: "$10",
        }}
        key={message.time}
        data-testid="chat_msg"
        style={style}
      >
        <Text ref={rowRef} as="div" css={{ width: "inherit" }}>
          <Text
            css={{
              color: "$textHighEmp",
              fontWeight: "$semiBold",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
            as="div"
          >
            <Flex align="center">
              {message.senderName === "You" || !message.senderName ? (
                <SenderName as="span">
                  {message.senderName || "Anonymous"}
                </SenderName>
              ) : (
                <Tooltip title={message.senderName} side="top" align="start">
                  <SenderName as="span">{message.senderName}</SenderName>
                </Tooltip>
              )}
              <Text
                as="span"
                variant="sm"
                css={{
                  ml: "$4",
                  color: "$textSecondary",
                  flexShrink: 0,
                }}
              >
                {formatTime(message.time)}
              </Text>
            </Flex>
            <MessageType
              hasCurrentUserSent={message.sender === localPeerId}
              receiver={message.recipientPeer}
              roles={message.recipientRoles}
            />
            {showPinAction && <ChatActions onPin={onPin} />}
          </Text>
          <Text
            variant="body2"
            css={{
              w: "100%",
              mt: "$2",
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
            }}
          >
            <AnnotisedMessage message={message.message} />
          </Text>
        </Text>
      </Box>
    );
  }
);
const VirtualizedChatMessages = ({ messages, setPinnedMessage }) => {
  const listRef = useRef({});
  const rowHeights = useRef({});
  const [topHeight, setTopHeight] = useState(428);
  function getRowHeight(index) {
    return rowHeights.current[index] || 72;
  }

  function setRowHeight(index, size) {
    listRef.current.resetAfterIndex(0);
    rowHeights.current = { ...rowHeights.current, [index]: size };
  }

  function scrollToBottom() {
    if (listRef.current && listRef.current.scrollToItem) {
      listRef.current?.scrollToItem(messages.length - 1, "end");
      requestAnimationFrame(() => {
        listRef.current?.scrollToItem(messages.length - 1, "end");
      });
    }
  }

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
      setTimeout(() => {
        scrollToBottom();
      }, 0);
      const last = Object.keys(rowHeights.current)[
        Object.keys(rowHeights.current).length - 1
      ];
      if (last > 0 && topHeight > 0) {
        setTopHeight(
          topHeight - rowHeights.current[last] <= 0
            ? 0
            : topHeight - rowHeights.current[last]
        );
      }
    }
    // eslint-disable-next-line
  }, [messages]);

  return (
    <div
      style={{
        height: `calc(100% - ${topHeight}px)`,
        display: "block",
        marginTop: "auto",
        marginRight: "-1.45rem",
      }}
    >
      <AutoSizer
        style={{
          width: "100%",
          height: "100%",
          overflow: "none !important",
        }}
      >
        {({ height, width }) => (
          <VariableSizeList
            ref={listRef}
            itemCount={messages.length}
            itemSize={getRowHeight}
            width={width}
            height={height}
          >
            {({ index, style }) => (
              <ChatMessage
                style={style}
                index={index}
                key={messages[index].id}
                message={messages[index]}
                setRowHeight={setRowHeight}
                onPin={() => setPinnedMessage(messages[index])}
              />
            )}
          </VariableSizeList>
        )}
      </AutoSizer>
    </div>
  );
};

export const ChatBody = ({ role, peerId, setPinnedMessage }) => {
  const storeMessageSelector = role
    ? selectMessagesByRole(role)
    : peerId
    ? selectMessagesByPeerID(peerId)
    : selectHMSMessages;
  const messages = useHMSStore(storeMessageSelector) || [];

  if (messages.length === 0) {
    return (
      <Flex
        css={{
          width: "100%",
          height: "calc(100% - 1px)",
          textAlign: "center",
          px: "$4",
        }}
        align="center"
        justify="center"
      >
        <Text>There are no messages here</Text>
      </Flex>
    );
  }

  return (
    <Fragment>
      <VirtualizedChatMessages
        messages={messages}
        setPinnedMessage={setPinnedMessage}
      />
    </Fragment>
  );
};
