import React, { useState } from 'react';
import { LinkIcon } from '@100mslive/react-icons';
import { Button, Dialog, Dropdown, Flex, Input, Text } from '../../../';
import { useSetAppDataByKey } from '../AppData/useUISettings';
import { APP_DATA } from '../../common/constants';

export const EmbedUrl = ({ setShowOpenUrl }) => {
  if (!window.CropTarget) {
    return null;
  }

  return (
    <Dropdown.Item
      onClick={() => {
        setShowOpenUrl(true);
      }}
      data-testid="embed_url_btn"
    >
      <LinkIcon />
      <Text variant="sm" css={{ ml: '4' }}>
        Embed URL
      </Text>
    </Dropdown.Item>
  );
};

export function EmbedUrlModal({ onOpenChange }) {
  const [embedConfig, setEmbedConfig] = useSetAppDataByKey(APP_DATA.embedConfig);
  const [url, setUrl] = useState(embedConfig?.url || '');

  return (
    <Dialog.Root defaultOpen onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content css={{ w: 'min(420px, 90%)', p: '8', bg: 'surface.dim' }}>
          <Dialog.Title
            css={{
              borderBottom: '1px solid $border_default',
              color: 'onSurface.high',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Embed URL
          </Dialog.Title>
          <Text variant="sm" css={{ color: 'onSurface.medium', mt: '4', mb: '8' }}>
            Ensure that you're sharing the current tab when the prompt opens. Note that not all websites support being
            embedded.
          </Text>
          <Text variant="sm" css={{ color: 'onSurface.high' }}>
            URL
          </Text>
          <Input
            css={{ w: '100%', mt: '4' }}
            placeholder="Enter your URL"
            value={url}
            onChange={e => setUrl(e.target.value)}
            type="url"
          />
          <Flex justify="between" css={{ w: '100%', gap: '8', mt: '8' }}>
            <Button outlined variant="standard" css={{ w: '100%' }} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              css={{ w: '100%' }}
              type="submit"
              disabled={!url.toString().trim()}
              onClick={() => {
                setEmbedConfig({ url, shareScreen: true });
                onOpenChange(false);
              }}
              data-testid="embed_url_btn"
            >
              Embed and Share
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
