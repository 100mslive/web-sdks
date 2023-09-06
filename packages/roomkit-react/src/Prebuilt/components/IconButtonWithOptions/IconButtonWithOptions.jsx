import React from 'react';
import { VerticalMenuIcon } from '@100mslive/react-icons';
import { Dropdown } from '../../../Dropdown';
import { Box, Flex } from '../../../Layout';
import { styled } from '../../../Theme';
import { Tooltip } from '../../../Tooltip';
import IconButton from '../../IconButton';

const IconSection = styled(IconButton, {
  w: 'unset',
  h: '$14',
  p: '$4',
  r: '$1',
  borderTopRightRadius: 0,
  borderColor: '$border_default',
  borderBottomRightRadius: 0,
  position: 'relative',
  '&:not([disabled]):focus-visible': {
    zIndex: 1,
  },
  '@md': {
    mx: 0,
    borderTopRightRadius: '$1',
    borderBottomRightRadius: '$1',
  },
});

const OptionsSection = styled(IconButton, {
  w: 'unset',
  h: '$14',
  p: '$4',
  r: '$1',
  borderTopLeftRadius: 0,
  borderColor: '$border_default',
  borderBottomLeftRadius: 0,
  borderLeftWidth: 0,
  position: 'relative',
  '&:not([disabled]):focus-visible': {
    zIndex: 1,
  },
  '@md': {
    display: 'none',
  },
});

export const IconButtonWithOptions = ({
  disabled = false,
  onDisabledClick = () => {
    return;
  },
  tooltipMessage = '',
  icon,
  options = [],
  active,
  onClick = () => {
    return;
  },
}) => {
  const bgCss = { backgroundColor: disabled ? '$surface_brighter' : active ? '$transparent' : '$secondary_dim' };
  const iconCss = { color: disabled ? '$on_surface_low' : active ? '$on_surface_high' : '$on_primary_high' };

  return (
    <Flex>
      <IconSection css={bgCss} onClick={onClick}>
        <Tooltip disabled={!tooltipMessage} title={tooltipMessage}>
          <Flex align="center" justify="center" css={iconCss}>
            {icon}
          </Flex>
        </Tooltip>
      </IconSection>
      <Dropdown.Root>
        <Dropdown.Trigger
          asChild
          // onClick does not work
          onPointerDown={e => {
            if (disabled) {
              e.preventDefault();
              onDisabledClick();
            }
          }}
        >
          <OptionsSection css={bgCss}>
            <Tooltip title="View Options">
              <Box css={iconCss}>
                <VerticalMenuIcon />
              </Box>
            </Tooltip>
          </OptionsSection>
        </Dropdown.Trigger>
        <Dropdown.Content
          sideOffset={5}
          align="center"
          css={{
            w: '$64',
            maxHeight: '$96',
            p: 0,
            border: 'none',
          }}
        >
          {options.map((option, index) => (
            <Dropdown.Item
              key={option.title}
              css={{
                flexDirection: 'column',
                alignItems: 'flex-start',
                backgroundColor: option.active ? '$surface_bright' : '$surface_dim',
                borderTop: index === 0 ? 'none' : '1px solid $border_default',
                '&:hover': {
                  cursor: 'pointer',
                },
                p: '0',
              }}
            >
              {option.content}
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown.Root>
    </Flex>
  );
};
