interface Window {
  HMS?: {
    PING_INTERVAL?: number;
    PING_TIMEOUT?: number;
    AUDIO_SINK?: boolean;
    SERVER_SUB_DEGRADE?: boolean;
    GAIN_VALUE: 10;
    ON_SFU_STATS: (params: any) => void;
    ON_CONNECTION_QUALITY: (params: any) => void;
  };
}
