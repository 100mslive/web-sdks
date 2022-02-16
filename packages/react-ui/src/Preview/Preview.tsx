import { styled } from '../Theme';
import { flexCenter } from '../utils/styles';

const Page = styled('div', {
  width: '100%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'Black',
});

const Container = styled('div', {
  padding: '3rem 7.5rem',
  borderRadius: '12px',
  backgroundColor: '$grey1',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  '@md': {
    padding: '3rem 0rem',
  },
});

const Controls = styled('div', {
  position: 'absolute',
  bottom: '10px',
  left: '50%',
  zIndex: 20,
  transform: 'translate(-50%, 0)',
  display: 'flex',
  '& > * + *': {
    marginRight: '0',
    marginLeft: '0.5rem',
  },
});

const Setting = styled('div', {
  position: 'absolute',
  bottom: '10px',
  right: '20px',
  zIndex: 20,
});

const BottomOverlay = styled('div', {
  display: 'flex',
  position: 'absolute',
  bottom: ' 0px',
  width: '100%',
  zIndex: 10,
  height: '100px',
  borderRadius: '0.5rem',
  background: 'linear-gradient(0deg,rgba(0,0,0,.8),transparent)',
});

const VideoRoot = styled('div', {
  width: '360px',
  height: '360px',
  position: 'relative',
  backgroundColor: '$grey1',
  borderRadius: '8px',
  transition: 'box-shadow 0.4s ease-in-out',
  ...flexCenter,
  variants: {
    audioLevel: {
      true: {
        boxShadow: '0px 0px 24px #3d5afe, 0px 0px 16px #3d5afe',
      },
    },
  },
});

const Video = styled('video', {
  objectFit: 'cover',
  width: '100%',
  height: '100%',
  borderRadius: '8px',
  variants: {
    local: {
      true: {
        transform: 'scaleX(-1)',
      },
    },
  },
});

interface PreviewType {
  Page: typeof Page;
  Container: typeof Container;
  Controls: typeof Controls;
  BottomOverlay: typeof BottomOverlay;
  Video: typeof Video;
  VideoRoot: typeof VideoRoot;
  Setting: typeof Setting;
}

export const Preview: PreviewType = {
  Page,
  Container,
  Controls,
  BottomOverlay,
  Video,
  VideoRoot,
  Setting,
};
