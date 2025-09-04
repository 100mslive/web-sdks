import React, { useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@100mslive/react-icons';
import { StyledPagination } from '../../Pagination';

export const Pagination = ({
  page,
  onPageChange,
  numPages,
}: {
  page: number;
  onPageChange: (page: number) => void;
  numPages: number;
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

  return (
    <StyledPagination.Root css={{ flexShrink: 0 }}>
      <StyledPagination.Chevron disabled={disableLeft} onClick={prevPage}>
        <ChevronLeftIcon width={16} height={16} style={{ cursor: disableLeft ? 'not-allowed' : 'pointer' }} />
      </StyledPagination.Chevron>
      {numPages <= 5 ? (
        <StyledPagination.Dots>
          {[...Array(numPages)].map((_, i) => (
            <StyledPagination.Dot
              key={i}
              active={page === i}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onPageChange(i);
              }}
            />
          ))}
        </StyledPagination.Dots>
      ) : null}
      <StyledPagination.Chevron disabled={disableRight} onClick={nextPage}>
        <ChevronRightIcon width={16} height={16} style={{ cursor: disableRight ? 'not-allowed' : 'pointer' }} />
      </StyledPagination.Chevron>
    </StyledPagination.Root>
  );
};
