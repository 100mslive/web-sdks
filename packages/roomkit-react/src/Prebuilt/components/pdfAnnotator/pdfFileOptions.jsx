import React, { useState } from 'react';
import { Dialog, Flex } from '../../../';
import { DialogInputFile } from '../../primitives/DialogContent';
import { PDFHeader } from './pdfHeader';
import { SubmitPDF } from './submitPdf';
import { UploadedFile } from './uploadedFile';

export function PDFFileOptions({ onOpenChange }) {
  const [pdfFile, setPDFFile] = useState(null);

  return !pdfFile ? (
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
            <DialogInputFile
              onChange={target => {
                setPDFFile(target.files[0]);
              }}
              placeholder="Click to upload"
              type="file"
              accept=".pdf"
            />

            <SubmitPDF pdfFile={pdfFile} onOpenChange={onOpenChange} />
          </Flex>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  ) : (
    <UploadedFile pdfFile={pdfFile} setPDFFile={setPDFFile} onOpenChange={onOpenChange} />
  );
}
