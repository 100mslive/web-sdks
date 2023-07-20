import React from 'react';
import { Meta } from '@storybook/react';
import { BottomActionSheet } from './BottomActionSheet';

export default {
  title: 'Components/BottomSheet',
  component: BottomActionSheet,
  argTypes: {
    title: { control: 'text' },
    triggerContent: { control: 'text' },
    containerCSS: { control: 'object' },
    sideOffset: { control: 'number' },
    defaultHeight: { control: 'number' },
  },
} as Meta;

// Dummy content for the BottomSheet
const DummyContent = () => (
  <div>
    <p>This is the content of the BottomSheet.</p>
    <p>You can put any content you like here.</p>
  </div>
);

// Example usage of the BottomSheet component
const Template = args => (
  <BottomActionSheet {...args}>
    <DummyContent />
  </BottomActionSheet>
);

// Example story with default props
export const Default = Template.bind({});
Default.args = {
  title: 'Example BottomSheet',
  triggerContent: <button>Open BottomSheet</button>,
};

// Example story with custom styles
export const CustomStyles = Template.bind({});
CustomStyles.args = {
  title: 'Custom Styled BottomSheet',
  triggerContent: <button>Open Custom BottomSheet</button>,
  containerCSS: {
    backgroundColor: 'lightblue',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  sideOffset: -80,
  defaultHeight: 70,
};
