import { useMedia } from 'react-use';
import { HMSHLSLayer } from '@100mslive/hls-player';
import { CheckIcon, CrossIcon, SettingsIcon } from '@100mslive/react-icons';
import { Box, Dropdown, Flex, Text, Tooltip } from '../../..';
import { Sheet } from '../../../Sheet';
import { config } from '../../../Theme';
import { useIsLandscape } from '../../common/hooks';

export function HLSQualitySelector({
  open,
  onOpenChange,
  layers,
  onQualityChange,
  selection,
  isAuto,
  containerRef,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  layers: HMSHLSLayer[];
  onQualityChange: (quality: { [key: string]: string | number } | HMSHLSLayer) => void;
  selection: HMSHLSLayer;
  isAuto: boolean;
  containerRef?: HTMLDivElement;
}) {
  const isMobile = useMedia(config.media.md);
  const isLandscape = useIsLandscape();

  if (layers.length === 0) {
    return null;
  }
  if (isMobile || isLandscape) {
    return (
      <Sheet.Root open={open} onOpenChange={onOpenChange}>
        <Sheet.Trigger asChild data-testid="quality_selector">
          <Flex
            css={{
              color: '$on_primary_high',
              r: '$1',
              cursor: 'pointer',
              p: '$2',
            }}
          >
            <SettingsIcon />
          </Flex>
        </Sheet.Trigger>
        <Sheet.Content
          container={containerRef}
          css={{ bg: '$surface_default', pb: '$1' }}
          onClick={() => onOpenChange(false)}
        >
          <Sheet.Title
            css={{
              display: 'flex',
              color: '$on_surface_high',
              w: '100%',
              justifyContent: 'space-between',
              mt: '$8',
              fontSize: '$md',
              px: '$10',
              pb: '$8',
              borderBottom: '1px solid $border_bright',
              alignItems: 'center',
            }}
          >
            Quality
            <Sheet.Close css={{ color: '$on_surface_high' }} onClick={() => onOpenChange(false)}>
              <CrossIcon />
            </Sheet.Close>
          </Sheet.Title>
          {layers.map(layer => {
            return (
              <Flex
                align="center"
                css={{
                  w: '100%',
                  bg: '$surface_default',
                  '&:hover': {
                    bg: '$surface_brighter',
                  },
                  cursor: 'pointer',
                  gap: '$4',
                  py: '$8',
                  px: '$10',
                }}
                key={layer.width}
                onClick={() => onQualityChange(layer)}
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
              </Flex>
            );
          })}
          <Flex
            align="center"
            css={{
              w: '100%',
              bg: '$surface_default',
              '&:hover': {
                bg: '$surface_brighter',
              },
              cursor: 'pointer',
              gap: '$4',
              py: '$8',
              px: '$10',
            }}
            key="auto"
            onClick={() => onQualityChange({ height: 'auto' })}
          >
            <Text variant="caption" css={{ fontWeight: '$semiBold', flex: '1 1 0' }}>
              Auto
            </Text>
            {isAuto && <CheckIcon width="16px" height="16px" />}
          </Flex>
        </Sheet.Content>
      </Sheet.Root>
    );
  }
  return (
    <Dropdown.Root open={open} onOpenChange={value => onOpenChange(value)} modal={false}>
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
                {selection && Math.min(selection.width || 0, selection.height || 0)}p
              </Text>
            </Flex>
          </Tooltip>
        </Flex>
      </Dropdown.Trigger>
      <Dropdown.Portal container={containerRef}>
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
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}

const getQualityText = (layer: HMSHLSLayer) => `${Math.min(layer.height || 0, layer.width || 0)}p `;
const getBitrateText = (layer: HMSHLSLayer) => `(${(Number(layer.bitrate / 1000) / 1000).toFixed(2)} Mbps)`;
