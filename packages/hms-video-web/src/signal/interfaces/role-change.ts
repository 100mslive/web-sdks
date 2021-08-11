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
