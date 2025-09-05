import React from 'react';
import { TrashIcon } from '@100mslive/react-icons';
import { Dialog, Flex, Text } from '../../../';
import { DialogRow } from '../../primitives/DialogContent';
import { PDFHeader } from './pdfHeader';
import { PDFInfo } from './pdfInfo';
import { SubmitPDF } from './submitPdf';

export const UploadedFile = ({ pdfFile, setPDFFile, onOpenChange }) => {
  const [fileName, ext] = pdfFile.name.split('.');
  return (
    <Dialog.Root defaultOpen onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content
          css={{
            w: 'min(420px,80%)',
            overflow: 'auto',
            p: '10',
            bg: 'surface.dim',
          }}
        >
          <Flex direction="column">
            <PDFHeader />
            <DialogRow
              css={{
                fontFamily: '$sans',
                bg: 'surface.bright',
                r: '1',
                outline: 'none',
                border: '1px solid border.bright',
                p: '$4 $6',
                minHeight: '11',
                c: 'onPrimary.high',
                fs: 'md',
                w: '100%',
                '&:focus': {
                  boxShadow: '0 0 0 1px $colorsprimary.default',
                  border: '1px solid transparent',
                },
                mb: 0,
                mt: '6',
              }}
            >
              <Flex direction="row" css={{ flexGrow: '1', maxWidth: '88%' }}>
                <Text
                  css={{
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {fileName}
                </Text>
                <Text css={{ whiteSpace: 'nowrap' }}>.{ext}</Text>
              </Flex>
              <TrashIcon
                onClick={() => setPDFFile(null)}
                style={{
                  cursor: 'pointer',
                }}
              />
            </DialogRow>
            <PDFInfo />
            <SubmitPDF pdfFile={pdfFile} onOpenChange={onOpenChange} />
          </Flex>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
