import { useEffect, useRef, useState } from 'react';

export const useAudioOutputTest = ({ deviceId }: { deviceId: string }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (audioRef.current && deviceId) {
      try {
        // @ts-ignore
        if (typeof audioRef.current.setSinkId !== 'undefined') {
          // @ts-ignore
          audioRef.current.setSinkId(deviceId);
        }
      } catch (error) {
        console.log(error);
      }
    }
  }, [deviceId]);
  return { playing, setPlaying, audioRef };
};
