import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { ChevronDownIcon, ChevronUpIcon } from '@100mslive/react-icons';
import { Collapsible } from './Collapsible';
import { Button } from "../Button";
import { Flex } from "../Layout";
import { Text } from "../Text";


export default {
  title: 'UI Components/Collapsible',
  component: Collapsible.Root,
} as ComponentMeta<typeof Collapsible.Root>;

const Template: ComponentStory<typeof Collapsible.Root> = () => {
  const [open, setOpen] = React.useState(true);
  return (<Collapsible.Root open={open} onOpenChange={setOpen}>
  <Flex css={{ alignItems: 'center', justifyContent: 'space-between',w:"$80" }}>
   
    <Collapsible.Trigger css={{w:"100%",display:"flex",flexDirection:"row",justifyContent:"space-between"}}>
    <Text variant="h6">
      @hdz666 starred 3 videos
    </Text>
      <Button style={{borderRadius:"9999px", padding:"4px" }}>{open ? <ChevronDownIcon /> : <ChevronUpIcon />}</Button>
    </Collapsible.Trigger>
  </Flex>



  <Collapsible.Content>
  <Flex className="Repository">
    <span className="Text">@100ms/primitives</span>
  </Flex>
    <Flex className="Repository">
      <span className="Text">@100ms/colors</span>
    </Flex>
    <Flex className="Repository">
      <span className="Text">@100ms/react</span>
    </Flex>
  </Collapsible.Content>
</Collapsible.Root>
  );
};

export const DropdownContent = Template.bind({});
DropdownContent.storyName = 'Dropdown';
