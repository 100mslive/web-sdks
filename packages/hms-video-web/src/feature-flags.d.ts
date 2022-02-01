interface Window {
  HMS?: {
    PING_INTERVAL?: number;
    PING_TIMEOUT?: number;
    AUDIO_SINK?: boolean;
    GAIN_VALUE: number;
    LOOPBACK?: boolean;
    ON_SFU_STATS: (params: any) => void;
  };
}
