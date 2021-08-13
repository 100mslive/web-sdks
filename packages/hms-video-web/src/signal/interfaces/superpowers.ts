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

export interface RemovePeerRequest {
  requested_for: string;
  reason: string;
}

export interface TrackUpdateRequestParams {
  requested_for: string;
  track_id: string;
  stream_id: string;
  mute: boolean;
}
