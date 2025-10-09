import { Dispatch, SetStateAction } from 'react';
import { AlertTriangleIcon, CrossIcon } from '@100mslive/react-icons';
import { Button } from '../../../../Button';
import { Box, Flex } from '../../../../Layout';
import { Dialog } from '../../../../Modal';
import { Text } from '../../../../Text';

export const DeleteQuestionModal = ({
  open,
  setOpen,
  removeQuestion,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  removeQuestion: () => void;
}) => {
  return (
    <Dialog.Root open={open}>
      <Dialog.Overlay />
      <Dialog.Portal>
        <Dialog.Content css={{ p: '$10' }}>
          <Box>
            <Flex
              css={{
                color: '$alert_error_default',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <AlertTriangleIcon style={{ marginRight: '0.5rem' }} />
              <Text variant="lg" css={{ color: 'inherit', fontWeight: '$semiBold' }}>
                Delete Question?
              </Text>

              <Box
                css={{
                  ml: 'auto',
                  color: '$on_surface_medium',
                  '&:hover': { color: '$on_surface_high', cursor: 'pointer' },
                }}
                onClick={() => setOpen(false)}
              >
                <CrossIcon />
              </Box>
            </Flex>
            <Text variant="sm" css={{ color: '$on_surface_medium', mb: '$8', mt: '$4' }}>
              The question will be deleted. You can't undo this action.
            </Text>
            <Flex css={{ w: '100%', mt: '$12', gap: '$md' }}>
              <Button
                variant="standard"
                outlined
                onClick={() => setOpen(false)}
                css={{ w: '100%', fontSize: '$md', fontWeight: '$semiBold' }}
              >
                Cancel
              </Button>
              <Button
                css={{ w: '100%', fontSize: '$md', fontWeight: '$semiBold' }}
                variant="danger"
                onClick={() => {
                  removeQuestion();
                  setOpen(false);
                }}
              >
                Delete
              </Button>
            </Flex>
          </Box>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
