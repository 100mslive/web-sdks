import React from 'react';
import { Meta } from '@storybook/react/types-6-0';
import { Story } from '@storybook/react';
import { Button } from './Button';
import { MicOffIcon } from '@100mslive/react-icons';

export default {
    title: 'Components/Button',
    component: Button,
    argTypes: {
        variant: {
            options: ['primary', 'standard', 'danger'],
            control: {
                type: 'select'
            }
        }
    },
    parameters: {
        controls: { expanded: true }
    }
} as Meta;

// Create a master template for mapping args to render the Button component
const Template: Story = (args) => <Button {...args}>Hello World</Button>;

// With Icons and Text
const WithIconLeft: Story = (args) => (
    <Button {...args}>
        <MicOffIcon style={{ marginRight: '5px' }} /> Mute Peer
    </Button>
);

const WithIconRight: Story = (args) => (
    <Button {...args}>
        Mute Peer <MicOffIcon style={{ marginLeft: '5px' }} />
    </Button>
);

// Reuse that template for creating different stories
export const Primary = Template.bind({});
Primary.args = { variant: 'primary' };

export const Standard = Template.bind({});
Standard.args = { variant: 'standard' };

export const Danger = Template.bind({});
Danger.args = { variant: 'danger' };

export const IconLeft = WithIconLeft.bind({});
WithIconLeft.args = {};

export const IconRight = WithIconRight.bind({});
WithIconRight.args = {};
