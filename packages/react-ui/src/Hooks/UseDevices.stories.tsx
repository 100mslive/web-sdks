import React, { useState } from 'react';
import { Box, Flex } from '../Layout';
import { DeviceType, useDevices } from '@100mslive/react-sdk';
import { Text } from '../Text';
import { Dropdown } from '../Dropdown';
import { ChevronDownIcon, ChevronUpIcon, SpeakerIcon } from '@100mslive/react-icons';

const DialogDropdownTrigger = ({ title, css, open, icon, titleCSS = {} }) => {
  return (
    <Dropdown.Trigger
      asChild
      data-testid={`${title}_selector`}
      css={{
        border: '1px solid $borderLight',
        bg: '$surfaceLight',
        r: '$1',
        p: '$6 $9',
        zIndex: 10,
        ...css,
      }}
    >
      <Flex
        css={{
          display: 'flex',
          justifyContent: 'space-between',
          color: '$textHighEmp',
          w: '100%',
        }}
      >
        {icon}
        <Text
          css={{
            color: 'inherit',
            flex: '1 1 0',
            mx: '$6',
            ...titleCSS,
          }}
        >
          {title}
        </Text>
        {open ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </Flex>
    </Dropdown.Trigger>
  );
};

const DeviceSelector = ({ title, devices, selection, onChange, icon, children = null }) => {
  const [open, setOpen] = useState(false);
  const selectionBg = '$bgSecondary';

  return (
    <Box css={{ mb: '$10' }}>
      <Text css={{ mb: '$4' }}>{title}</Text>
      <Flex
        align="center"
        css={{
          gap: '$4',
          '@md': {
            flexDirection: children ? 'column' : 'row',
            alignItems: children ? 'start' : 'center',
          },
        }}
      >
        <Box
          css={{
            position: 'relative',
            flex: '1 1 0',
            w: '100%',
            minWidth: 0,
            '@md': {
              mb: children ? '$8' : 0,
            },
          }}
        >
          <Dropdown.Root open={open} onOpenChange={setOpen}>
            <DialogDropdownTrigger
              css={{
                ...(children
                  ? {
                      flex: '1 1 0',
                      minWidth: 0,
                    }
                  : {}),
              }}
              icon={icon}
              title={devices.find(({ deviceId }) => deviceId === selection)?.label || 'Select device from list'}
              open={open}
            />
            <Dropdown.Portal>
              <Dropdown.Content align="start" sideOffset={8} css={{ w: '200px', zIndex: 1000 }}>
                {devices.map(device => {
                  return (
                    <Dropdown.Item
                      key={device.label}
                      onSelect={() => onChange(device.deviceId)}
                      css={{
                        px: '$9',
                        bg: device.deviceId === selection ? selectionBg : undefined,
                      }}
                    >
                      <Text>{device.label}</Text>
                    </Dropdown.Item>
                  );
                })}
              </Dropdown.Content>
            </Dropdown.Portal>
          </Dropdown.Root>
        </Box>
        {children}
      </Flex>
    </Box>
  );
};

const Devices = () => {
  const { allDevices, selectedDeviceIDs, updateDevice } = useDevices();

  return (
    <Flex>
      <DeviceSelector
        title="Speaker"
        icon={<SpeakerIcon />}
        devices={allDevices.audioOutput}
        selection={selectedDeviceIDs.audioOutput}
        onChange={deviceId =>
          updateDevice({
            deviceId,
            deviceType: DeviceType.audioOutput,
          })
        }
        children={null}
      />
    </Flex>
  );
};

const Story = {
  title: 'Hooks/useDevices',
  component: Devices,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
};

export default Story;

export const UseDevices = Devices.bind({});
UseDevices.storyName = 'useDevices';
