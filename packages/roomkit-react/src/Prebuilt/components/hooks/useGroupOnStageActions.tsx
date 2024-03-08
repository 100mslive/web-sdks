import { match, P } from 'ts-pattern';
import { HMSPeer, selectPermissions, useHMSActions, useHMSStore } from '@100mslive/react-sdk';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';

export const useGroupOnStageActions = ({ peers }: { peers: HMSPeer[] }) => {
  const hmsActions = useHMSActions();
  const { elements } = useRoomLayoutConferencingScreen();
  const {
    bring_to_stage_label,
    remove_from_stage_label,
    on_stage_role,
    off_stage_roles = [],
    skip_preview_for_role_change = false,
  } = elements.on_stage_exp || {};
  const canChangeRole = useHMSStore(selectPermissions)?.changeRole;

  const offStageRolePeers = peers.filter(peer =>
    match({ on_stage_role, bring_to_stage_label, roleName: peer.roleName })
      .with(
        {
          on_stage_role: P.when(role => !!role),
          bring_to_stage_label: P.when(label => !!label),
          roleName: P.when(role => !!role && off_stage_roles.includes(role)),
        },
        () => true,
      )
      .otherwise(() => false),
  );

  const lowerAllHands = async () => {
    return Promise.all(peers.map(peer => hmsActions.lowerRemotePeerHand(peer.id)));
  };

  const bringAllToStage = () => {
    if (!canChangeRole || !on_stage_role) {
      return;
    }
    return Promise.all(
      offStageRolePeers.map(peer => {
        return hmsActions.changeRoleOfPeer(peer.id, on_stage_role, skip_preview_for_role_change).then(() => {
          return skip_preview_for_role_change ? hmsActions.lowerRemotePeerHand(peer.id) : null;
        });
      }),
    );
  };

  return {
    lowerAllHands,
    bringAllToStage,
    canBringToStage: canChangeRole && offStageRolePeers.length > 0,
    bring_to_stage_label,
    remove_from_stage_label,
  };
};
