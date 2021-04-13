import HMSSubscribeConnection from "../../connection/subscribe";

export default class HMSRemoteStream {
  private readonly connection: HMSSubscribeConnection;

  constructor(connection: HMSSubscribeConnection) {
    this.connection = connection;
  }
}