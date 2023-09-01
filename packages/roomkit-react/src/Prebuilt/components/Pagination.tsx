import React, { useEffect, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@100mslive/react-icons';
import { StyledPagination } from '../../Pagination';
import { MAX_NO_OF_DOTS } from '../common/constants';
import { Box } from '../../Layout';

const maxPage = 5;

// export const Pagination = ({
//   page,
//   onPageChange,
//   numPages,
// }: {
//   page: number;
//   onPageChange: (page: number) => void;
//   numPages: number;
// }) => {
//   numPages = 10;
//   const disableLeft = page === 0;
//   const disableRight = page === numPages - 1;
//   const [start, setStart] = useState(0);
//   const nextPage = (e: React.SyntheticEvent) => {
//     e.stopPropagation();
//     console.log('page ', page, numPages, start);
//     if (page > 1 && page < numPages - 3) {
//       setStart(start + 1);
//     }
//     onPageChange(Math.min(page + 1, numPages - 1));
//   };
//   const prevPage = (e: React.SyntheticEvent) => {
//     e.stopPropagation();
//     console.log('page end ', page, numPages, start);

//     if (page > 1 && page < numPages - 2) {
//       setStart(start - 1);
//     }
//     onPageChange(Math.max(page - 1, 0));
//   };

//   const dotSize = (index: number) => {
//     console.log(index);
//     if (page === index) {
//       return 'normal';
//     }
//     if (page === 0 || page === numPages - 1) {
//       if (index >= page + 3 || index <= page - 3) {
//         return 'small';
//       }
//       if (index >= page + 2 || index <= page - 2) {
//         return 'medium';
//       }
//       return 'normal';
//     }
//     if (index - 1 === page || index + 1 === page) {
//       return 'medium';
//     }
//     return 'small';
//   };

//   useEffect(() => {
//     // currentPageIndex should not exceed pages length
//     if (page >= numPages) {
//       onPageChange(Math.max(0, numPages - 1));
//     }
//   }, [numPages, onPageChange, page]);

//   if (numPages <= 1) {
//     return null;
//   }
//   // console.log('page ', page, start);
//   return (
//     <StyledPagination.Root css={{ flexShrink: 0 }}>
//       <StyledPagination.Chevron disabled={disableLeft} onClick={prevPage}>
//         <ChevronLeftIcon width={16} height={16} style={{ cursor: disableLeft ? 'not-allowed' : 'pointer' }} />
//       </StyledPagination.Chevron>
//       <StyledPagination.Dots>
//         {numPages <= maxPage
//           ? [...Array(numPages)].map((_, i) => (
//               <StyledPagination.Dot
//                 size={dotSize(i)}
//                 key={i}
//                 active={page === i}
//                 onClick={e => {
//                   e.stopPropagation();
//                   onPageChange(i);
//                 }}
//               />
//             ))
//           : [...Array(maxPage)].map((_, i) => (
//               <StyledPagination.Dot
//                 size="normal"
//                 key={i + start}
//                 active={page === i + start}
//                 onClick={e => {
//                   e.stopPropagation();
//                   // increament slider
//                   if (page > 2 && page < numPages - 1) {
//                     setStart(start + 1);
//                   }
//                   onPageChange(i + start);
//                 }}
//               />
//             ))}
//       </StyledPagination.Dots>
//       <StyledPagination.Chevron disabled={disableRight} onClick={nextPage}>
//         <ChevronRightIcon width={16} height={16} style={{ cursor: disableRight ? 'not-allowed' : 'pointer' }} />
//       </StyledPagination.Chevron>
//     </StyledPagination.Root>
//   );
// };

export const Pagination = ({
  page,
  onPageChange,
  numPages,
  maxDots = 5,
}: {
  page: number;
  onPageChange: (page: number) => void;
  numPages: number;
  maxDots: number;
}) => {
  numPages = 15;
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
      <Box css={{ maxWidth: maxDots * minTranslation, overflow: 'hidden', pl: '$3' }}>
        <StyledPagination.Dots css={{ transform: `translate3d(-${translation}px,0,0)` }}>
          {[...Array(numPages)].map((_, i) => {
            console.log(i, page);
            return (
              <StyledPagination.Dot
                key={i}
                active={page === i}
                onClick={e => {
                  e.stopPropagation();
                  onPageChange(i);
                }}
              />
            );
          })}
        </StyledPagination.Dots>
      </Box>
      <StyledPagination.Chevron disabled={disableRight} onClick={nextPage}>
        <ChevronRightIcon width={16} height={16} style={{ cursor: disableRight ? 'not-allowed' : 'pointer' }} />
      </StyledPagination.Chevron>
    </StyledPagination.Root>
  );
};
