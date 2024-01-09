import { usePinnedBy } from './usePinnedBy';

export const useChatBackground = (
  messageId: string,
  messageType: boolean,
  selectedPeerID: string,
  selectedRole: string,
  isOverlay: boolean,
) => {
  const pinnedBy = usePinnedBy(messageId);
  if (pinnedBy) return 'linear-gradient(277deg, $surface_default 0%, $surface_dim 60.87%)';
  if (messageType && !(selectedPeerID || selectedRole)) {
    return isOverlay ? 'rgba(0, 0, 0, 0.64)' : '$surface_default';
  }
  return '';
};
