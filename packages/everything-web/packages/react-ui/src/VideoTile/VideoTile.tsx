import { styled } from '../stitches.config';

const Video = styled('video', {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '$2',
    objectFit: 'cover',
    background: '$grey1',
    transition: 'box-shadow 0.4s ease-in-out',
    variants: {
        local: {
            true: {
                transform: 'scaleX(-1)'
            }
        },
        audioLevel: {
            true: {
                boxShadow: '0px 0px 24px #3d5afe, 0px 0px 16px #3d5afe'
            }
        }
    }
});

const Container = styled('div', {
    position: 'relative',
    borderRadius: '$2',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1rem'
});

export const List = styled('div', {
    display: 'flex',
    width: '100%',
    height: '80vh',
    flexWrap: 'wrap',
    placeContent: 'center',
    alignItems: 'center'
});

export const Overlay = styled('div', {
    position: 'absolute',
    width: '100%',
    height: '100%'
});

export const Info = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: '30px',
    left: '50%',
    transform: 'translateX(-50%)'
});

export const AvatarContainer = styled('div', {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translateX(-50%) translateY(-50%)'
});

const AudioIndicator = styled('div', {
    bg: '$redMain',
    borderRadius: '$round',
    width: '36px',
    height: '36px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    mb: '5px'
});

interface VideoTileType {
    Video: typeof Video;
    Container: typeof Container;
    Overlay: typeof Overlay;
    Info: typeof Info;
    AudioIndicator: typeof AudioIndicator;
    AvatarContainer: typeof AvatarContainer;
}

export const VideoTile: VideoTileType = {
    Video,
    Container,
    Overlay,
    Info,
    AudioIndicator,
    AvatarContainer
};
