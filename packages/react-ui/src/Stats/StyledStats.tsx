import { styled } from '../stitches.config';

export const Root = styled('div', {
  backgroundColor: 'rgba(0,0,0,0.75)',
  position: 'absolute',
  top: '0.5rem',
  left: '0.5rem',
  // z-10 rounded-lg p-3 text-sm'
  zIndex: 10,
  borderRadius: '$2',
  padding: '0.5rem',
  fontSize: '12px',
  variants: {
    contract: {
      true: {
        height: '100px',
        fontSize: '10px',
        overflowY: 'scroll',
        overflowX: 'scroll',
      },
    },
  },
});

export const Table = styled('table', {});

export const Row = styled('tr', {
  width: '100%',
  '& > * + *': {
    paddingLeft: '1rem',
  },
});

export const Label = styled('td', {
  color: '$grey5',
  fontWeight: 600,
});

export const Value = styled('td', {
  color: '$fg',
});

interface StatsType {
  Root: typeof Root;
  Row: typeof Row;
  Label: typeof Label;
  Value: typeof Value;
  Table: typeof Table;
}

export const Stats: StatsType = {
  Root,
  Row,
  Label,
  Value,
  Table,
};
