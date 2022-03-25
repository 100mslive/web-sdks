import React, { Fragment } from "react";
import {
  selectHMSMessages,
  selectMessagesByPeerID,
  selectMessagesByRole,
  useHMSStore,
} from "@100mslive/react-sdk";
import { Flex, Text } from "@100mslive/react-ui";

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

const MessageType = ({ message }) => {
  if (message.recipientPeer) {
    return (
      <Text variant="sm" css={{ mx: "$4" }}>
        to me
        <Text as="span" variant="sm" css={{ color: "$error", mx: "$4" }}>
          (Privately)
        </Text>
      </Text>
    );
  }

  if (message.recipientRoles?.length) {
    return (
      <Text variant="sm" css={{ mx: "$4" }}>
        to
        <Text as="span" variant="sm" css={{ color: "$error", mx: "$4" }}>
          (Role)
        </Text>
      </Text>
    );
  }
  return (
    <Text variant="sm" css={{ mx: "$4" }}>
      to
      <Text as="span" variant="sm" css={{ color: "$brandDefault", mx: "$4" }}>
        Everyone
      </Text>
    </Text>
  );
};

export const ChatBody = ({ role, peerId }) => {
  const storeMessageSelector = role
    ? selectMessagesByRole(role)
    : peerId
    ? selectMessagesByPeerID(peerId)
    : selectHMSMessages;
  const messages = useHMSStore(storeMessageSelector) || [];

  if (messages.length === 0) {
    return (
      <Flex css={{ size: "100%" }} align="center" justify="center">
        <Text>There are no messages here</Text>
      </Flex>
    );
  }

  return (
    <Fragment>
      {messages.map(message => {
        return (
          <Flex css={{ flexWrap: "wrap", p: "$4 $8" }} key={message.time}>
            <Text variant="sm" css={{ color: "$textSecondary" }}>
              {message.senderName}
            </Text>
            <MessageType message={message} />
            <Text variant="sm" css={{ ml: "auto", color: "$textMedEmp" }}>
              {formatTime(message.time)}
            </Text>
            <Text css={{ w: "100%", my: "$2" }}>{message.message}</Text>
          </Flex>
        );
      })}
    </Fragment>
  );
};
