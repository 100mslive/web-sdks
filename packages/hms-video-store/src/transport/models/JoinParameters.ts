import { HMSICEServer, HMSProxyConfig } from '../../interfaces';
import { getEndpointFromProxy } from '../../utils/get-endpoint-from-proxy';

export class JoinParameters {
  constructor(
    public authToken: string,
    public peerId: string,
    public peerName: string = '',
    public data: string = '',
    public endpoint: string = 'https://prod-init.100ms.live/init',
    public autoSubscribeVideo: boolean = false,
    public proxy?: HMSProxyConfig,
    public iceServers?: HMSICEServer[],
  ) {
    if (proxy) {
      this.endpoint = getEndpointFromProxy(proxy);
    }
  }
}
