import React from 'react';
import { IconGallery, IconItem } from '@storybook/addon-docs';
import * as icons from '@100mslive/react-icons';

const IconsList = () => {
  return (
    <IconGallery>
      {Object.entries(icons).map(([name, Component]) => (
        <IconItem name={name} key={name}>
          <Component />
        </IconItem>
      ))}
    </IconGallery>
  );
};

export default IconsList;
