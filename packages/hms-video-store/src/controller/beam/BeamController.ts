import { HMSException, IHMSStore, selectError, selectIsConnectedToRoom, selectPeerCount } from '../../core';
import { IHMSActions } from '../../core/IHMSActions';
import { IHMSStoreReadOnly } from '../../core/IHMSStore';

// enum HealthState {
//   CONNECTED,
//   CONNECTING,
//   DISCONNECTED,
// }
// interface HealthCheck {
//   ok: Boolean;
//   error: string;
//   state: HealthCheck;
// }

// interface HMSDetails {
//   localPeerId: string;
//   sessionId: string;
// }

// interface BeamCommunication {
//   // register an error listener, the callback will be called if
//   // any error occurs. This helps in taking action as soon as anything bad
//   // happens.
//   onError(errorCallback: (details: HealthCheck) => void): void;

//   // this can be used to send arbitrary logs to be printed by the running
//   // container(minion), adding any new logs won't require minion deployment
//   // and can be done from sdk/app side. Both the size of the string and number
//   // of such logs will be capped(1KB and 500 such logs).
//   onInfo(infoLogCallback: (logStr: string) => void): void;

//   // this function is called periodically to get health of webapp
//   // if ok is false reload happens. This helps even in case where the
//   // app completely dies or the tab crashes so onError couldn't be done.
//   // in case of hms sdk sdk verify that room is in joined state.
//   health(): HealthCheck;

//   // 100ms store subscribe to anything
//   // for e.g. to get number of peers -
//   // subscribe(s => s.room.peers.length, fn)
//   // to get room state
//   // subscribe(s => s.room.state, fn)
//   // can be used similarly to know local peer id, session id etc. as necessary
//   hmsSubscribe(selector, fn);
// }
export function pubSub() {
  const subscribers: { [key: string]: Array<any> } = {};
  function publish(eventName: string, data: any) {
    if (!Array.isArray(subscribers[eventName])) {
      return;
    }
    subscribers[eventName].forEach((callback: any) => {
      callback(data);
    });
  }
  function subscribe(eventName: string, callback: any) {
    if (!Array.isArray(subscribers[eventName])) {
      subscribers[eventName] = [callback];
    }
    // subscribers[eventName].push(callback);
  }
  return {
    publish,
    subscribe,
    subscribers,
  };
}
export class BeamControllerStore {
  // perform action to add, remove beam
  private readonly actions: IHMSActions;
  // get all details from store about room, peers, tracks.
  private readonly store: IHMSStore;
  private readonly listeners: any;
  constructor(hmsStore: IHMSStore, hmsActions: IHMSActions) {
    this.store = hmsStore;
    this.actions = hmsActions;

    this.listeners = pubSub();
    this.store.subscribe((peerCount: number) => {
      this.listeners.publish('peer-count', peerCount);
    }, selectPeerCount);
    this.store.subscribe((error: HMSException | null) => {
      if (error) {
        this.listeners.publish('error', error);
      }
    }, selectError);
    this.store.subscribe((connected: boolean | undefined) => {
      this.listeners.publish('is-connected', connected || false);
    }, selectIsConnectedToRoom);
  }

  /**
   * A reactive store which has a subscribe method you can use in combination with selectors
   * to subscribe to a subset of the store. The store serves as a single source of truth for
   * all data related to the corresponding HMS Room.
   */
  getStore(): IHMSStoreReadOnly {
    return this.store;
  }

  /**
   * Any action which may modify the store or may need to talk to the SDK will happen
   * through the IHMSActions instance returned by this
   */
  getActions(): IHMSActions {
    return this.actions;
  }
}
