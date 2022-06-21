import { HandIcon, PersonIcon, ChatIcon } from "@100mslive/react-icons";
import { TextWithIcon } from "../Notifications/TextWithIcon";

export const ToastConfig = {
  ROOM_STATE: {
    single: function (notification) {
      let notificationText = "";
      const { peersAdded, peersRemoved } = notification.data;
      if (peersAdded?.length === 1) {
        notificationText = `${peersAdded[0].name} joined`;
      } else if (peersAdded?.length > 1) {
        notificationText = `${peersAdded[0].name} and ${
          peersAdded.length - 1
        } others joined`;
      }

      if (peersRemoved?.length === 1) {
        notificationText += ` ${peersRemoved[0].name} left`;
      } else if (peersRemoved?.length > 1) {
        notificationText += ` ${peersRemoved[0].name} and ${
          peersRemoved.length - 1
        } others left`;
      }

      if (notificationText) {
        return (
          <TextWithIcon Icon={PersonIcon}>{notificationText}</TextWithIcon>
        );
      }
    },
    multiple: notifications => {
      return (
        <TextWithIcon Icon={PersonIcon}>
          {`${notifications[0].data.name} and ${
            notifications.length - 1
          } others joined`}
        </TextWithIcon>
      );
    },
  },
  PEER_JOINED: {
    single: function (notification) {
      return (
        <TextWithIcon
          Icon={PersonIcon}
        >{`${notification.data?.name} joined`}</TextWithIcon>
      );
    },
    multiple: function (notifications) {
      return (
        <TextWithIcon Icon={PersonIcon}>
          {`${notifications[notifications.length - 1].data.name} and ${
            notifications.length - 1
          } others joined`}
        </TextWithIcon>
      );
    },
  },
  PEER_LEFT: {
    single: function (notification) {
      return (
        <TextWithIcon
          Icon={PersonIcon}
        >{`${notification.data?.name} left`}</TextWithIcon>
      );
    },
    multiple: function (notifications) {
      return (
        <TextWithIcon Icon={PersonIcon}>
          {`${notifications[notifications.length - 1].data.name} and ${
            notifications.length - 1
          } others left`}
        </TextWithIcon>
      );
    },
  },
  METADATA_UPDATED: {
    single: notification => {
      return (
        <TextWithIcon
          Icon={HandIcon}
        >{`${notification.data?.name} raised hand`}</TextWithIcon>
      );
    },
    multiple: notifications => {
      return (
        <TextWithIcon Icon={HandIcon}>
          {`${notifications[notifications.length - 1].data?.name} and ${
            notifications.length - 1
          } others raised hand`}
        </TextWithIcon>
      );
    },
  },
  NEW_MESSAGE: {
    single: notification => {
      return (
        <TextWithIcon
          Icon={ChatIcon}
        >{`New message from ${notification.data?.senderName}`}</TextWithIcon>
      );
    },
    multiple: notifications => {
      return (
        <TextWithIcon Icon={ChatIcon}>
          {`${notifications.length} new messages`}
        </TextWithIcon>
      );
    },
  },
};
