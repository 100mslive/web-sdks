import { useRoomLayout } from '..';
// @ts-ignore: No implicit Any
import { usePinnedTrack } from '../../../components/AppData/useUISettings';

export const useIsRoleProminenceLayout = () => {
  const layout = useRoomLayout();
  const pinnedTrack = usePinnedTrack();
  const { prominent_roles = [] } =
    //@ts-ignore
    layout?.screens?.conferencing?.default?.elements?.video_tile_layout?.grid || {};

  return prominent_roles.length > 0 || !!pinnedTrack;
};
