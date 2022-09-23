import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { StyledPagination } from './StyledPagination';
import { ChevronLeftIcon, ChevronRightIcon } from '@100mslive/react-icons';

export default {
  title: 'UI Components/Pagination',
  component: StyledPagination.Root,
  argTypes: {
    disabled: { control: 'boolean' },
  },
} as ComponentMeta<typeof StyledPagination.Root>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof StyledPagination.Root> = args => {
  const numPages = [1, 2, 3, 4, 5, 6, 7];
  const [page, setPage] = React.useState(1);
  return (
    <StyledPagination.Root {...args}>
      <StyledPagination.Chevron
        onClick={() => {
          console.log('left');
          setPage(page - 1 ? page - 1 : 0);
        }}
      >
        <ChevronLeftIcon width={16} height={16} />
      </StyledPagination.Chevron>
      <StyledPagination.Dots>
        {numPages.map((_, i) => (
          <StyledPagination.Dot
            key={i}
            active={page === i}
            onClick={() => {
              console.log(page);
              setPage(i);
            }}
            css={{ w: '100%', h: '100%', p: '$4 $8', color: 'white' }}
          >
            {i + 1}
          </StyledPagination.Dot>
        ))}
      </StyledPagination.Dots>
      <StyledPagination.Chevron
        onClick={() => {
          console.log('right');
          setPage(page - numPages.length ? page + 1 : 0);
        }}
      >
        <ChevronRightIcon width={16} height={16} />
      </StyledPagination.Chevron>
    </StyledPagination.Root>
  );
};

export const Example = Template.bind({});
Example.storyName = 'Pagination'
