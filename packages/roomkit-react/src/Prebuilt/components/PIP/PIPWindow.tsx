import React from 'react';
import { createPortal } from 'react-dom';

type PIPWindowProps = {
  pipWindow: Window;
  children: React.ReactNode;
};

export const PIPWindow = ({ pipWindow, children }: PIPWindowProps): React.ReactElement | null => {
  pipWindow.document.body.style.margin = '0';
  pipWindow.document.body.style.overflow = 'clip';
  return createPortal(children as any, pipWindow.document.body) as React.ReactElement;
};
