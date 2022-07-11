import React from 'react';
import { ComponentMeta } from '@storybook/react';
import { Box } from '..';
import { Slider } from './Slider';

export default {
  title: 'UI Components/Slider',
  component: Slider,
} as ComponentMeta<typeof Slider>;

const Template = () => {
  const [volume, setVolume] = React.useState<number>(25);
  return (
    <Box css={{ width: '$80' }}>
      <Slider defaultValue={[25]} step={1} value={[volume]} onValueChange={e => setVolume(e[0])} />
    </Box>
  );
};

export const Primary = Template.bind({});
