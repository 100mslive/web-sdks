import { useCallback, useEffect, useState } from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@100mslive/react-icons';
import { StyledPagination } from '.';

type PaginationProps = {
  page: number;
  setPage: (page: number) => void;
  numPages: number;
};

const PaginationComponent = ({ page: propsPage, setPage: propsSetPage, numPages }: PaginationProps) => {
  const [page, setPage] = useState(propsPage);

  const disableLeft = page === 0;
  const disableRight = page === numPages - 1;

  const handlePageChange = useCallback(
    (page: number) => {
      setPage(page);
      propsSetPage(page);
    },
    [propsSetPage],
  );

  const nextPage = () => {
    handlePageChange(Math.min(page + 1, numPages - 1));
  };

  const prevPage = () => {
    handlePageChange(Math.max(page - 1, 0));
  };

  useEffect(() => {
    handlePageChange(propsPage);
  }, [propsPage, handlePageChange]);

  return (
    <StyledPagination.Root>
      <StyledPagination.Chevron
        disabled={disableLeft}
        onClick={prevPage}
        type="button"
        css={{ padding: 0, border: 'none', backgroundColor: 'transparent' }}
      >
        <ChevronLeftIcon width={16} height={16} style={{ cursor: disableLeft ? 'not-allowed' : 'pointer' }} />
      </StyledPagination.Chevron>
      <StyledPagination.Dots>
        {[...Array(numPages)].map((_, i) => (
          <StyledPagination.Dot key={i} active={page === i} onClick={() => handlePageChange(i)} type="button" />
        ))}
      </StyledPagination.Dots>
      <StyledPagination.Chevron
        disabled={disableRight}
        onClick={nextPage}
        type="button"
        css={{ padding: 0, border: 'none', backgroundColor: 'transparent' }}
      >
        <ChevronRightIcon width={16} height={16} style={{ cursor: disableRight ? 'not-allowed' : 'pointer' }} />
      </StyledPagination.Chevron>
    </StyledPagination.Root>
  );
};

export default {
  title: 'UI Components/Pagination',
  component: PaginationComponent,
  argTypes: {
    setPage: { action: { type: 'click' } },
    page: { control: { type: 'number' }, defaultValue: 0 },
    numPages: { control: { type: 'number' }, defaultValue: 5 },
  },
} as ComponentMeta<typeof PaginationComponent>;

const Template: ComponentStory<typeof PaginationComponent> = args => {
  return <PaginationComponent {...args} />;
};

export const Example = Template.bind({});
Example.storyName = 'Pagination';
