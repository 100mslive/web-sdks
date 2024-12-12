/**
 * The connection quality will store the details regarding the network status of
 * a peer in the room. The downlink score will be a number between 0-100 quantifying
 * the download bitrate the peer has compared against that required for a good
 * experience in the session.
 * Note that this is not an absolute measure, a bandwidth of 1 MBPs may be good
 * for a 1:1 call but poor for a large call.
 */
export interface HMSConnectionQuality {
  peerID: string;
  downlinkQuality: number;
}
