import React, { useCallback, useState } from 'react';
import { HMSMessage, selectLocalPeerName, selectPermissions, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import {
  CopyIcon,
  CrossCircleIcon,
  CrossIcon,
  EyeCloseIcon,
  PeopleRemoveIcon,
  PinIcon,
  ReplyGroupIcon,
  ReplyIcon,
  VerticalMenuIcon,
} from '@100mslive/react-icons';
import { Dropdown } from '../../../Dropdown';
import { IconButton } from '../../../IconButton';
import { Flex } from '../../../Layout';
import { Sheet } from '../../../Sheet';
import { Text } from '../../../Text';
import { Tooltip } from '../../../Tooltip';
// @ts-ignore
import { ToastManager } from '../Toast/ToastManager';
import { MwebChatOption } from './MwebChatOption';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { useChatBlacklist, useIsPeerBlacklisted } from '../hooks/useChatBlacklist';
import { usePinnedMessages } from '../hooks/usePinnedMessages';
import { SESSION_STORE_KEY } from '../../common/constants';

const iconStyle = { height: '1.125rem', width: '1.125rem' };
const tooltipBoxCSS = {
  fontSize: '$xs',
  backgroundColor: '$surface_default',
  p: '$1 $5',
  fontWeight: '$regular',
  borderRadius: '$3',
};

export const ChatActions = ({
  showPinAction,
  onReply,
  onReplyGroup,
  showReply,
  message,
  sentByLocalPeer,
  isMobile,
  openSheet,
  setOpenSheet,
}: {
  showPinAction: boolean;
  onReply: () => void;
  onReplyGroup: () => void;
  showReply: boolean;
  message: HMSMessage;
  sentByLocalPeer: boolean;
  isMobile: boolean;
  openSheet: boolean;
  setOpenSheet: (value: boolean, e?: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}) => {
  const { elements } = useRoomLayoutConferencingScreen();
  const { can_hide_message = false, can_block_user = false } = elements?.chat?.real_time_controls || {};
  const { roles_whitelist = [] } = elements?.chat || {};

  const [open, setOpen] = useState(false);
  const actions = useHMSActions();
  const canRemoveOthers = useHMSStore(selectPermissions)?.removeOthers;
  const { blacklistItem: blacklistPeer } = useChatBlacklist(SESSION_STORE_KEY.CHAT_PEER_BLACKLIST);
  const localPeerName = useHMSStore(selectLocalPeerName);
  const { setPinnedMessages, unpinBlacklistedMessages } = usePinnedMessages();

  const { blacklistItem: blacklistMessage, blacklistedIDs: blacklistedMessageIDs } = useChatBlacklist(
    SESSION_STORE_KEY.CHAT_MESSAGE_BLACKLIST,
  );

  const isSenderBlocked = useIsPeerBlacklisted({ peerCustomerUserId: message.senderUserId });

  const updatePinnedMessages = useCallback(
    (messageID = '') => {
      const blacklistedMessageIDSet = new Set([...(blacklistedMessageIDs || []), messageID]);
      unpinBlacklistedMessages(blacklistedMessageIDSet);
    },
    [blacklistedMessageIDs, unpinBlacklistedMessages],
  );

  const copyMessageContent = useCallback(() => {
    try {
      navigator?.clipboard.writeText(message.message);
      ToastManager.addToast({
        title: 'Message copied successfully',
      });
    } catch (e) {
      console.log(e);
      ToastManager.addToast({
        title: 'Could not copy message',
      });
    }
  }, [message]);

  const options: Record<
    string,
    {
      text: string;
      tooltipText?: string;
      icon: React.ReactNode;
      onClick: () => void | Promise<void>;
      show: boolean;
      color?: string;
    }
  > = {
    reply: {
      text: 'Reply privately',
      tooltipText: 'Reply privately',
      icon: <ReplyIcon style={iconStyle} />,
      onClick: onReply,
      show: showReply,
    },
    replyGroup: {
      text: 'Reply to group',
      tooltipText: 'Reply to group',
      icon: <ReplyGroupIcon style={iconStyle} />,
      onClick: onReplyGroup,
      show: !!message.senderRole && roles_whitelist.includes(message.senderRole),
    },
    pin: {
      text: 'Pin message',
      tooltipText: 'Pin',
      icon: <PinIcon style={iconStyle} />,
      onClick: () => setPinnedMessages(message, localPeerName || ''),
      show: showPinAction,
    },
    copy: {
      text: 'Copy text',
      tooltipText: 'Copy',
      icon: <CopyIcon style={iconStyle} />,
      onClick: copyMessageContent,
      show: true,
    },
    hide: {
      text: message.recipientPeer ? 'Hide for both' : 'Hide for everyone',
      icon: <EyeCloseIcon style={iconStyle} />,
      onClick: async () => {
        blacklistMessage(message.id);
        updatePinnedMessages(message.id);
      },
      show: !!can_hide_message,
    },
    block: {
      text: 'Block from chat',
      icon: <CrossCircleIcon style={iconStyle} />,
      onClick: async () => {
        if (message.senderUserId) {
          blacklistPeer(message.senderUserId);
        }
      },
      color: '$alert_error_default',
      show: !!can_block_user && !sentByLocalPeer && !isSenderBlocked,
    },
    remove: {
      text: 'Remove participant',
      icon: <PeopleRemoveIcon style={iconStyle} />,
      color: '$alert_error_default',
      show: !!canRemoveOthers && !sentByLocalPeer,
      onClick: async () => {
        if (!message.sender) {
          return;
        }
        try {
          await actions.removePeer(message.sender, '');
        } catch (error) {
          ToastManager.addToast({ title: (error as Error).message, variant: 'error' });
        }
      },
    },
  };

  if (isMobile) {
    return (
      <Sheet.Root open={openSheet} onOpenChange={setOpenSheet}>
        <Sheet.Content
          style={{ bg: '$surface_default', pb: '$14' }}
          onClick={(e: React.MouseEvent) => setOpenSheet(false, e as any)}
        >
          <Sheet.Title
            css={{
              display: 'flex',
              color: '$on_surface_high',
              w: '100%',
              justifyContent: 'space-between',
              mt: '$8',
              fontSize: '$md',
              px: '$10',
              pb: '$8',
              borderBottom: '1px solid $border_bright',
              alignItems: 'center',
            }}
          >
            Message options
            <Sheet.Close
              css={{ color: '$on_surface_high' }}
              onClick={(e: React.MouseEvent) => setOpenSheet(false, e as any)}
            >
              <CrossIcon />
            </Sheet.Close>
          </Sheet.Title>

          {Object.keys(options).map(optionKey => {
            const option = options[optionKey];
            return option.show ? (
              <MwebChatOption
                key={optionKey}
                text={option.text}
                icon={option.icon}
                onClick={option.onClick}
                color={option?.color}
              />
            ) : null;
          })}
        </Sheet.Content>
      </Sheet.Root>
    );
  }

  return (
    <Dropdown.Root open={open} onOpenChange={setOpen} css={{ '@md': { display: 'none' } }}>
      <Flex
        className="chat_actions"
        css={{
          background: '$surface_bright',
          borderRadius: '$1',
          p: '$2',
          opacity: open ? 1 : 0,
          position: 'absolute',
          top: 0,
          right: 0,
          zIndex: 1,
          '@md': { opacity: 1 },
        }}
      >
        {options.reply.show ? (
          <Tooltip boxStyle={tooltipBoxCSS} title={options.reply.tooltipText}>
            <IconButton data-testid="reply_message_btn" onClick={options.reply.onClick}>
              {options.reply.icon}
            </IconButton>
          </Tooltip>
        ) : null}
        {options.replyGroup.show ? (
          <Tooltip boxStyle={tooltipBoxCSS} title={options.replyGroup.tooltipText}>
            <IconButton data-testid="reply_group_message_btn" onClick={options.replyGroup.onClick}>
              {options.replyGroup.icon}
            </IconButton>
          </Tooltip>
        ) : null}
        {options.pin.show ? (
          <Tooltip boxStyle={tooltipBoxCSS} title={options.pin.tooltipText}>
            <IconButton data-testid="pin_message_btn" onClick={options.pin.onClick}>
              {options.pin.icon}
            </IconButton>
          </Tooltip>
        ) : null}

        {options.copy.show ? (
          <Tooltip boxStyle={tooltipBoxCSS} title={options.copy.tooltipText}>
            <IconButton onClick={options.copy.onClick} data-testid="copy_message_btn">
              <CopyIcon style={iconStyle} />
            </IconButton>
          </Tooltip>
        ) : null}

        {options.block.show || options.hide.show || options.remove.show ? (
          <Tooltip boxStyle={tooltipBoxCSS} title="More actions">
            <Dropdown.Trigger asChild>
              <IconButton>
                <VerticalMenuIcon style={iconStyle} />
              </IconButton>
            </Dropdown.Trigger>
          </Tooltip>
        ) : null}
      </Flex>
      <Dropdown.Portal>
        <Dropdown.Content
          sideOffset={5}
          align="end"
          css={{ width: '$48', backgroundColor: '$surface_bright', py: '$0', border: '1px solid $border_bright' }}
        >
          {options.hide.show ? (
            <Dropdown.Item data-testid="hide_message_btn" onClick={options.hide.onClick}>
              {options.hide.icon}
              <Text variant="sm" css={{ ml: '$4', fontWeight: '$semiBold' }}>
                {options.hide.text}
              </Text>
            </Dropdown.Item>
          ) : null}

          {options.block.show ? (
            <Dropdown.Item
              data-testid="block_peer_btn"
              onClick={options.block.onClick}
              css={{ color: options.block.color }}
            >
              {options.block.icon}
              <Text variant="sm" css={{ ml: '$4', color: 'inherit', fontWeight: '$semiBold' }}>
                {options.block.text}
              </Text>
            </Dropdown.Item>
          ) : null}
          {options.remove.show ? (
            <Dropdown.Item
              data-testid="remove_peer_btn"
              onClick={options.remove.onClick}
              css={{ color: options.remove.color }}
            >
              {options.remove.icon}
              <Text variant="sm" css={{ ml: '$4', color: 'inherit', fontWeight: '$semiBold' }}>
                {options.remove.text}
              </Text>
            </Dropdown.Item>
          ) : null}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
};
