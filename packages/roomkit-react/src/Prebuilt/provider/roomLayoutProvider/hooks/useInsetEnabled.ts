import { useRoomLayout } from '..';

export const useInsetEnabled = (): boolean => {
  const layout = useRoomLayout();
  const { enable_local_tile_inset = true } =
    //@ts-ignore
    layout?.screens?.conferencing?.default?.elements?.video_tile_layout?.grid || {};

  return enable_local_tile_inset;
};
