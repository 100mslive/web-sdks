import { HMSPeer } from '@100mslive/react-sdk';
import { StyledVideoTile, Video } from '@100mslive/react-ui';

export default {
  title: 'Example/VideoTile',
  component: StyledVideoTile,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {},
};

const peer: HMSPeer = {
  id: '1',
  name: 'Alex Tinmayson',
  auxiliaryTracks: [],
  isLocal: false,
  audioTrack: '100',
  videoTrack: '1',
};

const Template: React.FC<{ peer: HMSPeer }> = ({ peer }) => {
  return (
    <StyledVideoTile.Root css={{ width: 300, height: 300 }}>
      <StyledVideoTile.Container>
        <Video trackId={peer.videoTrack} />
        <StyledVideoTile.Info>{peer.name}</StyledVideoTile.Info>
      </StyledVideoTile.Container>
    </StyledVideoTile.Root>
  );
};

StyledVideoTile.Root.displayName = 'TestTile';

export const Simple = Template.bind({});

// @ts-ignore
Simple.args = {
  peer,
};
