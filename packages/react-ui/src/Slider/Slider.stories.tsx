import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Slider } from './Slider';
import { Box } from '..';

export default {
  title: 'UI Components/Slider',
  component: Slider,
} as ComponentMeta<typeof Slider>;

const Template: ComponentStory<typeof Slider> = () => {
  const [volume, setVolume] = React.useState<number>(25);
  return (
    <Box css={{ width: '$80' }}>
      <Slider defaultValue={[25]} step={1} value={[volume]} onValueChange={e => setVolume(e[0])} />
    </Box>
  );
};

export const Primary = Template.bind({});
Primary.storyName = 'Slider';
