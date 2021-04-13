import HMSConfig from "./interfaces/config";
import HMSInterface, { HMSAnalyticsLevel, HMSlogLevel } from "./interfaces/hms"
import HMSMessage, { HMSMessageListener } from "./interfaces/message";
import HMSPeer from "./interfaces/peer";
import HMSUpdateListener from "./interfaces/update-listener";
import HMSTransport from "./transport/interfaces/transport";
import log from "loglevel"

export default class HMSSdk implements HMSInterface {
  logLevel: HMSlogLevel = HMSlogLevel.OFF
  analyticsLevel: HMSAnalyticsLevel = HMSAnalyticsLevel.OFF
  transport: HMSTransport

  constructor(transport: HMSTransport) {
    this.transport = transport
    log.setLevel(log.levels.DEBUG)
  }
  
  join(config: HMSConfig, listener: HMSUpdateListener) {
    log.debug(config, listener)
    
    this.transport.join({
      roomId: config.roomId,
      token: config.authToken
    }, (error, result) => {
      if(error) throw error
      
      log.debug(result)
    })
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