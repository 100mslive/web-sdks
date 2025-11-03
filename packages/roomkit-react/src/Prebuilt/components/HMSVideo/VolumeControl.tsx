import { useState } from 'react';
import { VolumeOneIcon, VolumeTwoIcon, VolumeZeroIcon } from '@100mslive/react-icons';
import { Flex, Slider } from '../../..';
import { useHMSPlayerContext } from './PlayerContext';

export const VolumeControl = () => {
  const { hlsPlayer } = useHMSPlayerContext();
  const [volume, setVolume] = useState(hlsPlayer?.volume ?? 100);
  const [showSlider, setShowSlider] = useState(false);

  return (
    <Flex
      align="center"
      css={{ color: '$on_surface_high' }}
      onMouseOver={event => {
        event.stopPropagation();
        setShowSlider(true);
      }}
      onMouseLeave={event => {
        event.stopPropagation();
        setShowSlider(false);
      }}
    >
      <VolumeIcon
        volume={volume}
        onClick={() => {
          if (volume > 0) {
            setVolume(0);
            hlsPlayer?.setVolume(0);
          } else {
            setVolume(100);
            hlsPlayer?.setVolume(100);
          }
        }}
      />
      <Slider
        css={{
          mx: '$4',
          w: '$20',
          cursor: 'pointer',
          '@sm': { w: '$14' },
          '@xs': { w: '$14' },
          opacity: showSlider ? '1' : '0',
          display: showSlider ? '' : 'none',
          transition: `all .2s ease .5s`,
        }}
        min={0}
        max={100}
        step={1}
        value={[volume]}
        onValueChange={volume => {
          hlsPlayer?.setVolume(volume[0]);
          setVolume(volume[0]);
        }}
        thumbStyles={{ w: '$6', h: '$6' }}
      />
    </Flex>
  );
};

const VolumeIcon = ({ volume, onClick }: { volume: number; onClick: () => void }) => {
  if (volume === 0) {
    return <VolumeZeroIcon style={{ cursor: 'pointer', transition: 'color 0.3s' }} onClick={onClick} />;
  }
  return volume < 50 ? (
    <VolumeOneIcon style={{ cursor: 'pointer', transition: 'color 0.3s' }} onClick={onClick} />
  ) : (
    <VolumeTwoIcon style={{ cursor: 'pointer', transition: 'color 0.3s' }} onClick={onClick} />
  );
};
