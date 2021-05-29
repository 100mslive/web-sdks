import { UseStore } from 'zustand';
import { HMSStore } from './schema';

export interface IHMSStore extends UseStore<HMSStore> {}

export type IHMSStoreReadOnly = Omit<IHMSStore, 'setState'>;
