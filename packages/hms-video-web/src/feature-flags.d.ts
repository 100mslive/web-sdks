interface Window {
  HMS?: {
    PING_INTERVAL?: number;
    PING_TIMEOUT?: number;
    GAIN_VALUE: 10;
    ON_SFU_STATS: (params: any) => void;
    NETWORK_TEST: boolean;
    CLIENT_EVENTS: boolean;
  };
}
