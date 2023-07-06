import React from 'react';
import { AlertOctagonIcon, ChatIcon, ExitIcon, HandIcon, PersonIcon } from '@100mslive/react-icons';
import { Box } from '../../../';
import SwitchWithLabel from './SwitchWithLabel';
import { useSetSubscribedNotifications, useSubscribedNotifications } from '../AppData/useUISettings';
import { settingOverflow } from './common.js';
import { SUBSCRIBED_NOTIFICATIONS } from '../../common/constants';

const NotificationItem = ({ type, label, icon, checked }) => {
  const [, setSubscribedNotifications] = useSetSubscribedNotifications(type);
  return (
    <SwitchWithLabel
      label={label}
      id={type}
      icon={icon}
      checked={checked}
      onChange={value => {
        setSubscribedNotifications(value);
      }}
    />
  );
};

export const NotificationSettings = () => {
  const subscribedNotifications = useSubscribedNotifications();

  return (
    <Box className={settingOverflow()}>
      <NotificationItem
        label="Peer Joined"
        type={SUBSCRIBED_NOTIFICATIONS.PEER_JOINED}
        icon={<PersonIcon />}
        checked={subscribedNotifications.PEER_JOINED}
      />
      <NotificationItem
        label="Peer Leave"
        type={SUBSCRIBED_NOTIFICATIONS.PEER_LEFT}
        icon={<ExitIcon />}
        checked={subscribedNotifications.PEER_LEFT}
      />
      <NotificationItem
        label="New Message"
        type={SUBSCRIBED_NOTIFICATIONS.NEW_MESSAGE}
        icon={<ChatIcon />}
        checked={subscribedNotifications.NEW_MESSAGE}
      />
      <NotificationItem
        label="Hand Raised"
        type={SUBSCRIBED_NOTIFICATIONS.METADATA_UPDATED}
        icon={<HandIcon />}
        checked={subscribedNotifications.METADATA_UPDATED}
      />
      <NotificationItem
        label="alert_error_default"
        type={SUBSCRIBED_NOTIFICATIONS.alert_error_default}
        icon={<AlertOctagonIcon />}
        checked={subscribedNotifications.alert_error_default}
      />
    </Box>
  );
};
