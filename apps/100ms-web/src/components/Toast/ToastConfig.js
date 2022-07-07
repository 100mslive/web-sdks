import { HandIcon, PersonIcon, ChatIcon } from "@100mslive/react-icons";

export const ToastConfig = {
  PEER_LIST: {
    single: function (notification) {
      if (notification.data.length === 1) {
        return {
          title: `${notification.data[0]?.name} joined`,
          icon: PersonIcon,
          close: true,
        };
      }
      return {
        title: `${notification.data[notification.data.length - 1]?.name} and ${
          notification.data.length - 1
        } others joined`,
        icon: PersonIcon,
        close: true,
      };
    },
    multiple: notifications => {
      return {
        title: `${notifications[0].data.name} and ${
          notifications.length - 1
        } others joined`,
        icon: PersonIcon,
        close: true,
      };
    },
  },
  PEER_JOINED: {
    single: function (notification) {
      return {
        title: `${notification.data?.name} joined`,
        icon: PersonIcon,
        close: true,
      };
    },
    multiple: function (notifications) {
      return {
        title: `${notifications[notifications.length - 1].data.name} and ${
          notifications.length - 1
        } others joined`,
        icon: PersonIcon,
        close: true,
      };
    },
  },
  PEER_LEFT: {
    single: function (notification) {
      return {
        title: `${notification.data?.name} left`,
        icon: PersonIcon,
        close: true,
      };
    },
    multiple: function (notifications) {
      return {
        title: `${notifications[notifications.length - 1].data.name} and ${
          notifications.length - 1
        } others left`,
        icon: PersonIcon,
        close: true,
      };
    },
  },
  METADATA_UPDATED: {
    single: notification => {
      return {
        title: `${notification.data?.name} raised hand`,
        icon: HandIcon,
        close: true,
      };
    },
    multiple: notifications => {
      return {
        title: `${notifications[notifications.length - 1].data?.name} and ${
          notifications.length - 1
        } others raised hand`,
        icon: HandIcon,
        close: true,
      };
    },
  },
  NEW_MESSAGE: {
    single: notification => {
      return {
        title: `New message from ${notification.data?.senderName}`,
        icon: ChatIcon,
        close: true,
      };
    },
    multiple: notifications => {
      return {
        title: `${notifications.length} new messages`,
        icon: ChatIcon,
        close: true,
      };
    },
  },
};
