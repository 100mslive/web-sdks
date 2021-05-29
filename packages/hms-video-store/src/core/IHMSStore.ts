import { UseStore } from 'zustand';
import { HMSStore } from './schema';
import { Omit } from '@material-ui/core';

export interface IHMSStore extends UseStore<HMSStore> {}

export type IHMSStoreReadOnly = Omit<IHMSStore, 'setState'>;
