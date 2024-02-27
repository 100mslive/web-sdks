import React, { MouseEventHandler } from 'react';
import { IconButton, Tooltip } from '../../..';

export const SeekControls = ({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children: React.ReactNode;
}) => {
  return (
    <Tooltip title={title} side="top">
      <IconButton onClick={onClick} data-testid="backward_forward_arrow_btn">
        {children}
      </IconButton>
    </Tooltip>
  );
};
