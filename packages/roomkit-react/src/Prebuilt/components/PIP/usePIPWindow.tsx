import { useContext } from 'react';
import { PIPContext, PIPContextType } from './context';

export const usePIPWindow = (): PIPContextType => {
  const context = useContext(PIPContext);

  if (context === undefined) {
    throw new Error('usePIPWindow must be used within a PIPContext');
  }

  return context;
};
