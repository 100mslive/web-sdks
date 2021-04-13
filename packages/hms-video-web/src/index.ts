import HMSConfig from "./interfaces/config";
import HMSInterface, { HMSAnalyticsLevel, HMSlogLevel } from "./interfaces/hms"
import HMSMessage, { HMSMessageListener } from "./interfaces/message";
import HMSPeer from "./interfaces/hms-peer";
import HMSUpdateListener from "./interfaces/update-listener";
import HMSTransport from "./transport/interfaces/transport";
import log from "loglevel"
import Peer from "./peer";
import { getRoomId } from "./utils";

export default class HMSSdk implements HMSInterface {
  logLevel: HMSlogLevel = HMSlogLevel.OFF
  analyticsLevel: HMSAnalyticsLevel = HMSAnalyticsLevel.OFF
  transport: HMSTransport
  roomId!: string
  localPeer!: HMSPeer

  constructor(transport: HMSTransport) {
    this.transport = transport
    log.setLevel(log.levels.DEBUG)
  }
  
  join(config: HMSConfig, listener: HMSUpdateListener) {
    log.debug(config, listener)

    const roomId = getRoomId(config.authToken)
    
    this.transport.join({
      roomId: roomId,
      token: config.authToken
    }, (error, result) => {
      if(error) throw error

      this.roomId = roomId
      this.localPeer = new Peer({
        name: config.userName,
        isLocal: true
      })
      
      log.debug(result)
    })
  }
  
  leave() {
    if(this.roomId) {
      this.transport.leave(this.roomId, (error, result) => {
        if(error) log.error(error)
        else log.debug(result)
      })
    }
  }
  
  getLocalPeer():HMSPeer {
    return this.localPeer
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