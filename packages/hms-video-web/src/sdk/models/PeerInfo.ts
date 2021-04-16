export default class PeerInfo {
  userName: string;
  metadata: string;

  constructor(params: any) {
    this.userName = params?.name;
    this.metadata = params?.metadata;
  }
}
