import ITransportObserver from "./ITransportObserver";
import ITransport from "./ITransport";
import HMSPublishConnection from "../connection/publish";
import HMSSubscribeConnection from "../connection/subscribe";
import InitService from "../signal/init";
import {ISignal} from "../signal/ISignal";
import {ISignalEventsObserver} from "../signal/ISignalEventsObserver";
import JsonRpcSignal from "../signal/jsonrpc";
import {HMSTrickle} from "../connection/model";
import HMSException from "../error/HMSException";
import {IPublishConnectionObserver} from "../connection/publish/IPublishConnectionObserver";
import ISubscribeConnectionObserver from "../connection/subscribe/ISubscribeConnectionObserver";
import HMSTrack from "../media/tracks/HMSTrack";

export default class HMSTransport implements ITransport {
  private readonly observer: ITransportObserver;
  private publishConnection: HMSPublishConnection | null = null
  private subscribeConnection: HMSSubscribeConnection | null = null
  private readonly signal: ISignal;

  private signalObserver: ISignalEventsObserver;
  private publishConnectionObserver: IPublishConnectionObserver;
  private subscribeConnectionObserver: ISubscribeConnectionObserver;

  constructor(observer: ITransportObserver) {
    this.observer = observer;
    this.signal = new JsonRpcSignal(<ISignalEventsObserver>{

      onOffer: (jsep: RTCSessionDescriptionInit) => {
      },
      onTrickle: (trickle: HMSTrickle) => {
      },
      onNotification: (message: Object) => {
      },
      onFailure: (exception: HMSException) => {
      }
    })
  }

  async join(authToken: string, roomId: string, peerId: string, customData: Object): Promise<void> {
    const config = await InitService.fetchInitConfig(authToken);
    await this.signal.open(config.endpoint)

    this.publishConnection = new HMSPublishConnection(
        this.signal,
        config.rtcConfiguration,
        this.publishConnectionObserver
    )

    this.subscribeConnection = new HMSSubscribeConnection(
        this.signal,
        config.rtcConfiguration,
        this.subscribeConnectionObserver
    )

    const offer = await this.publishConnection.createOffer();
    await this.publishConnection.setLocalDescription(offer);
    const answer = await this.signal.join(roomId, peerId, offer, customData);
    await this.publishConnection.setRemoteDescription(answer);
    for (const candidate of this.publishConnection.candidates) {
      await this.publishConnection!.addIceCandidate(candidate);
    }

    // TODO: Handle exceptions raised - wrap them in HMSException
  }

  async leave(): Promise<void> {
    await this.publishConnection!.close();
    await this.subscribeConnection!.close();
    await this.signal.close();
  }

  publish(tracks: Array<HMSTrack>): Promise<void> {
    return Promise.resolve(undefined);
  }

  unpublish(tracks: Array<HMSTrack>): Promise<void> {
    return Promise.resolve(undefined);
  }
}
