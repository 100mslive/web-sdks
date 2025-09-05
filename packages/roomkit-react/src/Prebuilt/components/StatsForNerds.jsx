import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMedia } from 'react-use';
import { match, P } from 'ts-pattern';
import {
  selectHMSStats,
  selectLocalPeerID,
  selectPeersMap,
  selectTracksMap,
  useHMSActions,
  useHMSStatsStore,
  useHMSStore,
} from '@100mslive/react-sdk';
import { Accordion } from '../../Accordion';
import { HorizontalDivider } from '../../Divider';
import { Dropdown } from '../../Dropdown';
import { Label } from '../../Label';
import { Box, Flex } from '../../Layout';
import { Dialog } from '../../Modal';
import { Sheet } from '../../Sheet';
import { formatBytes } from '../../Stats';
import { Switch } from '../../Switch';
import { Text } from '../../Text';
import { config as cssConfig } from '../../Theme';
import { DialogDropdownTrigger } from '../primitives/DropdownTrigger';
import { useSetUiSettings } from './AppData/useUISettings';
import { useDropdownSelection } from './hooks/useDropdownSelection';
import { UI_SETTINGS } from '../common/constants';

export const StatsForNerds = ({ open, onOpenChange }) => {
  const mediaQueryLg = cssConfig.media.md;
  const isMobile = useMedia(mediaQueryLg);

  const tracksWithLabels = useTracksWithLabel();
  const statsOptions = useMemo(
    () => [{ id: 'local-peer', label: 'Local Peer Stats' }, ...tracksWithLabels],
    [tracksWithLabels],
  );
  const hmsActions = useHMSActions();
  const details = hmsActions.getDebugInfo();
  const [selectedStat, setSelectedStat] = useState(statsOptions[0]);
  const [showStatsOnTiles, setShowStatsOnTiles] = useSetUiSettings(UI_SETTINGS.showStatsOnTiles);
  const [openDropdown, setOpenDropdown] = useState(false);
  const ref = useRef();
  const selectionBg = useDropdownSelection();

  useEffect(() => {
    if (selectedStat.id !== 'local-peer' && !tracksWithLabels.find(track => track.id === selectedStat.id)) {
      setSelectedStat('local-peer');
    }
  }, [tracksWithLabels, selectedStat]);

  return isMobile ? (
    <Sheet.Root open={open} onOpenChange={onOpenChange}>
      <Sheet.Content
        css={{
          bg: 'surface.dim',
          px: '4',
          pb: '4',
        }}
      >
        <Sheet.Title css={{ py: '10', px: '8', alignItems: 'center' }}>
          <Flex justify="between">
            <Flex align="center" css={{ mb: '1' }}>
              <Text variant="h6" inline>
                Stats For Nerds
              </Text>
            </Flex>
            <Dialog.DefaultClose data-testid="stats_dialog_close_icon" />
          </Flex>
        </Sheet.Title>
        <HorizontalDivider />
        <Flex
          direction="column"
          css={{
            mr: '-$2',
            overflowY: 'auto',
            maxHeight: '65vh',
            pr: '6',
            pl: '4',
          }}
        >
          <Flex justify="start" gap={4} css={{ m: '$10 0' }}>
            <Switch checked={showStatsOnTiles} onCheckedChange={setShowStatsOnTiles} />
            <Text variant="body2" css={{ fontWeight: '$semiBold' }}>
              Show Stats on Tiles
            </Text>
          </Flex>
          {/* Select */}
          <Flex
            direction="column"
            css={{
              mb: '12',
              position: 'relative',
              minWidth: 0,
            }}
          >
            <Label variant="body2" css={{ c: 'onSurface.high' }}>
              Stats For
            </Label>
            <Dropdown.Root data-testid="dialog_select_Stats For" open={openDropdown} onOpenChange={setOpenDropdown}>
              <DialogDropdownTrigger
                title={selectedStat.label || 'Select Stats'}
                css={{ mt: '4' }}
                titleCSS={{ mx: 0 }}
                open={openDropdown}
                ref={ref}
              />
              <Dropdown.Portal>
                <Dropdown.Content align="start" sideOffset={8} css={{ w: ref.current?.clientWidth, zIndex: 1000 }}>
                  {statsOptions.map(option => {
                    const isSelected = option.id === selectedStat.id && option.layer === selectedStat.layer;
                    return (
                      <Dropdown.Item
                        key={`${option.id}-${option.layer || ''}`}
                        onClick={() => {
                          setSelectedStat(option);
                        }}
                        css={{
                          px: '9',
                          bg: isSelected ? selectionBg : undefined,
                        }}
                      >
                        {option.label}
                      </Dropdown.Item>
                    );
                  })}
                </Dropdown.Content>
              </Dropdown.Portal>
            </Dropdown.Root>
          </Flex>
          {/* Stats */}
          {selectedStat.id === 'local-peer' ? (
            <LocalPeerStats />
          ) : (
            <TrackStats trackID={selectedStat.id} layer={selectedStat.layer} local={selectedStat.local} />
          )}
          <Flex justify="start" gap={4} css={{ m: '$10 0', w: '100%' }}>
            <DebugInfo details={details} />
          </Flex>
        </Flex>
      </Sheet.Content>
    </Sheet.Root>
  ) : (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content
          css={{
            width: 'min(500px, 95%)',
            height: 'min(656px, 90%)',
            overflowY: 'auto',
          }}
        >
          {/* Title */}
          <Dialog.Title css={{ p: '$4 0' }}>
            <Flex justify="between">
              <Flex align="center" css={{ mb: '1' }}>
                <Text variant="h6" inline>
                  Stats For Nerds
                </Text>
              </Flex>
              <Dialog.DefaultClose data-testid="stats_dialog_close_icon" />
            </Flex>
          </Dialog.Title>
          <HorizontalDivider css={{ mt: '0.8rem' }} />
          {/* Switch */}
          <Flex justify="start" gap={4} css={{ m: '$10 0' }}>
            <Switch checked={showStatsOnTiles} onCheckedChange={setShowStatsOnTiles} />
            <Text variant="body2" css={{ fontWeight: '$semiBold' }}>
              Show Stats on Tiles
            </Text>
          </Flex>
          {/* Select */}

          <Flex
            direction="column"
            css={{
              mb: '12',
              position: 'relative',
              minWidth: 0,
            }}
          >
            <Label variant="body2" css={{ c: 'onSurface.high' }}>
              Stats For
            </Label>
            <Dropdown.Root data-testid="dialog_select_Stats For" open={openDropdown} onOpenChange={setOpenDropdown}>
              <DialogDropdownTrigger
                title={selectedStat.label || 'Select Stats'}
                css={{ mt: '4' }}
                titleCSS={{ mx: 0 }}
                open={openDropdown}
                ref={ref}
              />
              <Dropdown.Portal>
                <Dropdown.Content align="start" sideOffset={8} css={{ w: ref.current?.clientWidth, zIndex: 1000 }}>
                  {statsOptions.map(option => {
                    const isSelected = option.id === selectedStat.id && option.layer === selectedStat.layer;
                    return (
                      <Dropdown.Item
                        key={`${option.id}-${option.layer || ''}`}
                        onClick={() => {
                          setSelectedStat(option);
                        }}
                        css={{
                          px: '9',
                          bg: isSelected ? selectionBg : undefined,
                        }}
                      >
                        {option.label}
                      </Dropdown.Item>
                    );
                  })}
                </Dropdown.Content>
              </Dropdown.Portal>
            </Dropdown.Root>
          </Flex>
          {/* Stats */}
          {selectedStat.id === 'local-peer' ? (
            <LocalPeerStats />
          ) : (
            <TrackStats trackID={selectedStat.id} layer={selectedStat.layer} local={selectedStat.local} />
          )}
          <Flex justify="start" gap={4} css={{ m: '$10 0', w: '100%' }}>
            <DebugInfo details={details} />
          </Flex>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

const useTracksWithLabel = () => {
  const tracksMap = useHMSStore(selectTracksMap);
  const peersMap = useHMSStore(selectPeersMap);
  const localPeerID = useHMSStore(selectLocalPeerID);
  const tracksWithLabels = useMemo(
    () =>
      Object.values(tracksMap).reduce((res, track) => {
        const peerName = peersMap[track.peerId]?.name;
        const isLocalTrack = track.peerId === localPeerID;
        if (isLocalTrack && track.layerDefinitions?.length) {
          res = res.concat(
            track.layerDefinitions.map(({ layer }) => {
              return {
                id: track.id,
                layer,
                local: true,
                label: `${peerName} ${track.source} ${track.type} - ${layer}`,
              };
            }),
          );
          return res;
        }
        res.push({
          id: track.id,
          local: isLocalTrack,
          label: `${peerName} ${track.source} ${track.type}`,
        });
        return res;
      }, []),
    [tracksMap, peersMap, localPeerID],
  );
  return tracksWithLabels;
};

const LocalPeerStats = () => {
  const stats = useHMSStatsStore(selectHMSStats.localPeerStats);

  if (!stats) {
    return null;
  }

  return (
    <Flex css={{ flexWrap: 'wrap', gap: '10' }}>
      <StatsRow label="Packets Lost" value={stats.subscribe?.packetsLost} />
      <StatsRow label="Jitter" value={`${((stats.subscribe?.jitter ?? 0) * 1000).toFixed(2)} ms`} />
      <StatsRow label="Publish Bitrate" value={formatBytes(stats.publish?.bitrate, 'b/s')} />
      <StatsRow label="Subscribe Bitrate" value={formatBytes(stats.subscribe?.bitrate, 'b/s')} />
      <StatsRow
        label="Available Outgoing Bitrate"
        value={formatBytes(stats.publish?.availableOutgoingBitrate, 'b/s')}
      />
      <StatsRow label="Total Bytes Sent" value={formatBytes(stats.publish?.bytesSent)} />
      <StatsRow label="Total Bytes Received" value={formatBytes(stats.subscribe?.bytesReceived)} />
      <StatsRow
        label="Round Trip Time"
        value={`${
          (((stats.publish?.currentRoundTripTime || 0) + (stats.subscribe?.currentRoundTripTime || 0)) / 2).toFixed(3) *
          1000
        } ms`}
      />
    </Flex>
  );
};

const TrackStats = ({ trackID, layer, local }) => {
  const selector = match({ trackID, layer, local })
    .with(
      {
        layer: P.when(layer => !!layer),
      },
      () => selectHMSStats.localVideoTrackStatsByLayer(layer)(trackID),
    )
    .with({ local: P.when(local => !!local) }, () => selectHMSStats.localAudioTrackStatsByID(trackID))
    .otherwise(() => selectHMSStats.trackStatsByID(trackID));
  const stats = useHMSStatsStore(selector);
  if (!stats) {
    return null;
  }
  const inbound = stats.type.includes('inbound');

  return (
    <Flex css={{ flexWrap: 'wrap', gap: '10' }}>
      <StatsRow label="Type" value={stats.type + ' ' + stats.kind} />
      <StatsRow label="Bitrate" value={formatBytes(stats.bitrate, 'b/s')} />
      <StatsRow label="Packets Lost" value={stats.packetsLost} />
      <StatsRow label="Jitter" value={`${((stats.subscribe?.jitter ?? 0) * 1000).toFixed(2)} ms`} />
      <StatsRow
        label={inbound ? 'Bytes Received' : 'Bytes Sent'}
        value={formatBytes(inbound ? stats.bytesReceived : stats.bytesSent)}
      />
      {stats.kind === 'video' && (
        <>
          <StatsRow label="Framerate" value={stats.framesPerSecond} />
          {!inbound && <StatsRow label="Quality Limitation Reason" value={stats.qualityLimitationReason} />}
        </>
      )}
      <StatsRow
        label="Round Trip Time"
        value={stats.roundTripTime ? `${(stats.roundTripTime * 1000).toFixed(3)} ms` : '-'}
      />
    </Flex>
  );
};

const DebugInfo = ({ details }) => {
  return (
    <Accordion.Root type="single" collapsible css={{ w: '100%' }}>
      <Accordion.Item value="Debug Info">
        <Accordion.Header>
          <Label variant="body2" css={{ c: 'onSurface.high' }}>
            Debug Info
          </Label>
        </Accordion.Header>
        <Accordion.Content>
          <Flex css={{ flexWrap: 'wrap', mt: '10', gap: '10' }}>
            <StatsRow css={{ w: '100%' }} label="Websocket URL" value={details?.websocketURL} />
            <StatsRow css={{ w: '100%' }} label="Init Endpoint" value={details?.initEndpoint} />
            <StatsRow css={{ w: '100%' }} label="Enabled flags" value={details?.enabledFlags?.join(', ')} />
          </Flex>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
};

const StatsRow = React.memo(({ label, value, css }) => (
  <Box css={{ bg: 'surface.bright', w: 'calc(50% - $6)', p: '8', r: '3', ...css }}>
    <Text
      variant="overline"
      css={{
        fontWeight: '$semiBold',
        color: 'onSurface.medium',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </Text>
    <Text variant="sub1" css={{ fontWeight: '$semiBold', color: 'onSurface.high' }}>
      {value || '-'}
    </Text>
  </Box>
));
