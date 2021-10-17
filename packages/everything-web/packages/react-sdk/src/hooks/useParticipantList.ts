import { HMSPeer, selectAvailableRoleNames, selectIsLocalAudioEnabled, selectLocalPeerRole, selectPeers, selectPermissions } from '@100mslive/hms-video-store';
import { ChangeEventHandler, useState } from 'react'
import { useHMSActions, useHMSStore } from '../hooks/HmsRoomProvider';
import { groupBy } from '../utils/groupBy';

const useParticipantList = () => {
  const participantList = useHMSStore(selectPeers);
  const roleNames = useHMSStore(selectAvailableRoleNames);
  const roles = groupBy(participantList);
  const actions = useHMSActions();
  const localPeerRole = useHMSStore(selectLocalPeerRole);
  const [selectedPeer, setSelectedPeer] = useState<HMSPeer | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [forceChange, setForceChange] = useState(false);
  const permissions = useHMSStore(selectPermissions);
  const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled)

  const handleRoleChangeClose = () => {
    setSelectedPeer(null);
    setForceChange(false);
  };

  const handleInputChange: ChangeEventHandler<any> = event => {
    setSelectedRole(event.currentTarget.value);
  };

  const handleSaveSettings = async () => {
    if (
      !selectedPeer ||
      !selectedRole ||
      !localPeerRole?.permissions?.changeRole
    ) {
      return;
    }

    if (selectedPeer.roleName !== selectedRole) {
      try {
        await actions.changeRole(selectedPeer.id, selectedRole, forceChange);
      } catch (error) {
        console.error('Error')
      }
    }

    setSelectedPeer(null);
    setForceChange(false);
  };

  const disabled = !localPeerRole?.permissions?.changeRole
  const checkboxDisabled = !selectedPeer ||
  !selectedRole ||
  selectedRole === selectedPeer.roleName
  return {
    selectedPeer,
    handleRoleChangeClose,
    selectedRole,
    handleInputChange,
    disabled,
    roleNames,
    setForceChange,
    checkboxDisabled,
    handleSaveSettings,
    roles,
    permissions,
    isLocalAudioEnabled
  }
}

export default useParticipantList
