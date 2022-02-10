import { styled } from '../Theme/stitches.config';

export const Root = styled('div', {
  backgroundColor: '$statsBg',
  position: 'absolute',
  top: '0.3rem',
  left: '0.3rem',
  zIndex: 10,
  borderRadius: '$2',
  padding: '5px',
  fontSize: '12px',
  overflowY: 'auto',
  maxHeight: '75%',
  maxWidth: '75%',
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
  color: '$textPrimary',
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
