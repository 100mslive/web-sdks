import { createContext, ReactNode } from 'react';

export const DialogContainerContext = createContext('');

export function DialogContainerProvider({
  children,
  dialogContainerSelector,
}: {
  children: ReactNode;
  dialogContainerSelector: string;
}) {
  return <DialogContainerContext.Provider value={dialogContainerSelector}>{children}</DialogContainerContext.Provider>;
}
