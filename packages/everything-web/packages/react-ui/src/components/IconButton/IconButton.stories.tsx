import React from 'react';
import { Meta } from '@storybook/react/types-6-0';
import { Story } from '@storybook/react';
import { IconButton } from './IconButton';
import { MicOffIcon } from '@100mslive/react-icons';

export default {
    title: 'Components/IconButton',
    component: IconButton,
    argTypes: {
        active: {
            options: [true, false],
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
const Template: Story = (args) => (
    <IconButton {...args}>
        <MicOffIcon />
    </IconButton>
);

export const Default = Template.bind({});

export const Active = Template.bind({});
Default.args = { active: true };
