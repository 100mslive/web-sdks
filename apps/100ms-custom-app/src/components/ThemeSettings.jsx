import React, { Fragment } from 'react';
import { UploadIcon } from '@100mslive/react-icons';
import { Box, Button, Flex, HorizontalDivider, Select, styled, Text } from '@100mslive/react-ui';

const Fonts = ['Inter', 'Roboto', 'Lato', 'Montserrat', 'Open Sans', 'IBM Plex Sans'];

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
  return (
    <Flex
      align="center"
      justify="center"
      css={{
        height: '$20',
        aspectRatio: `${multiplier}/${divider}`,
        border: `1px solid ${active ? '$brandDefault' : '$bgSecondary'}`,
        m: '$2',
        cursor: 'pointer',
      }}
      onClick={() => {
        change('tile_shape', value);
      }}
    >
      <Text variant="sm">{type}</Text>
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

const ThemeSettings = ({ handleLogoChange, change, settings }) => {
  return (
    <Fragment>
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
      <ItemRoot title="Tile Aspect Ratio">
        <Flex justify="end" css={{ flexWrap: 'wrap', ml: '$8' }}>
          <TileType type="4:3" value="4-3" active={settings.tile_shape === '4-3'} change={change} />
          <TileType type="16:9" value="16-9" active={settings.tile_shape === '16-9'} change={change} />
          <TileType type="1:1" value="1-1" active={settings.tile_shape === '1-1'} change={change} />
          <TileType type="3:4" value="3-4" active={settings.tile_shape === '3-4'} change={change} />
          <TileType type="9:16" value="9-16" active={settings.tile_shape === '9-16'} change={change} />
        </Flex>
      </ItemRoot>
      <ItemRoot title="Font Family">
        <Select.Root>
          <Select.DefaultDownIcon />
          <Select.Select
            onChange={e => {
              change('font', e.target.value);
              document.documentElement.style.setProperty('--hms-ui-fonts-sans', e.target.value);
            }}
            value={settings.font}
          >
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
    </Fragment>
  );
};

export default ThemeSettings;
