import React, { Fragment, useState } from 'react';
import { UploadIcon, CheckIcon } from '@100mslive/react-icons';
import {
  Box,
  Button,
  Dialog,
  Flex,
  HorizontalDivider,
  Select,
  styled,
  Text,
  Checkbox,
  Label,
} from '@100mslive/react-ui';
import { DialogContent } from './DialogContent';

const ItemRoot = React.memo(({ title, children }) => (
  <Fragment>
    <Flex justify="between" align="center" css={{ p: '$8 $4' }}>
      <Text>{title}</Text>
      {children}
    </Flex>
    <HorizontalDivider />
  </Fragment>
));

const TextArea = styled('textarea', {
  bg: '$bgSecondary',
  p: '$4 $8',
  color: '$textPrimary',
  resize: 'none',
});

const ColorPicker = styled('input', {
  w: '$6',
  h: '$6',
  r: '$3',
  mr: '$4',
  cursor: 'pointer',
  '&::-webkit-color-swatch': {
    border: 'none',
  },
});

const TileType = ({ type, active, value, change }) => {
  const [multiplier, divider] = value.split('-').map(Number);
  const width = (80 * multiplier) / divider;
  return (
    <Flex
      align="center"
      justify="center"
      css={{
        h: '$20',
        border: `1px solid ${active ? '$brandDefault' : '$bgSecondary'}`,
        ml: '$4',
        width,
        cursor: 'pointer',
      }}
      onClick={() => {
        change('tile_shape', value);
      }}
    >
      <Text>{type}</Text>
    </Flex>
  );
};

const ThemeType = ({ title, active, onClick }) => {
  return (
    <Box
      css={{ w: '$20', m: '$2', p: '$2 $8', r: '$1', bg: active ? '$menuBg' : '', cursor: 'pointer' }}
      onClick={onClick}
    >
      <Text>{title}</Text>
    </Box>
  );
};

const TabButton = styled('button', {
  p: '$8',
  bg: 'transparent',
  r: '$1',
  my: '$2',
  fontWeight: '$medium',
  textAlign: 'left',
  variants: {
    active: {
      true: {
        bg: '$bgSecondary',
      },
    },
  },
});

const HeadlessItem = React.memo(({ title, children }) => (
  <Fragment>
    <Flex direction="column" css={{ p: '$8 $4' }}>
      <Text variant="h6" css={{ mb: '$4' }}>
        {title}
      </Text>
      {children}
    </Flex>
    <HorizontalDivider />
  </Fragment>
));

const CheckboxItem = ({ onClick, type, label, checked }) => {
  return (
    <Flex align="center" key={type} css={{ my: '$2' }}>
      <Checkbox.Root id={label} checked={checked} onCheckedChange={onClick}>
        <Checkbox.Indicator>
          <CheckIcon width={16} height={16} />
        </Checkbox.Indicator>
      </Checkbox.Root>
      <Label htmlFor={label} css={{ ml: '$4', fontSize: '$sm', cursor: 'pointer' }}>
        {label}
      </Label>
    </Flex>
  );
};

const Fonts = ['Inter', 'Roboto', 'Lato', 'Montserrat', 'Open Sans', 'IBM Plex Sans'];

export default function RoomSettings({ onClose, settings, change, handleLogoChange, onSave, onCancel }) {
  const [tab, setTab] = useState(1);
  const metaData = JSON.parse(settings.metadataFields.metadata);
  const { headlessConfig } = metaData;
  const handleSettingsMetaData = (key, value) => {
    return {
      ...settings.metadataFields,
      metadata: JSON.stringify({
        headlessConfig: {
          ...metaData.headlessConfig,
          [key]: value,
        },
      }),
    };
  };
  return (
    <Dialog.Root defaultOpen onOpenChange={value => !value && onClose()}>
      <DialogContent title="Customise your app" css={{ width: 'min(700px, 100%)' }}>
        <Flex css={{ size: '100%', overflow: 'hidden' }}>
          <Box css={{ flex: '1 1 0', pt: '$6' }}>
            <Flex direction="column">
              <TabButton active={tab === 0} onClick={() => setTab(0)}>
                Theme
              </TabButton>
              <TabButton active={tab === 1} onClick={() => setTab(1)}>
                Headless
              </TabButton>
            </Flex>
          </Box>

          {tab === 0 && (
            <Box css={{ flex: '3 1 0', ml: '$8' }}>
              <ItemRoot title="Logo">
                <Button
                  as="label"
                  htmlFor="logoInput"
                  variant="standard"
                  css={{ bg: '$bgSecondary', cursor: 'pointer', color: '$textPrimary', display: 'flex' }}
                >
                  <UploadIcon />
                  &nbsp; Upload
                </Button>
                <input
                  onChange={handleLogoChange}
                  type="file"
                  accept="image/*"
                  name="logo"
                  id="logoInput"
                  style={{ display: 'none' }}
                />
              </ItemRoot>
              <ItemRoot title="Appearance">
                <Flex align="center" css={{ bg: '$bgSecondary', r: '$1' }}>
                  <ThemeType
                    title="Dark"
                    active={settings.theme === 'dark'}
                    onClick={() => {
                      change('theme', 'dark');
                    }}
                  />
                  <ThemeType
                    title="Light"
                    active={settings.theme === 'light'}
                    onClick={() => {
                      change('theme', 'light');
                    }}
                  />
                </Flex>
              </ItemRoot>
              <ItemRoot title="Brand Color">
                <Flex
                  as="label"
                  htmlFor="brandColorPicker"
                  align="center"
                  css={{ bg: '$bgSecondary', p: '$4', r: '$1', cursor: 'pointer', overflow: 'hidden' }}
                >
                  <ColorPicker
                    type="color"
                    id="brandColorPicker"
                    name="brandColorPicker"
                    css={{ bg: settings.brand_color }}
                    onChange={e => {
                      change('brand_color', e.target.value);
                    }}
                    value={settings.brand_color}
                  />
                  <Text>{settings.brand_color}</Text>
                </Flex>
              </ItemRoot>
              <ItemRoot title="Tile Shape">
                <Flex>
                  <TileType type="Square" value="1-1" active={settings.tile_shape === '1-1'} change={change} />
                  <TileType type="Landscape" value="4-3" active={settings.tile_shape === '4-3'} change={change} />
                  <TileType type="Wide" value="16-9" active={settings.tile_shape === '16-9'} change={change} />
                </Flex>
              </ItemRoot>
              <ItemRoot title="Font Family">
                <Select.Root>
                  <Select.DefaultDownIcon />
                  <Select.Select onChange={e => change('font', e.target.value)} value={settings.font}>
                    {Fonts.map(font => {
                      return (
                        <option value={font} key={font}>
                          {font}
                        </option>
                      );
                    })}
                  </Select.Select>
                </Select.Root>
              </ItemRoot>
              {settings.metadataFields.clicks > 4 && (
                <ItemRoot title="Metadata">
                  <TextArea
                    onChange={e => {
                      change('metadataFields', {
                        ...settings.metadataFields,
                        metadata: e.target.value,
                      });
                    }}
                    value={settings.metadataFields.metadata}
                  ></TextArea>
                </ItemRoot>
              )}
            </Box>
          )}

          {tab === 1 && (
            <Box css={{ flex: '3 1 0', ml: '$8' }}>
              <HeadlessItem title="Visible UI Elements">
                <CheckboxItem
                  checked={headlessConfig.hideAudioLevel}
                  label="Audio Level Border"
                  onClick={() => {
                    change('metadataFields', handleSettingsMetaData('hideAudioLevel', !headlessConfig.hideAudioLevel));
                  }}
                />
                <CheckboxItem
                  checked={headlessConfig.hideTileAudioMute}
                  label="Audio Mute on Tile"
                  onClick={() => {
                    change(
                      'metadataFields',
                      handleSettingsMetaData('hideTileAudioMute', !headlessConfig.hideTileAudioMute),
                    );
                  }}
                />
                <CheckboxItem
                  checked={headlessConfig.hideTileName}
                  label="Name on Tile"
                  onClick={() => {
                    change('metadataFields', handleSettingsMetaData('hideTileName', !headlessConfig.hideTileName));
                  }}
                />
              </HeadlessItem>
            </Box>
          )}
        </Flex>
        <Flex justify="end" align="center" css={{ mt: '$8' }}>
          <Button variant="standard" css={{ mr: '$8' }} onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </Flex>
      </DialogContent>
    </Dialog.Root>
  );
}
