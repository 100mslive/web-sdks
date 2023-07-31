import { SettingsIcon, NotificationsIcon, GridFourIcon } from '@100mslive/react-icons';
import DeviceSettings from '../Settings/DeviceSettings';
import { LayoutSettings } from '../Settings/LayoutSettings';
import { NotificationSettings } from '../Settings/NotificationSettings';
import { css } from '../../..';

export const settingOverflow = css({
  flex: '1 1 0',
  pr: '$12',
  mr: '-$12',
  overflowY: 'auto',
});

export const settingContent = css({
  display: 'flex',
  flexDirection: 'column',
  '&[hidden]': {
    display: 'none',
  },
});

export const settingsList = [
  {
    tabName: 'devices',
    title: 'Device Settings',
    icon: SettingsIcon,
    content: DeviceSettings,
  },
  {
    tabName: 'notifications',
    title: 'Notifications',
    icon: NotificationsIcon,
    content: NotificationSettings,
  },
  {
    tabName: 'layout',
    title: 'Layout',
    icon: GridFourIcon,
    content: LayoutSettings,
  },
];
