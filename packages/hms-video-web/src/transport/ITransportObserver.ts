import { TransportState } from './models/TransportState';
import { HMSException } from '../error/HMSException';
import { HMSTrack } from '../media/tracks';

export default interface ITransportObserver {
  /**
   * Passes all the messages received from
   *  1. Signalling Server (JsonRPC/gRPC)
   *  2. Data Channel - at the moment only data-channel with label='ion-sfu'
   *    is created which send active-speaker events
   *
   * Each [message] has at most three fields:
   *  1. id: [String] - (Optional) A uuid-v4 used to match the response with the request that it is replying to.
   *    This member may be omitted if no response should be returned.
   *  2. method: [String] - (Optional) A String with the name of the method to be invoked.
   *    Method names that begin with "rpc." are reserved for rpc-internal methods.
   *  3. params: [JsonElement] - (Mandatory) A [JsonObject] or [JsonArray] of values to be
   *    passed as parameters to the defined method. This member may be omitted
   *
   * It is ensured that either one of `id` or `method` will always be present.
   *
   * In case of a response, `id` field will always be present along with below extra fields:
   *  1. result: [String] - The data returned by the invoked method.
   *    This element is formatted as a JSON-stat object. If an error occurred while invoking the
   *    method, this member must not exist.
   *  2. error: [String] - An error object if there was an error invoking the method,
   *    otherwise this member must not exist. The object must contain members
   *      2.1 code: [Int]
   *      2.2 message: [String]
   */
  onNotification(message: any): void;

  onConnected(): void;

  onTrackAdd(track: HMSTrack): void;

  onTrackRemove(track: HMSTrack): void;

  onFailure(exception: HMSException): void;

  onStateChange(state: TransportState, error?: HMSException): Promise<void>;

  /* onReconnecting(): void
  onReconnected(): void */
}
