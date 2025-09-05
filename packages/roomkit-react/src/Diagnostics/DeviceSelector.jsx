import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Dropdown } from '../Dropdown';
import { Box, Flex } from '../Layout';
import { DialogDropdownTrigger } from '../Prebuilt/primitives/DropdownTrigger';
import { Text } from '../Text';

export const DeviceSelector = ({ title, devices, selection, onChange, icon, children = null }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  return (
    <Box css={{ mb: '6' }}>
      <Text css={{ mb: '4' }}>{title}</Text>
      <Flex
        align="center"
        css={{
          gap: '4',
          '@md': {
            flexDirection: children ? 'column' : 'row',
            alignItems: children ? 'start' : 'center',
          },
        }}
      >
        <Dropdown.Root open={open} onOpenChange={setOpen}>
          <DialogDropdownTrigger
            ref={ref}
            icon={icon}
            title={devices.find(({ deviceId }) => deviceId === selection)?.label || 'Select device from list'}
            open={open}
          />
          <Dropdown.Portal>
            <Dropdown.Content
              align="start"
              sideOffset={8}
              css={{
                w:
                  // @ts-ignore
                  ref.current?.clientWidth,
                zIndex: 1001,
              }}
            >
              {devices.map(device => {
                return (
                  <Dropdown.Item
                    key={device.label}
                    onSelect={() => onChange(device.deviceId)}
                    css={{
                      px: '9',
                    }}
                  >
                    {device.label}
                  </Dropdown.Item>
                );
              })}
            </Dropdown.Content>
          </Dropdown.Portal>
        </Dropdown.Root>
        {children}
      </Flex>
    </Box>
  );
};

DeviceSelector.propTypes = {
  title: PropTypes.string.isRequired,
  devices: PropTypes.array.isRequired,
  selection: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  icon: PropTypes.node,
  children: PropTypes.node,
};
