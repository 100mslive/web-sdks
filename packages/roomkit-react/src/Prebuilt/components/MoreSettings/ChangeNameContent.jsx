import React from 'react';
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
}) => {
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
          borderBottom: isMobile ? '1px solid $border_default' : '',
          pb: '$6',
          mb: '$8',
          px: isMobile ? '$8' : '',
        }}
      >
        {isMobile ? <ChevronLeftIcon onClick={onBackClick} style={{ marginRight: '0.5rem' }} /> : null}
        Change Name
        <Box css={{ color: 'inherit', ml: 'auto' }} onClick={onExit}>
          <CrossIcon />
        </Box>
      </Text>
      <Flex justify="center" align="center" css={{ my: '$8', w: '100%', px: isMobile ? '$8' : '' }}>
        <Input
          css={{ width: '100%', bg: '$surface_default' }}
          value={currentName}
          onChange={e => {
            setCurrentName(e.target.value);
          }}
          autoComplete="name"
          required
          data-testid="change_name_field"
        />
      </Flex>

      <Flex
        justify="between"
        align="center"
        css={{
          width: '100%',
          gap: '$md',
          mt: '$10',
          px: isMobile ? '$4' : '',
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
          disabled={!currentName.trim() || currentName.trim() === localPeerName}
          data-testid="popup_change_btn"
        >
          Change
        </Button>
      </Flex>
    </form>
  );
};
