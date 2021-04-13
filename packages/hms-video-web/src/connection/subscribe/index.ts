import HMSConnection from "../index";
import {ISignal} from "../../signal/ISignal";
import ISubscribeConnectionObserver from "./ISubscribeConnectionObserver";
import {HMSConnectionRole} from "../model";
import HMSRemoteStream from "../../media/streams/HMSRemoteStream";

export default class HMSSubscribeConnection extends HMSConnection {
  private readonly remoteStreams = new Map<string, HMSRemoteStream>();

  private readonly observer: ISubscribeConnectionObserver;
  readonly nativeConnection: RTCPeerConnection;

  constructor(signal: ISignal, config: RTCConfiguration, observer: ISubscribeConnectionObserver) {
    super(HMSConnectionRole.SUBSCRIBE, signal);
    this.observer = observer;

    this.nativeConnection = new RTCPeerConnection(config);
    this.nativeConnection.oniceconnectionstatechange = () => {
      observer.onIceConnectionChange(this.nativeConnection.iceConnectionState);
    };
    this.nativeConnection.ontrack = (e) => {
      const stream = e.streams[0];
      if (!this.remoteStreams.has(stream.id)) {

      }
    }
  }

}