import { useRoomLayout } from '..';

export const useIsRoleProminenceLayout = () => {
  const layout = useRoomLayout();
  const { prominent_roles = [] } =
    //@ts-ignore
    layout?.screens?.conferencing?.default?.elements?.video_tile_layout?.grid || {};

  return prominent_roles?.length > 0;
};
