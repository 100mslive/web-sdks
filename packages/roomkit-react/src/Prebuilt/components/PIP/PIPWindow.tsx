import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

type PIPWindowProps = {
  pipWindow: Window;
  children: ReactNode;
};

export const PIPWindow = ({ pipWindow, children }: PIPWindowProps) => {
  pipWindow.document.body.style.margin = '0';
  pipWindow.document.body.style.overflow = 'clip';
  return createPortal(children, pipWindow.document.body);
};
