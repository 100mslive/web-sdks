import React from "react";
import {
  AlertOctagonIcon,
  ChatIcon,
  ExitIcon,
  HandIcon,
  PersonIcon,
} from "@100mslive/react-icons";
import { Box } from "@100mslive/react-ui";
import SwitchWithLabel from "./SwitchWithLabel";
import { useSetSubscribedNotifications } from "../AppData/useUISettings";
import { SUBSCRIBED_NOTIFICATIONS } from "../../common/constants";

const NotificationItem = ({ onChange, type, label, icon, checked }) => {
  return (
    <SwitchWithLabel
      label={label}
      id={type}
      icon={icon}
      checked={checked}
      onChange={value => {
        onChange(value, type);
      }}
    />
  );
};

export const NotificationSettings = () => {
  const [subscribedNotifications, setSubscribedNotifications] =
    useSetSubscribedNotifications();

  return (
    <Box>
      <NotificationItem
        label="Peer Joined"
        type={SUBSCRIBED_NOTIFICATIONS.PEER_JOINED}
        icon={<PersonIcon />}
        onChange={setSubscribedNotifications}
        checked={subscribedNotifications.PEER_JOINED}
      />
      <NotificationItem
        label="Peer Leave"
        type={SUBSCRIBED_NOTIFICATIONS.PEER_LEFT}
        icon={<ExitIcon />}
        onChange={setSubscribedNotifications}
        checked={subscribedNotifications.PEER_LEFT}
      />
      <NotificationItem
        label="New Message"
        type={SUBSCRIBED_NOTIFICATIONS.NEW_MESSAGE}
        icon={<ChatIcon />}
        onChange={setSubscribedNotifications}
        checked={subscribedNotifications.NEW_MESSAGE}
      />
      <NotificationItem
        label="Hand Raised"
        type={SUBSCRIBED_NOTIFICATIONS.METADATA_UPDATED}
        icon={<HandIcon />}
        onChange={setSubscribedNotifications}
        checked={subscribedNotifications.METADATA_UPDATED}
      />
      <NotificationItem
        label="Error"
        type={SUBSCRIBED_NOTIFICATIONS.ERROR}
        icon={<AlertOctagonIcon />}
        onChange={setSubscribedNotifications}
        checked={subscribedNotifications.ERROR}
      />
    </Box>
  );
};
