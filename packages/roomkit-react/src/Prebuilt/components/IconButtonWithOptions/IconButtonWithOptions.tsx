import React from 'react';
import { VerticalMenuIcon } from '@100mslive/react-icons';
import { Dropdown } from '../../../Dropdown';
import { Flex } from '../../../Layout';
import { styled } from '../../../Theme';
import { Tooltip } from '../../../Tooltip';
import IconButton from '../../IconButton';

const variants = {
  disabled: {
    true: {
      bg: '$surface_brighter',
    },
  },
  active: {
    false: {
      bg: '$secondary_dim',
    },
  },
};

const IconSection = styled(IconButton, {
  w: 'unset',
  h: '$14',
  p: '$4',
  r: '$1',
  bg: '$transparent',
  borderTopRightRadius: 0,
  borderColor: '$border_bright',
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
  variants: {
    ...variants,
    hideOptions: {
      true: {
        borderTopRightRadius: '$1',
        borderBottomRightRadius: '$1',
      },
    },
  },
});

const OptionsSection = styled(IconButton, {
  w: 'unset',
  h: '$14',
  p: '$4 $2',
  r: '$1',
  borderTopLeftRadius: 0,
  borderColor: '$border_bright',
  borderBottomLeftRadius: 0,
  borderLeftWidth: 0,
  position: 'relative',
  '&:not([disabled]):focus-visible': {
    zIndex: 1,
  },
  '@md': {
    display: 'none',
  },
  variants,
});

const Icon = styled(Flex, {
  alignItems: 'center',
  justifyContent: 'center',
  color: '$on_primary_high',
  variants: {
    disabled: {
      true: {
        color: '$on_surface_low',
      },
    },
    active: {
      true: {
        color: '$on_surface_high',
      },
    },
  },
});

export const IconButtonWithOptions = ({
  disabled = false,
  onDisabledClick = () => {
    return;
  },
  tooltipMessage = '',
  icon,
  children,
  active,
  hideOptions = false,
  onClick = () => {
    return;
  },
}: {
  onClick: () => void;
  onDisabledClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  hideOptions?: boolean;
  active: boolean;
  disabled?: boolean;
  tooltipMessage?: string;
}) => {
  const commonProps = { disabled, active };
  return (
    <Flex>
      <IconSection {...commonProps} onClick={onClick} hideOptions={hideOptions}>
        <Tooltip disabled={!tooltipMessage} title={tooltipMessage}>
          <Icon {...commonProps}>{icon}</Icon>
        </Tooltip>
      </IconSection>
      {!hideOptions && children ? (
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
            <OptionsSection {...commonProps}>
              <Tooltip title="View Options">
                <Icon {...commonProps}>
                  <VerticalMenuIcon />
                </Icon>
              </Tooltip>
            </OptionsSection>
          </Dropdown.Trigger>
          <Dropdown.Content
            sideOffset={5}
            alignOffset={-44}
            align="start"
            side="top"
            css={{
              w: 344,
              maxWidth: '100%',
              maxHeight: 'unset',
              p: 0,
              border: 'none',
              bg: '$surface_dim',
            }}
          >
            {children}
          </Dropdown.Content>
        </Dropdown.Root>
      ) : null}
    </Flex>
  );
};
