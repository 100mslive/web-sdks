import { forwardRef, useCallback } from 'react';
import { selectPeerByID, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import {
  ChatUnreadIcon,
  ConnectivityIcon,
  HandIcon,
  PeopleAddIcon,
  PeopleRemoveIcon,
  PoorConnectivityIcon,
} from '@100mslive/react-icons';
import { Button } from '../../../Button';
import { useRoomLayout } from '../../provider/roomLayoutProvider';
import { useIsSidepaneTypeOpen, useSidepaneToggle } from '../AppData/useSidepane';
import { SIDE_PANE_OPTIONS } from '../../common/constants';

const ChatAction = forwardRef((_, ref) => {
  const toggleChat = useSidepaneToggle(SIDE_PANE_OPTIONS.CHAT);
  const isChatOpen = useIsSidepaneTypeOpen(SIDE_PANE_OPTIONS.CHAT);

  if (isChatOpen) {
    return null;
  }

  return (
    <Button outlined as="div" variant="standard" css={{ w: 'max-content' }} onClick={toggleChat} ref={ref}>
      Open Chat
    </Button>
  );
});

const HandRaiseAction = forwardRef(({ id = '', isSingleHandRaise = true }, ref) => {
  const hmsActions = useHMSActions();
  const toggleSidepane = useSidepaneToggle(SIDE_PANE_OPTIONS.PARTICIPANTS);
  const isParticipantsOpen = useIsSidepaneTypeOpen(SIDE_PANE_OPTIONS.PARTICIPANTS);
  const peer = useHMSStore(selectPeerByID(id));
  const layout = useRoomLayout();
  const {
    bring_to_stage_label,
    on_stage_role,
    off_stage_roles = [],
    skip_preview_for_role_change = false,
  } = layout?.screens?.conferencing?.default?.elements.on_stage_exp || {};

  const onClickHandler = useCallback(async () => {
    if (isSingleHandRaise) {
      hmsActions.changeRoleOfPeer(id, on_stage_role, skip_preview_for_role_change);
      if (skip_preview_for_role_change) {
        await hmsActions.lowerRemotePeerHand(id);
      }
    } else {
      !isParticipantsOpen && toggleSidepane();
    }
  }, [
    hmsActions,
    id,
    isParticipantsOpen,
    isSingleHandRaise,
    on_stage_role,
    toggleSidepane,
    skip_preview_for_role_change,
  ]);

  // show nothing if handRaise is single and peer role is not hls
  if (isSingleHandRaise && (!peer || !off_stage_roles.includes(peer.roleName))) {
    return null;
  }
  return (
    <Button outlined as="div" variant="standard" css={{ w: 'max-content' }} onClick={onClickHandler} ref={ref}>
      {isSingleHandRaise ? bring_to_stage_label : 'View'}
    </Button>
  );
});

export const ToastConfig = {
  PEER_JOINED: {
    single: function (notification) {
      return {
        title: `${notification.data?.name} joined`,
        icon: <PeopleAddIcon />,
      };
    },
    multiple: function (notifications) {
      return {
        title: `${notifications[notifications.length - 1].data.name} and ${notifications.length - 1} others joined`,
        icon: <PeopleAddIcon />,
      };
    },
  },
  PEER_LEFT: {
    single: function (notification) {
      return {
        title: `${notification.data?.name} left`,
        icon: <PeopleRemoveIcon />,
      };
    },
    multiple: function (notifications) {
      return {
        title: `${notifications[notifications.length - 1].data.name} and ${notifications.length - 1} others left`,
        icon: <PeopleRemoveIcon />,
      };
    },
  },
  RAISE_HAND: {
    single: notification => {
      return {
        title: `${notification.data?.name} raised hand`,
        icon: <HandIcon />,
      };
    },
    multiple: notifications => {
      const count = new Set(notifications.map(notification => notification.data?.id)).size;
      return {
        title: `${notifications[notifications.length - 1].data?.name} ${
          count > 1 ? `and ${count} others` : ''
        } raised hand`,
        icon: <HandIcon />,
      };
    },
  },
  RAISE_HAND_HLS: {
    single: notification => {
      return {
        title: `${notification.data?.name} raised hand`,
        icon: <HandIcon />,
        action: <HandRaiseAction id={notification.data?.id} />,
      };
    },
    multiple: notifications => {
      const count = new Set(notifications.map(notification => notification.data?.id)).size;
      return {
        title: `${notifications[notifications.length - 1].data?.name} ${
          count > 1 ? `and ${count} others` : ''
        } raised hand`,
        icon: <HandIcon />,
        action: <HandRaiseAction isSingleHandRaise={false} />,
      };
    },
  },
  NEW_MESSAGE: {
    single: notification => {
      return {
        title: `New message from ${notification.data?.senderName}`,
        icon: <ChatUnreadIcon />,
        action: <ChatAction />,
      };
    },
    multiple: notifications => {
      return {
        title: `${notifications.length} new messages`,
        icon: <ChatUnreadIcon />,
        action: <ChatAction />,
      };
    },
  },
  RECONNECTED: {
    single: online => {
      return {
        title: `You are now ${online ? 'online' : 'connected'}`,
        icon: <ConnectivityIcon />,
        variant: 'success',
        duration: 3000,
      };
    },
  },
  RECONNECTING: {
    single: message => {
      return {
        title: `You are offline for now. while we try to reconnect, please check
        your internet connection. ${message}.
      `,
        icon: <PoorConnectivityIcon />,
        variant: 'warning',
        duration: 30000,
      };
    },
  },
};
