import { HMSRole } from '@100mslive/hms-video/dist/interfaces/role';
import { HMSPeerID } from './peer';

export type HMSRoleName = string;

export interface HMSRoleChangeStoreRequest {
  requestedBy: HMSPeerID;
  roleName: HMSRoleName;
  token: string;
}

export { HMSRole };
