import React, { Fragment } from 'react';
import { CheckIcon } from '@100mslive/react-icons';
import { Label, RadioGroup, Input, Flex, Checkbox, HorizontalDivider, Text } from '@100mslive/react-ui';

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

const StreamingRecordingSettings = ({ change, settings }) => {
  const metaData = JSON.parse(settings.metadataFields.metadata || '{}');
  const { headlessConfig } = metaData;
  const handleSettingsMetaData = (key, value) => {
    return {
      ...settings.metadataFields,
      metadata: JSON.stringify({
        headlessConfig: {
          ...(metaData.headlessConfig || {}),
          [key]: value,
        },
      }),
    };
  };
  return (
    <Fragment>
      <HeadlessItem title="Visible UI Elements">
        <CheckboxItem
          checked={!headlessConfig?.hideAudioLevel}
          label="Audio Level Border"
          onClick={() => {
            change('metadataFields', handleSettingsMetaData('hideAudioLevel', !headlessConfig?.hideAudioLevel));
          }}
        />
        <CheckboxItem
          checked={!headlessConfig?.hideTileAudioMute}
          label="Audio Mute on Tile"
          onClick={() => {
            change('metadataFields', handleSettingsMetaData('hideTileAudioMute', !headlessConfig?.hideTileAudioMute));
          }}
        />
        <CheckboxItem
          checked={!headlessConfig?.hideTileName}
          label="Name on Tile"
          onClick={() => {
            change('metadataFields', handleSettingsMetaData('hideTileName', !headlessConfig?.hideTileName));
          }}
        />
        <Flex align="center" justify="between">
          <Label htmlFor="tileOffset">Space around VideoTile in px (0-40)</Label>
          <Input
            id="tileOffset"
            css={{ width: '25%', '@sm': { width: '100%' }, ml: '$4', my: '$4' }}
            min={0}
            max={40}
            type="number"
            value={headlessConfig?.tileOffset}
            onChange={e => {
              change(
                'metadataFields',
                handleSettingsMetaData('tileOffset', e.target.value === '' ? undefined : Number(e.target.value)),
              );
            }}
          />
        </Flex>
      </HeadlessItem>
      <HeadlessItem title="UI Layout">
        <RadioGroup.Root
          css={{ flexDirection: 'column', alignItems: 'flex-start' }}
          value={headlessConfig?.uiMode}
          onValueChange={value => {
            change('metadataFields', handleSettingsMetaData('uiMode', value));
          }}
        >
          <Flex align="center" css={{ my: '$4' }}>
            <RadioGroup.Item value="grid" id="gridView" css={{ mr: '$4' }}>
              <RadioGroup.Indicator />
            </RadioGroup.Item>
            <Label htmlFor="gridView">Grid View</Label>
          </Flex>
          <Flex align="center" css={{ cursor: 'pointer' }}>
            <RadioGroup.Item value="activespeaker" id="activeSpeaker" css={{ mr: '$4' }}>
              <RadioGroup.Indicator />
            </RadioGroup.Item>
            <Label htmlFor="activeSpeaker">Active Speaker</Label>
          </Flex>
        </RadioGroup.Root>
      </HeadlessItem>
    </Fragment>
  );
};

export default StreamingRecordingSettings;
