import React from 'react';
import { ComponentMeta } from '@storybook/react';
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from '@100mslive/react-icons';
import { Text } from '..';
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

const Template = () => {
  return (
    <Select.Root defaultValue="blueberry">
      <Select.Trigger>
        <Select.Value />
        <ChevronDownIcon color="white" />
      </Select.Trigger>
      <Select.Content>
        <Select.ScrollUpButton>
          <ChevronUpIcon />
        </Select.ScrollUpButton>
        <Select.Viewport>
          {Object.keys(data).map((item: string, index: number) => (
            <>
              <Select.Group>
                <Select.Label>
                  <Text variant="xs" css={{ color: '$textMedEmp' }}>
                    {item}
                  </Text>
                </Select.Label>
                {data[item].map((type: { id: string; name: string }) => (
                  <Select.Item value={type?.id}>
                    <Select.ItemText>
                      <Text variant="md">{type?.name}</Text>
                    </Select.ItemText>
                    <Select.ItemIndicator>
                      <CheckIcon />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Group>
              {index < Object.keys(data).length - 1 && <Select.Separator />}
            </>
          ))}
        </Select.Viewport>
        <Select.ScrollDownButton>
          <ChevronDownIcon />
        </Select.ScrollDownButton>
      </Select.Content>
    </Select.Root>
  );
};

export const ReactSelectContent = Template.bind({});
