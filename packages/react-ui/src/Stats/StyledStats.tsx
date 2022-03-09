import { styled } from '../Theme';

export const Root = styled('div', {
  backgroundColor: '$statsBg',
  position: 'absolute',
  top: '1.2rem',
  left: '0.3rem',
  zIndex: 10,
  borderRadius: '$2',
  padding: '5px',
  fontSize: '$xs',
  overflowY: 'auto',
  maxHeight: '75%',
  maxWidth: '85%',
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
  color: '$textPrimary',
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
