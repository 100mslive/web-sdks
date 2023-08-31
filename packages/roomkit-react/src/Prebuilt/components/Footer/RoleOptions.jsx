import React, { useState } from 'react';
import { selectPermissions, useHMSStore } from '@100mslive/react-sdk';
import { MicOffIcon, PersonRectangleIcon, VerticalMenuIcon, VideoOffIcon } from '@100mslive/react-icons';
import { Dropdown } from '../../../Dropdown';
import { Flex } from '../../../Layout';
import { Text } from '../../../Text';

const dropdownItemCSS = { backgroundColor: '$surface_default', gap: '$4' };
const optionTextCSS = { fontWeight: '$semiBold', color: '$on_surface_high', textTransform: 'none' };

export const RoleOptions = () => {
  const [openOptions, setOpenOptions] = useState(false);
  const permissions = useHMSStore(selectPermissions);
  if (!(permissions?.changeRole || permissions?.mute || permissions?.unmute)) {
    return null;
  }
  return (
    <Dropdown.Root open={openOptions} onOpenChange={setOpenOptions}>
      <Dropdown.Trigger
        onClick={e => e.stopPropagation()}
        className="role_actions"
        asChild
        css={{
          p: '$1',
          r: '$0',
          c: '$on_surface_high',
          visibility: openOptions ? 'visible' : 'hidden',
          '&:hover': {
            bg: '$surface_bright',
          },
          '@md': {
            visibility: 'visible',
          },
        }}
      >
        <Flex>
          <VerticalMenuIcon />
        </Flex>
      </Dropdown.Trigger>
      <Dropdown.Content
        onClick={e => e.stopPropagation()}
        css={{ w: 'max-content', maxWidth: '$64', bg: '$surface_default', py: 0 }}
        align="end"
      >
        {permissions.changeRole && (
          <Dropdown.Item css={dropdownItemCSS}>
            <PersonRectangleIcon />
            <Text variant="sm" css={optionTextCSS}>
              Remove all from Stage
            </Text>
          </Dropdown.Item>
        )}
        {permissions.mute && (
          <>
            <Dropdown.Item css={{ ...dropdownItemCSS, borderTop: '1px solid $border_bright' }}>
              <MicOffIcon />
              <Text variant="sm" css={optionTextCSS}>
                Mute Audio
              </Text>
            </Dropdown.Item>

            <Dropdown.Item css={{ ...dropdownItemCSS, borderTop: '1px solid $border_bright' }}>
              <VideoOffIcon />
              <Text variant="sm" css={optionTextCSS}>
                Mute Video
              </Text>
            </Dropdown.Item>
          </>
        )}
      </Dropdown.Content>
    </Dropdown.Root>
  );
};
