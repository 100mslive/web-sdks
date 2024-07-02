// import React from 'react';
import { createPortal } from 'react-dom';

type PIPWindowProps = {
  pipWindow: Window;
  children: React.ReactNode;
};

export const PIPWindow = ({ pipWindow, children }: PIPWindowProps) => {
  return createPortal(children, pipWindow.document.body);
};

// export const PIPWindow = ({ pipWindow, children }: PIPWindowProps) => {
//   const container = pipWindow.document.createElement('div');
//   pipWindow.document.body.appendChild(container);
//   return <div ref={node => node && container.appendChild(node)}>{children}</div>;
// };
