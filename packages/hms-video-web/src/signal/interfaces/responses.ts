export interface BroadcastResponse {
  timestamp: number;
}

export interface GetSessionMetadataResponse {
  change_version?: number;
  updated_by?: string;
  data: any;
  key?: string;
  updated_at?: number;
}

export interface SetSessionMetadataResponse {
  change_version?: number;
  data: any;
  key: string;
  updated_at?: number;
}
