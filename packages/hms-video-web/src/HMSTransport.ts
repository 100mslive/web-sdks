import { IHMSTrack } from "./interfaces/track";
import { IHMSTransport } from "./interfaces/transport"

class HMSTrack implements IHMSTrack {
  hey = 'hello'
}

export class HMSTransport implements IHMSTransport {
  join() {}
  leave() {}
  getLocalTracks() {}
  publish() {}
  unpublish() {}
  sendMessage() {}
}