import { HMSRole } from '../../interfaces';
import { TrackState } from '../../notification-manager';

export type KnownRoles = { [role: string]: HMSRole };
export interface TrackStateEntry {
  peerId: string;
  trackInfo: TrackState;
}
