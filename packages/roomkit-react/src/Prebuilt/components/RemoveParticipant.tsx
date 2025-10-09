import { HMSPeerID, selectLocalPeerID, selectPermissions, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { PeopleRemoveIcon } from '@100mslive/react-icons';
// @ts-ignore: No implicit Any
import { ToastManager } from './Toast/ToastManager';
import { Dropdown } from '../../Dropdown';
import { Text } from '../../Text';

export const RemoveParticipant = ({ peerId }: { peerId: HMSPeerID }) => {
  const canRemoveOthers = useHMSStore(selectPermissions)?.removeOthers;
  const localPeerId = useHMSStore(selectLocalPeerID);
  const actions = useHMSActions();

  if (peerId === localPeerId || !canRemoveOthers) {
    return null;
  }
  return (
    <Dropdown.Item
      css={{ color: '$alert_error_default', bg: '$surface_default' }}
      onClick={async () => {
        try {
          await actions.removePeer(peerId, '');
        } catch (error) {
          const ex = error as Error;
          ToastManager.addToast({ title: ex.message, variant: 'error' });
        }
      }}
    >
      <PeopleRemoveIcon />
      <Text variant="sm" css={{ ml: '$4', color: 'inherit', fontWeight: '$semiBold' }}>
        Remove Participant
      </Text>
    </Dropdown.Item>
  );
};
