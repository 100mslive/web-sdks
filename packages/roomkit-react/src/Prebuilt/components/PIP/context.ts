import { createContext } from 'react';

export type PIPContextType = {
  isSupported: boolean;
  pipWindow: Window | null;
  requestPipWindow: (width: number, height: number) => Promise<void>;
  closePipWindow: () => void;
};

export const PIPContext = createContext<PIPContextType | undefined>(undefined);
