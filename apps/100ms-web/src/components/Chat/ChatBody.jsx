import React, { Fragment } from "react";
import {
  selectBroadcastMessages,
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

export const ChatBody = ({ role, peerId }) => {
  const storeMessageSelector = role
    ? selectMessagesByRole(role)
    : peerId
    ? selectMessagesByPeerID(peerId)
    : selectBroadcastMessages;
  const messages = useHMSStore(storeMessageSelector) || [];

  return (
    <Fragment>
      {messages.map(message => {
        return (
          <Flex css={{ flexWrap: "wrap", p: "$8" }} key={message.time}>
            <Text variant="sm" css={{ color: "$textMedEmp" }}>
              {message.senderName}
            </Text>
            <Text variant="sm" css={{ ml: "auto", color: "$textMedEmp" }}>
              {formatTime(message.time)}
            </Text>
            <Text css={{ w: "100%" }}>{message.message}</Text>
          </Flex>
        );
      })}
    </Fragment>
  );
};
