import { styled } from '../Theme';
import { Flex } from '../Layout';

const Root = styled(Flex, {
  justifyContent: 'space-between',
  alignItems: 'center',
  py: '$2',
  position: 'relative',
  height: '100%',
  '@md': { flexWrap: 'wrap' },
});

const Left = styled(Flex, {
  alignItems: 'center',
  position: 'absolute',
  left: '$10',
  gap: '$4',
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
  gap: '$4',
});

const Right = styled(Flex, {
  alignItems: 'center',
  position: 'absolute',
  right: '$10',
  gap: '$4',
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
