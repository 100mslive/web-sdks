import { HandIcon, PersonIcon } from "@100mslive/react-icons";
import { TextWithIcon } from "../Notifications/TextWithIcon";

export const ToastConfig = {
  PEER_JOINED: {
    single: toast => {
      return (
        <TextWithIcon Icon={PersonIcon}>{`${toast.name} joined`}</TextWithIcon>
      );
    },
    multiple: toast => {
      return (
        <TextWithIcon Icon={PersonIcon}>
          {`${toast.name} and ${toast.count} others joined`}
        </TextWithIcon>
      );
    },
  },
  PEER_LIST: {
    single: toast => {
      return (
        <TextWithIcon Icon={PersonIcon}>{`${toast.name} joined`}</TextWithIcon>
      );
    },
    multiple: toast => {
      return (
        <TextWithIcon Icon={PersonIcon}>
          {`${toast.name} and ${toast.count} others joined`}
        </TextWithIcon>
      );
    },
  },
  PEER_LEFT: {
    single: toast => {
      return (
        <TextWithIcon Icon={PersonIcon}>{`${toast.name} left`}</TextWithIcon>
      );
    },
    multiple: toast => {
      return (
        <TextWithIcon Icon={PersonIcon}>
          {`${toast.name} and ${toast.count} others left`}
        </TextWithIcon>
      );
    },
  },
  METADATA_UPDATED: {
    single: toast => {
      return (
        <TextWithIcon
          Icon={HandIcon}
        >{`${toast.name} raised hand`}</TextWithIcon>
      );
    },
    multiple: toast => {
      return (
        <TextWithIcon Icon={HandIcon}>
          {`${toast.name} and ${toast.count} others raised hand`}
        </TextWithIcon>
      );
    },
  },
  NEW_MESSAGE: {
    single: toast => {
      return (
        <TextWithIcon
          Icon={HandIcon}
        >{`New message from ${toast.name}`}</TextWithIcon>
      );
    },
    multiple: toast => {
      return (
        <TextWithIcon Icon={HandIcon}>
          {`${toast.count} new messages`}
        </TextWithIcon>
      );
    },
  },
};
