import React from 'react';
import { CheckIcon, SettingsIcon } from '@100mslive/react-icons';
import { Box, Dropdown, Flex, Text, Tooltip } from '../../../';

export function HLSQualitySelector({
  qualityDropDownOpen,
  setQualityDropDownOpen,
  layers,
  onQualityChange,
  selection,
  isAuto,
}) {
  return (
    <Dropdown.Root open={qualityDropDownOpen} onOpenChange={value => setQualityDropDownOpen(value)}>
      <Dropdown.Trigger asChild data-testid="quality_selector">
        <Flex
          css={{
            color: '$on_primary_high',
            r: '$1',
            cursor: 'pointer',
            p: '$2',
          }}
        >
          <Tooltip title="Select Quality" side="top">
            <Flex align="center">
              <Box
                css={{
                  w: '$9',
                  h: '$9',
                  display: 'inline-flex',
                  alignItems: 'center',
                  c: '$on_surface_high',
                }}
              >
                <SettingsIcon />
              </Box>
              <Text
                variant={{
                  '@md': 'sm',
                  '@sm': 'xs',
                  '@xs': 'tiny',
                }}
                css={{ display: 'flex', alignItems: 'center', ml: '$2', c: '$on_surface_medium' }}
              >
                {isAuto && (
                  <>
                    Auto
                    <Box
                      css={{
                        mx: '$2',
                        w: '$2',
                        h: '$2',
                        background: '$on_surface_medium',
                        r: '$1',
                      }}
                    />
                  </>
                )}
                {selection && Math.min(selection.width, selection.height)}p
              </Text>
            </Flex>
          </Tooltip>
        </Flex>
      </Dropdown.Trigger>
      {layers.length > 0 && (
        <Dropdown.Content
          sideOffset={5}
          align="end"
          css={{
            height: 'auto',
            maxHeight: '$52',
            w: '$40',
            bg: '$surface_bright',
            py: '$4',
            gap: '$4',
            display: 'grid',
          }}
        >
          {layers.map(layer => {
            return (
              <Dropdown.Item
                onClick={() => onQualityChange(layer)}
                key={layer.width}
                css={{
                  bg:
                    !isAuto && layer.width === selection?.width && layer.height === selection?.height
                      ? '$surface_default'
                      : '$surface_bright',
                  '&:hover': {
                    bg: '$surface_brighter',
                  },
                  p: '$2 $4 $2 $8',
                  h: '$12',
                  gap: '$2',
                }}
              >
                <Text variant="caption" css={{ fontWeight: '$semiBold' }}>
                  {getQualityText(layer)}
                </Text>
                <Text variant="caption" css={{ flex: '1 1 0', c: '$on_surface_low', pl: '$2' }}>
                  {getBitrateText(layer)}
                </Text>
                {!isAuto && layer.width === selection?.width && layer.height === selection?.height && (
                  <CheckIcon width="16px" height="16px" />
                )}
              </Dropdown.Item>
            );
          })}
          <Dropdown.Item
            onClick={() => onQualityChange({ height: 'auto' })}
            key="auto"
            css={{
              bg: !isAuto ? '$surface_bright' : '$surface_default',
              '&:hover': {
                bg: '$surface_brighter',
              },
              p: '$2 $4 $2 $8',
              h: '$12',
              gap: '$2',
            }}
          >
            <Text variant="caption" css={{ fontWeight: '$semiBold', flex: '1 1 0' }}>
              Auto
            </Text>
            {isAuto && <CheckIcon width="16px" height="16px" />}
          </Dropdown.Item>
        </Dropdown.Content>
      )}
    </Dropdown.Root>
  );
}

const getQualityText = layer => `${Math.min(layer.height, layer.width)}p `;
const getBitrateText = layer => `(${(Number(layer.bitrate / 1000) / 1000).toFixed(2)} Mbps)`;
