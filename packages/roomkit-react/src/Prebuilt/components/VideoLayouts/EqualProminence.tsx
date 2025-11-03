import { useEffect, useState } from 'react';
import { useMedia } from 'react-use';
import { PeopleAddIcon } from '@100mslive/react-icons';
import { Flex } from '../../../Layout';
import { config as cssConfig } from '../../../Theme';
import { WaitingView } from '../../layouts/WaitingView';
import { InsetTile } from '../InsetTile';
import { Pagination } from '../Pagination';
import { Grid } from './Grid';
import { LayoutProps } from './interface';
// @ts-ignore: No implicit Any
import { useUISettings } from '../AppData/useUISettings';
import { usePagesWithTiles, useTileLayout } from '../hooks/useTileLayout';
import { UI_SETTINGS } from '../../common/constants';

export function EqualProminence({ isInsetEnabled = false, peers, onPageChange, onPageSize, edgeToEdge }: LayoutProps) {
  const isMobile = useMedia(cssConfig.media.md);
  let maxTileCount = useUISettings(UI_SETTINGS.maxTileCount);
  maxTileCount = isMobile ? Math.min(maxTileCount, 6) : maxTileCount;
  const pageList = usePagesWithTiles({
    peers,
    maxTileCount,
  });

  const { ref, pagesWithTiles } = useTileLayout({
    pageList,
    maxTileCount,
    edgeToEdge,
  });
  const [page, setPage] = useState(0);
  const pageSize = pagesWithTiles[0]?.length || 0;

  useEffect(() => {
    if (pageSize > 0) {
      onPageSize?.(pageSize);
    }
  }, [pageSize, onPageSize]);

  return (
    <Flex direction="column" css={{ flex: '1 1 0', h: '100%', position: 'relative', minWidth: 0 }}>
      <Grid tiles={pagesWithTiles[page]} ref={ref} edgeToEdge={edgeToEdge} />
      {!edgeToEdge && (
        <Pagination
          page={page}
          onPageChange={page => {
            setPage(page);
            onPageChange?.(page);
          }}
          numPages={pagesWithTiles.length}
        />
      )}
      {pageList.length === 0 ? (
        <WaitingView
          title="You're the only one here"
          subtitle="Sit back and relax till others join"
          icon={<PeopleAddIcon width="56px" height="56px" style={{ color: 'white' }} />}
        />
      ) : null}
      {isInsetEnabled && <InsetTile />}
    </Flex>
  );
}
