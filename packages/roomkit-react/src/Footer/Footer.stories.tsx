import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import {
  BrbIcon,
  ChatIcon,
  EndStreamIcon,
  MicOnIcon,
  PipIcon,
  ShareScreenIcon,
  VideoOnIcon,
} from '@100mslive/react-icons';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Footer } from '.';

export default {
  title: 'UI Components/Footer',
  component: Footer.Root,
  argTypes: {
    as: { table: { disable: true } },
    css: { control: { type: 'object' } },
  },
} as ComponentMeta<typeof Footer.Root>;

const Template: ComponentStory<typeof Footer.Root> = ({ css }) => {
  return (
    <Footer.Root css={css}>
      <Footer.Left>
        <IconButton>
          <MicOnIcon />
        </IconButton>
        <IconButton>
          <VideoOnIcon />
        </IconButton>
      </Footer.Left>
      <Footer.Center>
        <IconButton>
          <ShareScreenIcon />
        </IconButton>
        <IconButton>
          <PipIcon />
        </IconButton>
        <Button>
          <EndStreamIcon />
          End Stream
        </Button>
      </Footer.Center>
      <Footer.Right>
        <IconButton>
          <BrbIcon />
        </IconButton>
        <IconButton>
          <ChatIcon />
        </IconButton>
      </Footer.Right>
    </Footer.Root>
  );
};

export const Example = Template.bind({});
Example.storyName = 'Footer';
