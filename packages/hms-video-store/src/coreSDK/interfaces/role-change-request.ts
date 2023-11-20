import { HMSRole } from './role';
import { HMSPeer } from '../sdk/models/peer';

/**
 * This interface represents the role change request that is
 * sent to the users of the SDK.
 */
export interface HMSRoleChangeRequest {
  requestedBy?: HMSPeer;
  role: HMSRole;
  token: string;
}
