import HMSPeer from "../interfaces/hms-peer";
import { v4 as uuidv4 } from 'uuid';

type HMSPeerInit = {
  name: string
  isLocal: boolean
}

export default class Peer implements HMSPeer {
  peerId: string
  isLocal: boolean
  name: string
  customerDescription: string = ""
  
  constructor({name, isLocal}: HMSPeerInit) {
    this.name = name
    this.peerId = uuidv4()
    this.isLocal = isLocal
  }
}