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
          {`${toast.name} and ${toast.count} others joined`};
        </TextWithIcon>
      );
    },
  },
  METADATA_UPDATED: {
    single: toast => {
      return (
        <TextWithIcon Icon={HandIcon}>{`${toast.name} joined`}</TextWithIcon>
      );
    },
    multiple: toast => {
      return (
        <TextWithIcon Icon={HandIcon}>
          {`${toast.name} and ${toast.count} others joined`};
        </TextWithIcon>
      );
    },
  },
  NEW_MESSAGE: {
    single: toast => {
      return (
        <TextWithIcon Icon={HandIcon}>{`${toast.name} joined`}</TextWithIcon>
      );
    },
    multiple: toast => {
      return (
        <TextWithIcon Icon={HandIcon}>
          {`${toast.name} and ${toast.count} others joined`};
        </TextWithIcon>
      );
    },
  },
};
