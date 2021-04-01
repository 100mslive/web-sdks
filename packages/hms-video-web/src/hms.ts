import HMSConfig from "./interfaces/config";
import HMSInterface, { HMSAnalyticsLevel, HMSlogLevel } from "./interfaces/hms"
import HMSMessage, { HMSMessageListener } from "./interfaces/message";
import HMSPeer from "./interfaces/peer";
import HMSUpdateListener from "./interfaces/update-listener";

export default class HMS implements HMSInterface {
  logLevel: HMSlogLevel = HMSlogLevel.OFF
  analyticsLevel: HMSAnalyticsLevel = HMSAnalyticsLevel.OFF
  
  join(config: HMSConfig, listener: HMSUpdateListener) {
    console.log(config,listener)
    throw "Yet to implement"
  }
  
  leave() {
    throw "Yet to implement"
  }
  
  getLocalPeer():HMSPeer {
    throw "Yet to implement"
  }
  
  getPeers(): HMSPeer[] {
    throw "Yet to implement"
  }
  
  sendMessage(message: HMSMessage) {
    console.log(message)
    throw "Yet to implement"
  }
  
  onMessageReceived(cb: HMSMessageListener) {
    console.log(cb)
    throw "Yet to implement"
  }
  
  startScreenShare() {
    throw "Yet to implement"
  }
  
  stopScreenShare() {
    throw "Yet to implement"
  }
}