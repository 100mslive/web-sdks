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
  borderColor: '$borderDefault',
  borderBottomRightRadius: 0,
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
  borderColor: '$borderDefault',
  borderBottomLeftRadius: 0,
  borderLeftWidth: 0,
  '&:not([disabled]):focus-visible': {
    boxShadow: 'none',
  },
  '@md': {
    display: 'none',
  },
});

export const IconButtonWithOptions = ({
  tooltipMessage = '',
  icon,
  options = [],
  active,
  onClick = () => {
    return;
  },
  key = '',
}) => {
  const bgCss = { backgroundColor: active ? '$transparent' : '$secondaryDark' };
  return (
    <Flex>
      <IconSection css={bgCss} onClick={onClick} key={key}>
        <Tooltip disabled={!tooltipMessage} title={tooltipMessage}>
          <Box css={{ color: '$textHighEmp' }}>{icon}</Box>
        </Tooltip>
      </IconSection>
      <Dropdown.Root>
        <Dropdown.Trigger asChild>
          <OptionsSection css={bgCss}>
            <Tooltip title="View Options">
              <Box css={{ color: '$textHighEmp' }}>
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
                backgroundColor: option.active ? '$primaryDark' : '$surfaceDark',
                borderTop: index === 0 ? 'none' : '1px solid $borderDefault',
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
