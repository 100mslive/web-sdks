import React, { Fragment, useState } from 'react';
import { DownloadIcon } from '@100mslive/react-icons';
import {
  Box,
  Button,
  Dialog,
  Flex,
  flexCenter,
  Text,
} from '@100mslive/roomkit-react';
import { DialogContent } from './DialogContent';

const Step = ({ value, opacity }) => (
  <Text
    css={{
      bg: '$backround_dim',
      size: '$12',
      r: '$round',
      mr: '$8',
      ...flexCenter,
      opacity,
    }}
  >
    {value}
  </Text>
);

const Item = ({ title, description, step, selected, children, onClick }) => {
  const opacity = selected ? 1 : 0.75;
  return (
    <Box
      css={{
        bg: '$surface_bright',
        p: '$8',
        my: '$8',
        opacity,
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      <Flex align="center">
        <Step value={step} opacity={opacity} />
        <Text>{title}</Text>
      </Flex>
      {selected && (
        <Fragment>
          <Text css={{ color: '$surface_default', my: '$8' }}>{description}</Text>
          <Box css={{ mb: '$8' }}>{children}</Box>
        </Fragment>
      )}
    </Box>
  );
};

const DownloadCodeModal = ({ downloadEnv, onClose }) => {
  const [selection, setSelection] = useState(0);
  return (
    <Dialog.Root defaultOpen onOpenChange={value => !value && onClose()}>
      <DialogContent title="Download Code">
        <Fragment>
          <Item
            title="Download .env"
            description="Download .env file containing your customisations."
            selected={selection === 0}
            step={1}
            onClick={() => {
              setSelection(0);
            }}
          >
            <Button
              onClick={() => {
                downloadEnv();
                setSelection(value => value + 1);
              }}
            >
              <DownloadIcon />
              &nbsp;Download
            </Button>
          </Item>
          <Item
            title="Fork Repo from Github"
            description="Fork the source repo and replace example.env with your .env"
            selected={selection === 1}
            step={2}
            onClick={() => {
              setSelection(1);
            }}
          >
            <Button
              onClick={() => {
                window.open('https://github.com/100mslive/100ms-web');
              }}
            >
              Fork Repository
            </Button>
          </Item>
        </Fragment>
      </DialogContent>
    </Dialog.Root>
  );
};
export default DownloadCodeModal;
