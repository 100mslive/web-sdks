import HMSLogger from '../utils/logger';

export interface DataChannelObserver {
  onMessage(value: string): void;
}

export default class HMSDataChannel {
  private readonly TAG = 'HMSDataChannel';
  private readonly nativeChannel: RTCDataChannel;
  private readonly observer: DataChannelObserver;
  private readonly metadata: string;
  private msgQueue: string[] = [];

  public get id() {
    return this.nativeChannel.id;
  }

  public get label() {
    return this.nativeChannel.label;
  }

  constructor(nativeChannel: RTCDataChannel, observer: DataChannelObserver, metadata: string = '') {
    this.nativeChannel = nativeChannel;
    this.observer = observer;
    this.metadata = metadata;

    nativeChannel.onmessage = (e) => {
      // HMSLogger.d(this.TAG, `[${this.metadata}] onMessage: label=${this.label}, message=${e.data}`);
      this.observer.onMessage(e.data);
    };

    nativeChannel.onopen = () => {
      if (this.msgQueue.length > 0) {
        HMSLogger.d('Found pending message queue, sending messages');
        this.msgQueue.forEach((msg) => this.send(msg));
        this.msgQueue.length = 0;
      }
    };
  }

  async send(message: string) {
    if (this.nativeChannel.readyState === 'open') {
      HMSLogger.d(this.TAG, `[${this.metadata}] Sending [size=${message.length}] message=${message}`);
      this.nativeChannel.send(message);
    } else {
      HMSLogger.d(this.TAG, 'Connection is not open, queueing', message);
      this.msgQueue.push(message);
    }
  }

  close() {
    this.nativeChannel.close();
  }
}
