import React from 'react';
import { Label } from '../../../Label';
import { Flex } from '../../../Layout';
import { Switch } from '../../../Switch';

const SwitchWithLabel = ({
  label,
  icon,
  id,
  onChange,
  checked,
  hide = false,
}: {
  label: string;
  icon?: React.ReactNode;
  id: string;
  onChange: (value: boolean) => void;
  checked: boolean;
  hide?: boolean;
}) => {
  return (
    <Flex
      align="center"
      css={{
        my: '2',
        py: '8',
        w: '100%',
        borderBottom: '1px solid border.default',
        display: hide ? 'none' : 'flex',
      }}
    >
      <Label
        htmlFor={id}
        css={{
          fontSize: 'md',
          fontWeight: 'semiBold',
          color: checked ? 'onSurface.high' : 'onSurface.low',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8',
          flex: '1 1 0',
        }}
      >
        {icon}
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </Flex>
  );
};

export default SwitchWithLabel;
