import { ComponentMeta } from '@storybook/react';
import { Slider } from './Slider';
import React from 'react';

export default {
  title: 'UI Components/Slider',
  component: Slider,
} as ComponentMeta<typeof Slider>;

const Template = () => {
  const [volume, setVolume] = React.useState<number>(25);
  return (
    <Slider
      defaultValue={[25]} 
      step={1} 
      value={[volume]}
      onValueChange={e => setVolume(e[0])}
    />
  );
};

export const Primary = Template.bind({});
