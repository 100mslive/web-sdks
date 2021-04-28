export default class PeerInfo {
  name: string;
  metadata: string;

  constructor(params: any) {
    this.name = params?.name;
    this.metadata = params?.data;
  }
}
