import React, { useEffect, useState } from 'react';
import { useMedia } from 'react-use';
import { LayoutProps } from './VideoLayouts/interface';
import { RoleProminenceLayout } from './VideoLayouts/RoleProminenceLayout';
import { config as cssConfig } from '../../Theme';
import { Pagination } from './Pagination';
import { usePagesWithTiles } from './hooks/useTileLayout';

export const SecondaryTiles = ({ peers, onPageChange, onPageSize }: LayoutProps) => {
  const isMobile = useMedia(cssConfig.media.md);
  const maxTileCount = isMobile ? 2 : 4;
  const pagesWithTiles = usePagesWithTiles({ peers, maxTileCount });
  const [page, setPage] = useState(0);
  const pageSize = pagesWithTiles[0]?.length || 0;

  useEffect(() => {
    onPageSize?.(pageSize);
  }, [pageSize, onPageSize]);
  onPageSize?.(maxTileCount);

  return (
    <RoleProminenceLayout.SecondarySection tiles={pagesWithTiles[page]}>
      <Pagination
        page={page}
        onPageChange={page => {
          setPage(page);
          onPageChange?.(page);
        }}
        numPages={pagesWithTiles.length}
      />
    </RoleProminenceLayout.SecondarySection>
  );
};
