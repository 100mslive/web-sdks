import { useMedia } from 'react-use';
import { VolumeTwoIcon } from '@100mslive/react-icons';
import { Button, config, Dialog, IconButton, Text } from '../../..';
// @ts-ignore
import { DialogContent, DialogRow } from '../../primitives/DialogContent';
import { useIsLandscape } from '../../common/hooks';

export function HLSAutoplayBlockedPrompt({
  open,
  unblockAutoPlay,
}: {
  open: boolean;
  unblockAutoPlay: () => Promise<void>;
}) {
  const isLandscape = useIsLandscape();
  const isMobile = useMedia(config.media.md);
  if ((isMobile || isLandscape) && open) {
    return (
      <IconButton
        css={{
          border: '1px solid white',
          bg: 'white',
          color: '#000',
          r: '$2',
        }}
        onClick={async () => await unblockAutoPlay()}
      >
        <VolumeTwoIcon width="32" height="32" />
        <Text
          variant="body1"
          css={{
            fontWeight: '$semiBold',
            px: '$2',
            color: '#000',
          }}
        >
          Tap To Unmute
        </Text>
      </IconButton>
    );
  }
  return (
    <Dialog.Root
      open={open}
      onOpenChange={async value => {
        if (!value) {
          await unblockAutoPlay();
        }
      }}
    >
      <DialogContent title="Attention" closeable={false}>
        <DialogRow>
          <Text variant="md">
            The browser wants us to get a confirmation for playing the HLS Stream. Please click "play stream" to
            proceed.
          </Text>
        </DialogRow>
        <DialogRow justify="end">
          <Button
            variant="primary"
            onClick={async () => {
              await unblockAutoPlay();
            }}
          >
            Play stream
          </Button>
        </DialogRow>
      </DialogContent>
    </Dialog.Root>
  );
}
