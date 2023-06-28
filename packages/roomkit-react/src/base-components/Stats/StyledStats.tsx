import { styled } from '../Theme';

export const Root = styled('div', {
  backgroundColor: '$statsBg',
  position: 'absolute',
  top: '$3',
  left: '$3',
  zIndex: 7,
  borderRadius: '$2',
  padding: '$2',
  fontSize: '$xs',
  overflowY: 'auto',
  maxHeight: '75%',
  maxWidth: '85%',
});

export const Table = styled('table', {});

export const Row = styled('tr', {
  width: '100%',
  '& > * + *': {
    px: '$4',
  },
  whiteSpace: 'nowrap',
  textAlign: 'left',
});

export const Label = styled('td', {
  color: '$textPrimary',
  fontWeight: '$regular',
});

export const Value = styled('td', {
  color: '$textPrimary',
});

export const Gap = styled('tr', {
  height: '$4',
});

interface StatsType {
  Root: typeof Root;
  Row: typeof Row;
  Label: typeof Label;
  Value: typeof Value;
  Table: typeof Table;
  Gap: typeof Gap;
}

export const Stats: StatsType = {
  Root,
  Row,
  Label,
  Value,
  Table,
  Gap,
};
