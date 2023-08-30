import React, { useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@100mslive/react-icons';
import { Box } from '../../Layout';
import { StyledPagination } from '../../Pagination';

export const Pagination = ({
  page,
  onPageChange,
  numPages,
  maxDots = 3,
}: {
  page: number;
  onPageChange: (page: number) => void;
  numPages: number;
  maxDots: number;
}) => {
  const disableLeft = page === 0;
  const disableRight = page === numPages - 1;
  const nextPage = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    onPageChange(Math.min(page + 1, numPages - 1));
  };
  const prevPage = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    onPageChange(Math.max(page - 1, 0));
  };

  useEffect(() => {
    // currentPageIndex should not exceed pages length
    if (page >= numPages) {
      onPageChange(Math.max(0, numPages - 1));
    }
  }, [numPages, onPageChange, page]);

  if (numPages <= 1) {
    return null;
  }

  const minTranslation = 12 + 8; // 12 is gap, 8 is dot size
  const maxWidth = maxDots * minTranslation;
  let translation = page < maxDots ? 0 : (Math.floor(page / maxDots) + (page % maxDots)) * minTranslation;

  if (translation > (numPages - maxDots) * 20) {
    translation -= minTranslation;
  }

  console.log({ page, translation, maxWidth });
  return (
    <StyledPagination.Root css={{ flexShrink: 0 }}>
      <StyledPagination.Chevron disabled={disableLeft} onClick={prevPage}>
        <ChevronLeftIcon width={16} height={16} style={{ cursor: disableLeft ? 'not-allowed' : 'pointer' }} />
      </StyledPagination.Chevron>
      <Box css={{ maxWidth: maxDots * minTranslation, overflow: 'clip', pl: '$3' }}>
        <StyledPagination.Dots css={{ transform: `translate3d(-${translation}px,0,0)` }}>
          {[...Array(numPages)].map((_, i) => (
            <StyledPagination.Dot
              key={i}
              active={page === i}
              onClick={e => {
                e.stopPropagation();
                onPageChange(i);
              }}
            />
          ))}
        </StyledPagination.Dots>
      </Box>
      <StyledPagination.Chevron disabled={disableRight} onClick={nextPage}>
        <ChevronRightIcon width={16} height={16} style={{ cursor: disableRight ? 'not-allowed' : 'pointer' }} />
      </StyledPagination.Chevron>
    </StyledPagination.Root>
  );
};
