import { VerticalMenuIcon } from '@100mslive/react-icons';
import { Dropdown } from '../../Dropdown';
import { Box, Flex } from '../../Layout';
import { styled } from '../../Theme';
import { Tooltip } from '../../Tooltip';
import IconButton from '../IconButton';

const IconSection = styled(IconButton, {
  h: '$14',
  px: '$8',
  r: '$1',
  borderTopRightRadius: 0,
  borderBottomRightRadius: 0,
  '@md': {
    px: '$4',
    mx: 0,
    borderTopRightRadius: '$1',
    borderBottomRightRadius: '$1',
  },
});

const OptionsSection = styled(IconSection, {
  display: 'block',
  borderTopLeftRadius: 0,
  borderBottomLeftRadius: 0,
  borderTopRightRadius: '$1',
  borderBottomRightRadius: '$1',
  borderLeftWidth: 0,
  w: '$4',
  '@md': {
    display: 'none',
  },
});

export const IconButtonWithOptions = ({ tooltipMessage, icon, options = [], buttonProps }) => {
  return (
    <Flex>
      <IconSection {...buttonProps}>
        <Tooltip title={tooltipMessage}>
          <Box>{icon}</Box>
        </Tooltip>
      </IconSection>
      <Dropdown.Root>
        <Dropdown.Trigger asChild>
          <OptionsSection>
            <Tooltip title="View Options">
              <Box>
                <VerticalMenuIcon />
              </Box>
            </Tooltip>
          </OptionsSection>
        </Dropdown.Trigger>
        <Dropdown.Content
          sideOffset={5}
          css={{
            w: '$96',
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
                px: '$10',
                pt: '$10',
                pb: '$6',
                '&:hover': {
                  bg: '$transparent',
                  cursor: 'default',
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
