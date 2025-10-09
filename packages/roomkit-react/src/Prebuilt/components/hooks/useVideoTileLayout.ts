import { createContext, useContext } from 'react';

type TileContextType = {
  enableSpotlightingPeer: boolean;
  hideParticipantNameOnTile?: boolean;
  roundedVideoTile?: boolean;
  hideAudioMuteOnTile?: boolean;
  hideAudioLevelOnTile?: boolean;
  objectFit?: 'cover' | 'contain';
  hideMetadataOnTile?: boolean;
};

export const VideoTileContext = createContext<TileContextType>({
  enableSpotlightingPeer: true,
  hideParticipantNameOnTile: false,
  roundedVideoTile: true,
  hideAudioMuteOnTile: false,
  hideAudioLevelOnTile: false,
  objectFit: 'contain',
  hideMetadataOnTile: false,
});

export const useVideoTileContext = () => {
  const context = useContext(VideoTileContext);
  return context;
};
