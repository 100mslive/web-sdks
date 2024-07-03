import React from 'react';
import { createPortal } from 'react-dom';

type PIPWindowProps = {
  pipWindow: Window;
  children: React.ReactNode;
};

export const PIPWindow = ({ pipWindow, children }: PIPWindowProps) => {
  return createPortal(children, pipWindow.document.body);
};
