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

interface Performance extends Performance {
  memory?: {
    /** The maximum size of the heap, in bytes, that is available to the context. */
    jsHeapSizeLimit: number;
    /** The total allocated heap size, in bytes. */
    totalJSHeapSize: number;
    /** The currently active segment of JS heap, in bytes. */
    usedJSHeapSize: number;
  };
}
