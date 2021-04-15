import {InitConfig} from "./models";
import HMSLogger from "../../utils/logger";

const INIT_API_ENDPOINT = "https://qa2-us.100ms.live/init"

const CORS_HACKY_FIX = {
  // endpoint: "wss://qa2-us.100ms.live/v2/ws",
  endpoint: "wss://100ms-grpc.100ms.live:8443/ws",
  rtcConfiguration: {
    iceServers: [
      {
        urls: [
          "stun:stun.stunprotocol.org:3478"
        ]
      }
    ]
  },
  policy: "",
  log_level: "",
} as InitConfig;

export default class InitService {
  private static readonly TAG = "InitService";

  static async fetchInitConfig(token: string, region: string = ""): Promise<InitConfig> {
    /* let url = `${INIT_API_ENDPOINT}?token=${token}`
    if (region.length > 0) {
      url += `&region=${region}`
    }

    // TODO: Add user-agent, handle error status codes
    const response = await fetch(url);
    const config = (await response.json()) as InitConfig; */
    const config = CORS_HACKY_FIX;
    return config;
  }
}