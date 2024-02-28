import React, { MouseEventHandler } from 'react';
import { CSS, IconButton, Tooltip } from '../../..';

export const SeekControls = ({
  title,
  onClick,
  children,
  css,
}: {
  title: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  css: CSS;
  children: React.ReactNode;
}) => {
  return (
    <Tooltip title={title} side="top">
      <IconButton onClick={onClick} data-testid="backward_forward_arrow_btn" css={css}>
        {children}
      </IconButton>
    </Tooltip>
  );
};
