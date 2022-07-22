import { styled } from '../Theme';
import { Flex } from '../Layout';

const Root = styled(Flex, {
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '$2',
  position: 'relative',
  height: '100%',
  '@md': { flexWrap: 'wrap' },
});

const Left = styled(Flex, {
  alignItems: 'center',
  position: 'absolute',
  left: '$7',
  '@md': {
    position: 'unset',
    justifyContent: 'center',
    w: '100%',
    p: '$4 0',
  },
});

const Center = styled(Flex, {
  w: '100%',
  justifyContent: 'center',
  alignItems: 'center',
});

const Right = styled(Flex, {
  alignItems: 'center',
  position: 'absolute',
  right: '$7',
  '@md': {
    display: 'none',
  },
});

export const Footer = {
  Root,
  Left,
  Center,
  Right,
};
