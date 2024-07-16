import React from 'react';
import { createPortal } from 'react-dom';

type PIPWindowProps = {
  pipWindow: Window;
  children: React.ReactNode;
};

export const PIPWindow = ({ pipWindow, children }: PIPWindowProps) => {
  pipWindow.document.body.style.margin = '0';
  pipWindow.document.body.style.overflowX = 'hidden';
  return createPortal(children, pipWindow.document.body);
};
