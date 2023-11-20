import HMSLogger from '../utils/logger';

export interface DataChannelObserver {
  onMessage(value: string): void;
}

export default class HMSDataChannel {
  private readonly TAG = '[HMSDataChannel]';
  private readonly nativeChannel: RTCDataChannel;
  private readonly observer: DataChannelObserver;
  private readonly metadata: string;

  public get id() {
    return this.nativeChannel.id;
  }

  public get label() {
    return this.nativeChannel.label;
  }

  public get readyState() {
    return this.nativeChannel.readyState;
  }

  constructor(nativeChannel: RTCDataChannel, observer: DataChannelObserver, metadata = '') {
    this.nativeChannel = nativeChannel;
    this.observer = observer;
    this.metadata = metadata;

    nativeChannel.onmessage = e => {
      // HMSLogger.d(this.TAG, `[${this.metadata}] onMessage: label=${this.label}, message=${e.data}`);
      this.observer.onMessage(e.data);
    };
  }

  send(message: string) {
    HMSLogger.d(this.TAG, `[${this.metadata}] Sending [size=${message.length}] message=${message}`);
    this.nativeChannel.send(message);
  }

  close() {
    this.nativeChannel.close();
  }
}
