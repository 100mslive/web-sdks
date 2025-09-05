import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { ChevronDownIcon, ChevronUpIcon, PeopleIcon } from '@100mslive/react-icons';
import { Avatar, Box, Flex, Text, textEllipsis } from '..';
import { Dropdown } from './Dropdown';

export default {
  title: 'UI Components/Dropdown',
  component: Dropdown.Content,
} as ComponentMeta<typeof Dropdown.Content>;

const participants = [
  { id: '231313', name: 'Simbrella', roleName: 'Student' },
  { id: '768456', name: 'Jonty', roleName: 'Student' },
];

const Template: ComponentStory<typeof Dropdown.Content> = () => {
  const [open, setOpen] = React.useState(true);

  return (
    <Dropdown.Root
      open
      onOpenChange={() => {
        setOpen(!open);
      }}
    >
      <Dropdown.Trigger asChild>
        <Box
          css={{
            color: 'onSurface.high',
            borderRadius: '1',
            border: '1px solid $border_default',
            padding: '$4 $4',
            width: '80',
          }}
        >
          <Box css={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box css={{ display: 'flex', gap: '4', mr: '4' }}>
              <PeopleIcon />
              <Text variant="md">2</Text>
            </Box>
            <Flex>{open ? <ChevronUpIcon /> : <ChevronDownIcon />}</Flex>
          </Box>
        </Box>
      </Dropdown.Trigger>
      {open && (
        <Dropdown.Content sideOffset={5} align="start" css={{ height: 'auto', maxHeight: '96' }}>
          <Dropdown.Group
            css={{
              h: 'auto',
              flexDirection: 'column',
              flexWrap: 'wrap',
              alignItems: 'flex-start',
            }}
          >
            <Dropdown.Label css={{ w: 'initial ' }}>
              <Text variant="md" data-testid="role_student">
                {'Students '}({participants.length})
              </Text>
            </Dropdown.Label>
            {participants.map((peer, i) => (
              <Dropdown.Item css={{ justifyContent: 'space-between' }} data-testid={`participant_${i}`}>
                <Flex>
                  <Box css={{ width: '16' }}>
                    <Avatar
                      name={peer.name}
                      css={{
                        position: 'unset',
                        transform: 'unset',
                        mr: '4',
                        fontSize: 'sm',
                      }}
                    />
                  </Box>
                  <Flex direction="column">
                    <Text variant="md" css={{ ...textEllipsis(150), fontWeight: '$semiBold' }}>
                      {peer.name}
                    </Text>
                    <Text variant="sub2" css={{ color: 'onSurface.medium' }}>
                      {peer.roleName}
                    </Text>
                  </Flex>
                </Flex>
              </Dropdown.Item>
            ))}
          </Dropdown.Group>
        </Dropdown.Content>
      )}
    </Dropdown.Root>
  );
};

export const DropdownContent = Template.bind({});
DropdownContent.storyName = 'Dropdown';
