import { Flex, styled } from '../../..';

export const VideoControls = styled(Flex, {
  justifyContent: 'center',
  alignItems: 'center',
  alignSelf: 'stretch',
  width: '100%',
  gap: '2',
});

export const LeftControls = styled(Flex, {
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  gap: '4',
});
export const RightControls = styled(Flex, {
  justifyContent: 'flex-end',
  alignItems: 'center',
  width: '100%',
  gap: '4',
});
