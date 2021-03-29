import { HMSMode } from './types';

export default interface HMSRole {
  name: string;
  mode: HMSMode;
  priority: number;
  metaData: string;
}
