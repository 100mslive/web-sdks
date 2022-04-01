import React, { Fragment } from 'react';
import { Box, Button, Dialog, Flex, HorizontalDivider, Select, styled, Text } from '@100mslive/react-ui';
import { DialogContent } from './DialogContent';

const ItemRoot = React.memo(({ title, children, divider = true }) => (
  <Fragment>
    <Flex justify="between" align="center" css={{ p: '$8 $4' }}>
      <Text>{title}</Text>
      {children}
    </Flex>
    {divider && <HorizontalDivider />}
  </Fragment>
));

const TextArea = styled('textarea', {
  bg: '$bgSecondary',
  p: '$4 $8',
  color: '$textPrimary',
  resize: 'none',
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
        p: '$8',
        width,
        flexShrink: 0,
        cursor: 'pointer',
      }}
      onClick={() => {
        change('tile_shape', value);
      }}
    >
      {type}
    </Flex>
  );
};

const Fonts = ['Inter', 'Roboto', 'Lato', 'Montserrat', 'Open Sans', 'IBM Plex Sans'];

export default function RoomSettings({ onClose, settings, change, handleLogoChange, onSave, onCancel }) {
  return (
    <Dialog.Root defaultOpen onOpenChange={value => !value && onClose()}>
      <DialogContent title="Customise your app" css={{ width: 'min(700px, 100%)' }}>
        <Flex css={{ size: '100%', overflow: 'hidden' }}>
          <Box css={{ flex: '1 1 0' }}>
            <Text css={{ p: '$8 $4' }}>Theme</Text>
          </Box>
          <Box css={{ flex: '3 1 0' }}>
            <ItemRoot title="Logo">
              <Button variant="standard">Upload</Button>
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
              <Flex align="center">
                <Button
                  variant="standard"
                  css={{ mx: '$4' }}
                  onClick={() => {
                    change('theme', 'dark');
                  }}
                >
                  Dark
                </Button>
                <Button
                  variant="standard"
                  onClick={() => {
                    change('theme', 'light');
                  }}
                >
                  Light
                </Button>
              </Flex>
            </ItemRoot>
            <ItemRoot title="Brand Color">
              <Flex
                as="label"
                htmlFor="brandColorPicker"
                align="center"
                css={{ bg: '$bgSecondary', p: '$4', r: '$1', cursor: 'pointer', overflow: 'hidden' }}
              >
                <Box css={{ w: '$6', h: '$6', r: '$round', bg: settings.brand_color, mr: '$4' }}>
                  <input
                    id="brandColorPicker"
                    type="color"
                    onChange={e => {
                      change('brand_color', e.target.value);
                    }}
                    value={settings.brand_color}
                    style={{ display: 'none' }}
                  />
                </Box>
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
        </Flex>
        <Flex justify="end" align="center">
          <Button variant="standard" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </Flex>
      </DialogContent>
    </Dialog.Root>
  );
}
