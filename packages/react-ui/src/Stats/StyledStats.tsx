import { styled } from '../stitches.config';

export const Root = styled('div', {
  backgroundColor: '$statsBg',
  position: 'absolute',
  top: '0.5rem',
  left: '0.5rem',
  zIndex: 10,
  borderRadius: '$2',
  padding: '10px',
  fontSize: '12px',
  variants: {
    compact: {
      true: {
        padding: '5px',
      },
    },
  },
});

export const Table = styled('table', {});

export const Row = styled('tr', {
  width: '100%',
  '& > * + *': {
    paddingLeft: '0.5rem',
  },
  whiteSpace: 'nowrap',
  textAlign: 'left',
});

export const Label = styled('td', {
  color: '$grey5',
  fontWeight: 400,
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
