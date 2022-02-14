export class JoinParameters {
  constructor(
    public authToken: string,
    public peerId: string,
    public peerName: string,
    public data: string,
    public endpoint: string,
    public autoSubscribeVideo: boolean,
    public serverSubDegrade: boolean,
  ) {}
}
