import { InitConfig } from './models';
import HMSLogger from '../../utils/logger';

const cInitApiEndpoint = 'https://qa2-us.100ms.live/init';
const TAG = 'InitService';

export default class InitService {
  static async fetchInitConfig(token: string, region: string = ''): Promise<InitConfig> {
    HMSLogger.d(TAG, `fetchInitConfig: token=${token} region=${region}`);
    let url = `${cInitApiEndpoint}?token=${token}`;
    if (region.length > 0) {
      url += `&region=${region}`;
    }

    // TODO: Add user-agent, handle error status codes
    const response = await fetch(url);
    const config = (await response.json()) as InitConfig;
    return { ...config, endpoint: 'wss://100ms-grpc.100ms.live:8443/ws' };
  }
}
