import React, { useState } from 'react';
import { CheckCircleIcon, SettingsIcon } from '@100mslive/react-icons';
import { Box, Dropdown, Flex, Text, Tooltip } from '../../../';

export function HLSQualitySelector({ layers, onQualityChange, selection, isAuto }) {
  const [qualityDropDownOpen, setQualityDropDownOpen] = useState(false);

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
                        background: '$on_primary_high',
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
          css={{ height: 'auto', maxHeight: '$96', w: '$64', bg: '$surface_bright' }}
        >
          {layers.map(layer => {
            return (
              <Dropdown.Item
                onClick={() => onQualityChange(layer)}
                key={layer.width}
                css={{
                  bg: '$surface_bright',
                  '&:hover': {
                    bg: '$surface_default',
                  },
                }}
              >
                <Text>{getQualityText(layer)}</Text>
                <Text css={{ flex: '1 1 0', c: '$on_surface_low', pl: '$2' }}>{getBitrateText(layer)}</Text>
                {!isAuto && layer.width === selection?.width && layer.height === selection?.height && (
                  <CheckCircleIcon />
                )}
              </Dropdown.Item>
            );
          })}
          <Dropdown.Item
            onClick={() => onQualityChange({ height: 'auto' })}
            key="auto"
            css={{
              bg: '$surface_bright',
              '&:hover': {
                bg: '$surface_default',
              },
            }}
          >
            <Text css={{ flex: '1 1 0' }}>Auto</Text>
            {isAuto && <CheckCircleIcon />}
          </Dropdown.Item>
        </Dropdown.Content>
      )}
    </Dropdown.Root>
  );
}

const getQualityText = layer => `${Math.min(layer.height, layer.width)}p `;
const getBitrateText = layer => `(${(Number(layer.bitrate / 1000) / 1000).toFixed(2)} Mbps)`;
