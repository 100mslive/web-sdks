import { InitConfig } from './models';
import HMSLogger from '../../utils/logger';

const TAG = 'InitService';

export default class InitService {
  static async fetchInitConfig(
    token: string,
    initEndpoint: string = 'https://qa-init.100ms.live/init',
    region: string = '',
  ): Promise<InitConfig> {
    HMSLogger.d(TAG, `fetchInitConfig: initEndpoint=${initEndpoint} token=${token} region=${region}`);
    let url = `${initEndpoint}?token=${token}`;
    if (region.length > 0) {
      url += `&region=${region}`;
    }

    // @TODO: Add user-agent, handle error status codes
    const response = await fetch(url);
    return (await response.json()) as InitConfig;
  }
}
