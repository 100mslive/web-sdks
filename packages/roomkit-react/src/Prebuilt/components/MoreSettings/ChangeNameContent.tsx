import { useEffect, useRef } from 'react';
import { ChevronLeftIcon, CrossIcon } from '@100mslive/react-icons';
import { Button } from '../../../Button';
import { Input } from '../../../Input';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';

export const ChangeNameContent = ({
  changeName,
  setCurrentName,
  currentName,
  localPeerName,
  isMobile,
  onExit,
  onBackClick,
}: {
  changeName: () => Promise<void>;
  setCurrentName: (name: string) => void;
  currentName?: string;
  localPeerName?: string;
  isMobile: boolean;
  onExit: () => void;
  onBackClick: () => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isMobile) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [isMobile]);

  return (
    <form
      onSubmit={async e => {
        e.preventDefault();
        await changeName();
      }}
    >
      <Text
        variant={isMobile ? 'md' : 'lg'}
        css={{
          color: '$on_surface_high',
          fontWeight: '$semiBold',
          display: 'flex',
          pb: '$4',
          '@md': { px: '$8', borderBottom: '1px solid $border_default' },
        }}
      >
        {isMobile ? <ChevronLeftIcon onClick={onBackClick} style={{ marginRight: '0.5rem' }} /> : null}
        Change Name
        <Box
          css={{ color: 'inherit', ml: 'auto', '&:hover': { color: '$on_surface_medium', cursor: 'pointer' } }}
          onClick={onExit}
        >
          <CrossIcon />
        </Box>
      </Text>
      <Text variant="sm" css={{ color: '$on_surface_medium', pb: '$6', mb: '$8', '@md': { px: '$8', mt: '$4' } }}>
        Your name will be visible to other participants in the session.
      </Text>
      <Flex justify="center" align="center" css={{ my: '$8', w: '100%', '@md': { px: '$8' } }}>
        <Input
          ref={inputRef}
          css={{ width: '100%', bg: '$surface_default' }}
          value={currentName}
          type="text"
          onChange={e => {
            setCurrentName(e.target.value);
          }}
          autoComplete="name"
          required
          data-testid="change_name_field"
          onKeyDown={async e => {
            if (e.key === 'Enter' && currentName && currentName.trim().length > 0 && currentName !== localPeerName) {
              e.preventDefault();
              if (isMobile) {
                return;
              }
              changeName();
            }
          }}
        />
      </Flex>

      <Flex
        justify="between"
        align="center"
        css={{
          width: '100%',
          gap: '$md',
          mt: '$10',
          '@md': { px: '$4' },
        }}
      >
        {isMobile ? null : (
          <Button
            variant="standard"
            css={{ w: '100%' }}
            outlined
            type="submit"
            disabled={!localPeerName}
            onClick={onExit}
          >
            Cancel
          </Button>
        )}

        <Button
          variant="primary"
          css={{ width: '100%' }}
          type="submit"
          disabled={!currentName?.trim() || currentName?.trim() === localPeerName}
          data-testid="popup_change_btn"
        >
          Change
        </Button>
      </Flex>
    </form>
  );
};
