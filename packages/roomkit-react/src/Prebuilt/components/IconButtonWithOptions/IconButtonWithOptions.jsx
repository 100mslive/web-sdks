import { VerticalMenuIcon } from '@100mslive/react-icons';
import { Dropdown } from '../../../Dropdown';
import { Box, Flex } from '../../../Layout';
import { styled } from '../../../Theme';
import { Tooltip } from '../../../Tooltip';
import IconButton from '../../IconButton';

const IconSection = styled(IconButton, {
  w: 'unset',
  h: 'unset',
  p: '$4',
  r: '$1',
  borderTopRightRadius: 0,
  borderBottomRightRadius: 0,
  '@md': {
    mx: 0,
    borderTopRightRadius: '$1',
    borderBottomRightRadius: '$1',
  },
});

const OptionsSection = styled(IconButton, {
  w: 'unset',
  h: 'unset',
  p: '$4',
  r: '$1',
  borderTopLeftRadius: 0,
  borderBottomLeftRadius: 0,
  borderLeftWidth: 0,
  '@md': {
    display: 'none',
  },
});

export const IconButtonWithOptions = ({
  tooltipMessage,
  icon,
  options = [],
  backgroundColor = '$surfaceDefault',
  // enabledColor = '$transparent',
  // disabledColor = '$surfaceDefault',
  // hoveredColor = '$surfaceLight',
  buttonProps,
}) => {
  return (
    <Flex>
      <IconSection css={{ backgroundColor }} {...buttonProps}>
        <Tooltip title={tooltipMessage}>
          <Box>{icon}</Box>
        </Tooltip>
      </IconSection>
      <Dropdown.Root>
        <Dropdown.Trigger asChild>
          <OptionsSection css={{ backgroundColor }}>
            <Tooltip title="View Options">
              <Box>
                <VerticalMenuIcon />
              </Box>
            </Tooltip>
          </OptionsSection>
        </Dropdown.Trigger>
        <Dropdown.Content
          sideOffset={5}
          align="center"
          css={{
            w: '$48',
            maxHeight: '$96',
            p: 0,
          }}
        >
          {options.map(option => (
            <Dropdown.Item
              key={option.title}
              css={{
                flexDirection: 'column',
                alignItems: 'flex-start',
                p: '$8',
                borderTop: '1px solid $borderLight',
                '&:hover': {
                  cursor: 'pointer',
                },
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
