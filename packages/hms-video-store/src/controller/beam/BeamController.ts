import { isBrowser } from '@100mslive/hms-video';
declare global {
  interface Window {
    __beam: BeamController;
  }
}
export class BeamController {
  constructor() {
    if (isBrowser) {
      window.__beam = this;
    }
  }
  add = (x: number, y: number) => {
    return x + y;
  };
}

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

// export class BeamController extends Event {
//   private listeners: any[] = [];

//   addListener(listener?: any) {
//     if (!listener) {
//       throw new Error("listener connected be null");
//     }
//     this.listeners.push(listener);
//   }
//   removeListener(listener?: any) {
//     const index = this.listeners.indexOf(listener);
//     if (index === -1) {
//       throw new Error("Listener not found");
//     }
//     this.listeners.splice(index, 1);
//   }
//   // emit = (listener: any) => {
//   //   listener.
//   // }
// }
