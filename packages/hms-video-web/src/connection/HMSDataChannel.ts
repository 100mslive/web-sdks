import HMSLogger from '../utils/logger';

export interface DataChannelObserver {
  onMessage(value: string): void;
}

export default class HMSDataChannel {
  private readonly TAG = 'HMSDataChannel';
  private readonly nativeChannel: RTCDataChannel;
  private readonly observer: DataChannelObserver;
  private readonly metadata: string;

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
      HMSLogger.d(this.TAG, `[${this.metadata}] onMessage: label=${this.label}, message=${e.data}`);

      // Right now we only receive an array
      this.observer.onMessage(e.data);
    };
  }

  async send(message: string) {
    if (this.nativeChannel.readyState !== 'open') {
      // TODO: Wait for channel to open
      throw Error(`Channel ${this.label} not yet ready`);
    }

    HMSLogger.d(this.TAG, `[${this.metadata}] Sending [size=${message.length}] message=${message}`);
    this.nativeChannel.send(message);
  }

  close() {
    this.nativeChannel.close();
  }
}
