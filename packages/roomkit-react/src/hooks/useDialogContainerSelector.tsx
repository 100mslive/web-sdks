import { useContext } from 'react';
import { DialogContainerContext } from '../context/DialogContext';

export function useDialogContainerSelector() {
  const dialogContainerSelector = useContext(DialogContainerContext);
  return dialogContainerSelector;
}
