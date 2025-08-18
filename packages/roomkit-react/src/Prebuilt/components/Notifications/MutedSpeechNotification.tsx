import { useEffect, useRef, useState } from 'react';
import { 
  selectIsLocalAudioEnabled, 
  selectLocalPeer, 
  selectLocalAudioTrackID,
  selectTrackAudioByID,
  useHMSStore,
  useHMSActions 
} from '@100mslive/react-sdk';
import { MicOffIcon } from '@100mslive/react-icons';
import { ToastManager } from '../Toast/ToastManager';
import { Button } from '../../../Button';
import { Box } from '../../../Layout';

interface MutedSpeechNotificationProps {
  speechThreshold?: number;
  speechDuration?: number;
  cooldownPeriod?: number;
  enabled?: boolean;
  useBuiltInAudioLevel?: boolean;
  customMessage?: string;
  customDescription?: string;
}

export const MutedSpeechNotification = ({
  speechThreshold = 25,
  speechDuration = 2000,
  cooldownPeriod = 10000,
  enabled = true,
  useBuiltInAudioLevel = true,
  customMessage = "You're on mute. Do you want to say something?",
  customDescription = "Please unmute to speak.",
}: MutedSpeechNotificationProps) => {
  const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
  const localPeer = useHMSStore(selectLocalPeer);
  const localAudioTrackID = useHMSStore(selectLocalAudioTrackID);
  const audioLevel = useHMSStore(selectTrackAudioByID(localAudioTrackID));
  const hmsActions = useHMSActions();
  
  const [isDetecting, setIsDetecting] = useState(false);
  const [speechStartTime, setSpeechStartTime] = useState<number | null>(null);
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);
  const [customAudioLevel, setCustomAudioLevel] = useState<number>(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const speechTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentAudioLevel = useBuiltInAudioLevel ? (audioLevel || 0) : customAudioLevel;

  useEffect(() => {
    if (!enabled || useBuiltInAudioLevel || !localPeer?.audioTrack) return;

    const initializeAudioAnalysis = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const stream = new MediaStream([localPeer.audioTrack.nativeTrack]);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        analyserRef.current.smoothingTimeConstant = 0.8;
        mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
        mediaStreamSourceRef.current.connect(analyserRef.current);
        startCustomAudioMonitoring();
      } catch (error) {
        console.warn('Failed to initialize custom audio analysis for muted speech detection:', error);
      }
    };

    initializeAudioAnalysis();

    return () => {
      cleanup();
    };
  }, [enabled, useBuiltInAudioLevel, localPeer?.audioTrack]);

  const startCustomAudioMonitoring = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const monitorAudio = () => {
      if (!analyserRef.current || !enabled) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const normalizedLevel = (rms / 255) * 100;
      
      setCustomAudioLevel(normalizedLevel);
      
      if (normalizedLevel > speechThreshold) {
        handleSpeechDetected();
      } else {
        handleSpeechStopped();
      }
      
      animationFrameRef.current = requestAnimationFrame(monitorAudio);
    };

    monitorAudio();
  };

  useEffect(() => {
    if (!enabled || useBuiltInAudioLevel || isLocalAudioEnabled) return;

    if (currentAudioLevel > speechThreshold) {
      handleSpeechDetected();
    } else {
      handleSpeechStopped();
    }
  }, [currentAudioLevel, enabled, useBuiltInAudioLevel, isLocalAudioEnabled, speechThreshold]);

  const handleSpeechDetected = () => {
    if (!enabled || isLocalAudioEnabled) return;

    const now = Date.now();
    if (now - lastNotificationTime < cooldownPeriod) return;

    if (!isDetecting) {
      setIsDetecting(true);
      setSpeechStartTime(now);
      speechTimeoutRef.current = setTimeout(() => {
        if (isDetecting && !isLocalAudioEnabled) {
          showMutedSpeechNotification();
          setLastNotificationTime(now);
        }
      }, speechDuration);
    }
  };

  const handleSpeechStopped = () => {
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    setIsDetecting(false);
    setSpeechStartTime(null);
  };

  const showMutedSpeechNotification = () => {
    const notificationId = ToastManager.addToast({
      title: customMessage,
      description: customDescription,
      icon: <MicOffIcon />,
      variant: 'warning',
      duration: 8000,
      action: (
        <Box css={{ display: 'flex', gap: '$2' }}>
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              hmsActions.setLocalAudioEnabled(true);
              ToastManager.removeToast(notificationId);
            }}
          >
            Unmute
          </Button>
          <Button
            size="sm"
            variant="standard"
            onClick={() => ToastManager.removeToast(notificationId)}
          >
            Dismiss
          </Button>
        </Box>
      ),
    });
  };

  const cleanup = () => {
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  return null;
};

export default MutedSpeechNotification;
