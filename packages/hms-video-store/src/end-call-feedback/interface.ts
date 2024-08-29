export interface HMSSessionFeedback {
  // The question asked in the feedback.
  question?: string;
  // The rating given for the Session experience.
  rating: number;
  // The minimum rating allowed.
  min_rating?: number;
  // The maximum rating allowed.
  max_rating?: number;
  // Reasons for the given rating.
  reasons?: string[];
  // Additional comments provided by the user.
  comment?: string;
}

export interface HMSSessionInfo {
  peer: HMSSessionPeerInfo;
  agent: string;
  device_id: string;
  cluster: HMSSessionCluster;
  timestamp: number;
}

// Data structure for peer data in a session.
export interface HMSSessionPeerInfo {
  peer_id: string;
  role?: string;
  joined_at?: number;
  left_at?: number;
  room_name?: string;
  session_started_at?: number;
  user_data?: string;
  user_name?: string;
  template_id?: string;
  session_id?: string;
  token?: string;
}

// Data structure for session cluster.
export interface HMSSessionCluster {
  websocket_url: string;
}
