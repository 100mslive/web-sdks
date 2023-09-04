import React, { useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@100mslive/react-icons';
import { StyledPagination } from '../../Pagination';
import { MAX_NO_OF_DOTS } from '../common/constants';

export const Pagination = ({
  page,
  onPageChange,
  numPages,
  maxDots = MAX_NO_OF_DOTS,
}: {
  page: number;
  onPageChange: (page: number) => void;
  numPages: number;
  maxDots?: number;
}) => {
  numPages = 10;
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

  const dotSize = (index: number) => {
    if (page === index) {
      return 'large';
    }
    if (page === 0 || page === numPages - 1) {
      if (index >= page + 3 || index <= page - 3) {
        return 'small';
      }
      if (index >= page + 2 || index <= page - 2) {
        return 'medium';
      }
      return 'large';
    }
    if (index - 1 === page || index + 1 === page) {
      return 'medium';
    }
    return 'small';
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
  const maxWidth = maxDots * 18;
  let translation = page < maxDots ? 0 : (Math.floor(page / maxDots) + (page % maxDots)) * minTranslation;

  if (translation > (numPages - maxDots) * minTranslation) {
    translation -= minTranslation;
  }

  return (
    <StyledPagination.Root css={{ flexShrink: 0 }}>
      <StyledPagination.Chevron disabled={disableLeft} onClick={prevPage}>
        <ChevronLeftIcon width={16} height={16} style={{ cursor: disableLeft ? 'not-allowed' : 'pointer' }} />
      </StyledPagination.Chevron>
      <StyledPagination.Dots css={{ width: `${maxWidth}px`, overflowX: 'hidden' }}>
        {[...Array(numPages)].map((_, i) => (
          <StyledPagination.Dot
            css={{
              transition: 'transform 0.3s ease',
              transform: `translate3d(-${translation}px,0,0)`,
            }}
            size={dotSize(i)}
            key={i}
            active={page === i}
            onClick={e => {
              e.stopPropagation();
              onPageChange(i);
            }}
          />
        ))}
      </StyledPagination.Dots>
      <StyledPagination.Chevron disabled={disableRight} onClick={nextPage}>
        <ChevronRightIcon width={16} height={16} style={{ cursor: disableRight ? 'not-allowed' : 'pointer' }} />
      </StyledPagination.Chevron>
    </StyledPagination.Root>
  );
};
