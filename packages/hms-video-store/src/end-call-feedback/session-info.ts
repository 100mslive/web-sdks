export interface HMSSessionFeedback {
  // The question asked in the feedback.
  question?: string;
  // The rating given for the Session experience.
  rating: number;
  // The minimum rating allowed.
  minRating?: number;
  // The maximum rating allowed.
  maxRating?: number;
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
  timestamp: Date;
}

// Data structure for peer data in a session.
export interface HMSSessionPeerInfo {
  peerID: string;
  role?: string;
  joinedAt?: Date;
  leftAt?: Date; // to be filled later | can backend set it?
  roomName?: string;
  sessionStartedAt?: Date;
  userData?: string;
  userName?: string;
  templateId?: string;
  sessionId?: string;
  token?: string;
}

// Data structure for session cluster.
export interface HMSSessionCluster {
  websocketUrl: string;
}
