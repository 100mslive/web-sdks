import { HMSRole } from '../interfaces/role';
import { HMSPeer } from '../sdk/models/peer';

/**
 * This interface represents the role change request that is
 * sent to the users of the SDK.
 */
export interface HMSRoleChangeRequest {
  requestedBy: HMSPeer;
  role: HMSRole;
  token: string;
}

/**
 * This interface represents the role change request recieved from the server
 */
export interface RoleChangeRequestParams {
  requested_by: string;
  role: string;
  token: string;
}

/**
 * Parameteres for the role change request sent to the server.
 */
export interface RequestForRoleChangeParams {
  requested_for: string;
  force: boolean;
  role: string;
}

/**
 * Parameters for accepting a role change request sent to the server.
 */
export interface AcceptRoleChangeParams {
  role: string;
  token: string;
}
