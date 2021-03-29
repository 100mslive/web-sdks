import { HMSMode } from './types';

export default interface HMSConfig {
  userName: string;
  authToken: string;
  endpoint: string; // @DISCUSS: Is this needed?
  roomId: string;
  metaData: string;
  joiningMode: HMSMode;
}
