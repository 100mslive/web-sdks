import React from 'react';
import { StyledPagination } from './StyledPagination';

interface Props {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  numPages: number;
}

export const Pagination: React.FC<Props> = ({ page, setPage, numPages }) => {
  const disableLeft = page === 0;
  const disableRight = page === numPages - 1;
  const prevPage = () => {
    setPage(Math.min(page + 1, numPages - 1));
  };
  const nextPage = () => {
    setPage(Math.max(page - 1, 0));
  };
  return (
    <StyledPagination.Root>
      <StyledPagination.Chevron disabled={disableLeft} onClick={prevPage}>
        <ChevronLeft disabled={disableLeft} />
      </StyledPagination.Chevron>
      <StyledPagination.Dots>
        {[...Array(numPages)].map((_, i) => (
          <StyledPagination.Dot key={i} active={page === i} onClick={() => setPage(i)} />
        ))}
      </StyledPagination.Dots>
      <StyledPagination.Chevron disabled={disableRight} onClick={nextPage}>
        <ChevronRight disabled={disableRight} />
      </StyledPagination.Chevron>
    </StyledPagination.Root>
  );
};

interface ChevronProp {
  disabled: boolean;
}

const ChevronLeft: React.FC<ChevronProp> = ({ disabled }) => (
  <svg
    width={14}
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    fill="none"
    shapeRendering="geometricPrecision"
    style={{ cursor: `${disabled ? 'not-allowed' : 'pointer'}` }}
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const ChevronRight: React.FC<ChevronProp> = ({ disabled }) => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    fill="none"
    shapeRendering="geometricPrecision"
    style={{ cursor: `${disabled ? 'not-allowed' : 'pointer'}` }}
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);
