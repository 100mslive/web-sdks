import { HMSPeer } from '../peer';

export interface HMSSessionStore {
  set(key: string, value: any): Promise<{ value: any; updatedAt?: Date }>;
  observe(key: string[]): Promise<void>;
  unobserve(key: string[]): Promise<void>;
}

export interface SessionStoreUpdate {
  value: any;
  key: string;
  updatedAt?: Date;
  updatedBy?: HMSPeer;
}

export * from './polls';
export * from './whiteboard';
export * from './interactivity-center';
