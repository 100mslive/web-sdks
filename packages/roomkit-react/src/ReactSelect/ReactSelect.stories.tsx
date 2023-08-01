import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@100mslive/react-icons';
import { Flex } from '../Layout';
import { Text } from '../Text';
import { Select } from './ReactSelect';

export default {
  title: 'UI Components/ReactSelect',
  component: Select.Root,
} as ComponentMeta<typeof Select.Root>;

const data: {
  [key: string]: { id: string; name: string }[];
} = {
  FRUITS: [
    { id: 'apple', name: 'Apple' },
    { id: 'banana', name: 'Banana' },
    { id: 'blueberry', name: 'Blueberry' },
    { id: 'grapes', name: 'Grapes' },
    { id: 'pineapple', name: 'Pineapple' },
  ],
  VEGETABLES: [
    { id: 'aubergine', name: 'Aubergine' },
    { id: 'broccoli', name: 'Broccoli' },
    { id: 'carrot', name: 'Carrot' },
    { id: 'courgette', name: 'Courgette' },
  ],
  MEATS: [
    { id: 'beef', name: 'Beef' },
    { id: 'chicken', name: 'Chicken' },
    { id: 'lamb', name: 'Lamb' },
    { id: 'pork', name: 'Pork' },
  ],
};

const Template: ComponentStory<typeof Select.Root> = () => {
  return (
    <Select.Root defaultValue="blueberry">
      <Select.Trigger css={{ bg: '$background_dim' }}>
        <Select.Value />
        <Flex css={{ color: '$on_primary_high' }}>
          <ChevronDownIcon />
        </Flex>
      </Select.Trigger>
      <Select.Content>
        <Select.ScrollUpButton css={{ color: '$on_primary_high' }}>
          <ChevronUpIcon />
        </Select.ScrollUpButton>
        <Select.Viewport>
          {Object.keys(data).map((item: string, index: number) => (
            <>
              <Select.Group>
                <Select.Label>
                  <Text variant="xs" css={{ color: '$on_primary_medium' }}>
                    {item}
                  </Text>
                </Select.Label>
                {data[item].map((type: { id: string; name: string }) => (
                  <Select.Item value={type?.id}>
                    <Select.ItemText>
                      <Text variant="md">{type?.name}</Text>
                    </Select.ItemText>
                    <Select.ItemIndicator css={{ color: '$on_primary_high' }}>
                      <CheckIcon />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Group>
              {index < Object.keys(data).length - 1 && <Select.Separator css={{ bg: '$border_default' }} />}
            </>
          ))}
        </Select.Viewport>
        <Select.ScrollDownButton css={{ color: '$on_primary_high' }}>
          <ChevronDownIcon />
        </Select.ScrollDownButton>
      </Select.Content>
    </Select.Root>
  );
};

export const WithGroup = Template.bind({});
WithGroup.storyName = 'ReactSelect';
