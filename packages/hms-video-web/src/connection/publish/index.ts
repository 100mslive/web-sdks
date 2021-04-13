import HMSConnection from "../index";
import {ISignal} from "../../signal/ISignal";
import {IPublishConnectionObserver} from "./IPublishConnectionObserver";
import {HMSConnectionRole} from "../model";

export default class HMSPublishConnection extends HMSConnection {
  private readonly observer: IPublishConnectionObserver;
  private readonly nativeConnection: RTCPeerConnection;

  constructor(signal: ISignal, config: RTCConfiguration, observer: IPublishConnectionObserver) {
    super(HMSConnectionRole.PUBLISH, signal);
    this.observer = observer;

    this.nativeConnection = new RTCPeerConnection(config);
    this.nativeConnection.createDataChannel("ion-sfu");
    this.nativeConnection.onicecandidate = ({candidate}) => {
      if (candidate) {
        signal.trickle({target: this.role, candidate});
      }
    };
    this.nativeConnection.oniceconnectionstatechange = () => {
      observer.onIceConnectionChange(this.nativeConnection.iceConnectionState);
    };
  }
}