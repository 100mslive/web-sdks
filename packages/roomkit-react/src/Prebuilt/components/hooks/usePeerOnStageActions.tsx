import { useState } from 'react';
import { selectPeerMetadata, selectPermissions, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';

export const usePeerOnStageActions = ({ peerId, role }: { peerId: string; role: string }) => {
  const hmsActions = useHMSActions();
  const { elements } = useRoomLayoutConferencingScreen();
  const {
    bring_to_stage_label,
    remove_from_stage_label,
    on_stage_role,
    off_stage_roles = [],
    skip_preview_for_role_change = false,
  } = elements.on_stage_exp || {};
  const isInStage = role === on_stage_role;
  const canChangeRole = useHMSStore(selectPermissions)?.changeRole;
  const shouldShowStageRoleChange =
    canChangeRole &&
    ((isInStage && remove_from_stage_label) || (off_stage_roles?.includes(role) && bring_to_stage_label));
  const prevRole = useHMSStore(selectPeerMetadata(peerId))?.prevRole;
  const [open, setOpen] = useState(false);

  const lowerPeerHand = async () => {
    await hmsActions.lowerRemotePeerHand(peerId);
  };

  const handleStageAction = async () => {
    if (isInStage) {
      prevRole && hmsActions.changeRoleOfPeer(peerId, prevRole, true);
    } else if (on_stage_role) {
      await hmsActions.changeRoleOfPeer(peerId, on_stage_role, skip_preview_for_role_change);
      if (skip_preview_for_role_change) {
        await lowerPeerHand();
      }
    }
    setOpen(false);
  };

  return {
    open,
    setOpen,
    lowerPeerHand,
    handleStageAction,
    shouldShowStageRoleChange,
    isInStage,
    bring_to_stage_label,
    remove_from_stage_label,
  };
};
