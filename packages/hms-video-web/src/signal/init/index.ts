import {InitConfig} from "./models";

const INIT_API_ENDPOINT = "https://qa2-us.100ms.live/init"

export default class InitService {
  static async fetchInitConfig(token: string, region: string = ""): Promise<InitConfig> {
    let url = `${INIT_API_ENDPOINT}?token=${token}`
    if (region.length > 0) {
      url += `&region=${region}`
    }

    // TODO: Add user-agent, handle error status codes
    const response = await fetch(url);
    return (await response.json()) as InitConfig;
  }
}