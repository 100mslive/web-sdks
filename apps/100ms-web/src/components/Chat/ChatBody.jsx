import React, { Fragment, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import {
  selectHMSMessages,
  selectLocalPeerID,
  selectMessagesByPeerID,
  selectMessagesByRole,
  selectPeerNameByID,
  useHMSActions,
  useHMSStore,
} from "@100mslive/react-sdk";
import { Box, Flex, styled, Text } from "@100mslive/react-ui";

const formatTime = date => {
  if (!(date instanceof Date)) {
    return "";
  }
  let hours = date.getHours();
  let mins = date.getMinutes();
  if (hours < 10) {
    hours = "0" + hours;
  }
  if (mins < 10) {
    mins = "0" + mins;
  }
  return `${hours}:${mins}`;
};

const TypeContainer = ({ left, right }) => {
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
        <Text variant="tiny" as="span" css={{ color: "$textMedEmp" }}>
          {left}
        </Text>
      )}
      {left && right && (
        <Box
          css={{ borderLeft: "1px solid $textDisabled", mx: "$4", h: "100%" }}
        />
      )}
      {right && (
        <Text as="span" variant="tiny">
          {right}
        </Text>
      )}
    </Flex>
  );
};

const MessageType = ({ roles, hasCurrentUserSent, receiver }) => {
  const peerName = useHMSStore(selectPeerNameByID(receiver));
  if (receiver) {
    return (
      <TypeContainer
        left={
          hasCurrentUserSent ? `${peerName ? `TO ${peerName}` : ""}` : "To YOU"
        }
        right="PRIVATE"
      />
    );
  }

  if (roles && roles.length) {
    return <TypeContainer left="TO" right={roles.join(",")} />;
  }
  return null;
};

const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

const Link = styled("a", {
  color: "$brandDefault",
  wordBreak: "break-all",
  "&:hover": {
    textDecoration: "underline",
  },
});

const AnnotisedChat = ({ message }) => {
  if (!message) {
    return <Fragment />;
  }

  return (
    <Fragment>
      {message
        .trim()
        .split(" ")
        .map(part =>
          URL_REGEX.test(part) ? (
            <Link
              href={part}
              key={part}
              target="_blank"
              rel="noopener noreferrer"
            >
              {part}{" "}
            </Link>
          ) : (
            `${part} `
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

const ChatMessage = React.memo(({ message }) => {
  const { ref, inView } = useInView({ threshold: 0.5, triggerOnce: true });
  const hmsActions = useHMSActions();
  const localPeerId = useHMSStore(selectLocalPeerID);
  const messageType = getMessageType({
    roles: message.recipientRoles,
    receiver: message.recipientPeer,
  });

  useEffect(() => {
    if (message.id && !message.read && inView) {
      hmsActions.setMessageRead(true, message.id);
    }
  }, [message.read, hmsActions, inView, message.id]);

  return (
    <Flex
      ref={ref}
      css={{
        flexWrap: "wrap",
        bg: messageType ? "$surfaceLight" : undefined,
        px: "$2",
        py: "$4",
        mb: "$8",
      }}
      key={message.time}
      data-testid="chat_msg"
    >
      <Text css={{ color: "$textHighEmp", fontWeight: "$semiBold" }}>
        {message.senderName || "Anonymous"}
      </Text>
      <Text variant="sm" css={{ ml: "$4", color: "$textSecondary" }}>
        {formatTime(message.time)}
      </Text>
      <MessageType
        hasCurrentUserSent={message.sender === localPeerId}
        receiver={message.recipientPeer}
        roles={message.recipientRoles}
      />
      <Text
        variant="body2"
        css={{ w: "100%", my: "$2", wordBreak: "break-word" }}
      >
        <AnnotisedChat message={message.message} />
      </Text>
    </Flex>
  );
});

export const ChatBody = ({ role, peerId }) => {
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
      {messages.map(message => {
        return <ChatMessage key={message.id} message={message} />;
      })}
    </Fragment>
  );
};
