import React from 'react';
type PIPWindowProps = {
  pipWindow: Window;
  children: React.ReactNode;
};

export const PIPWindow = ({ pipWindow, children }: PIPWindowProps) => {
  const container = pipWindow.document.createElement('div');
  pipWindow.document.body.appendChild(container);
  return <div ref={node => node && container.appendChild(node)}>{children}</div>;
};
