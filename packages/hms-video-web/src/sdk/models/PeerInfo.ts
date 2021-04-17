export default class PeerInfo {
  userName: string;
  metadata: string;

  constructor(params: any) {
    this.userName = params?.userName;
    this.metadata = params?.metadata;
  }
}
