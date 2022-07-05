import React, { useContext } from "react";
import { Flex, Label, Box, Switch } from "@100mslive/react-ui";
import { AppContext } from "../context/AppContext";
import {
  AlertOctagonIcon,
  ChatIcon,
  ExitIcon,
  HandIcon,
  PersonIcon,
} from "@100mslive/react-icons";

const NotificationItem = ({ onClick, type, label, icon, checked }) => {
  return (
    <Flex
      align="center"
      key={type}
      css={{
        my: "$2",
        py: "$8",
        w: "100%",
        borderBottom: "1px solid $borderDefault",
      }}
    >
      <Label
        htmlFor={label}
        css={{
          ml: "$4",
          fontSize: "$md",
          fontWeight: "$semiBold",
          color: checked ? "$textHighEmp" : "$textDisabled",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "$8",
        }}
      >
        {icon}
        {label}
      </Label>
      <Switch
        css={{ ml: "auto" }}
        id={label}
        checked={checked}
        onCheckedChange={value => {
          onClick({
            type,
            isSubscribed: value,
          });
        }}
      />
    </Flex>
  );
};

export const NotificationSettings = () => {
  const { subscribedNotifications, setSubscribedNotifications } =
    useContext(AppContext);

  return (
    <Box>
      <NotificationItem
        label="Peer Joined"
        type="PEER_JOINED"
        icon={<PersonIcon />}
        onClick={setSubscribedNotifications}
        checked={subscribedNotifications.PEER_JOINED}
      />
      <NotificationItem
        label="Peer Leave"
        type="PEER_LEFT"
        icon={<ExitIcon />}
        onClick={setSubscribedNotifications}
        checked={subscribedNotifications.PEER_LEFT}
      />
      <NotificationItem
        label="New Message"
        type="NEW_MESSAGE"
        icon={<ChatIcon />}
        onClick={setSubscribedNotifications}
        checked={subscribedNotifications.NEW_MESSAGE}
      />
      <NotificationItem
        label="Hand Raised"
        type="METADATA_UPDATED"
        icon={<HandIcon />}
        onClick={setSubscribedNotifications}
        checked={subscribedNotifications.METADATA_UPDATED}
      />
      <NotificationItem
        label="Error"
        type="ERROR"
        icon={<AlertOctagonIcon />}
        onClick={setSubscribedNotifications}
        checked={subscribedNotifications.ERROR}
      />
    </Box>
  );
};
