import React, { useState } from "react";
import { Button, Dialog, Text } from "@100mslive/react-ui";
import {
  DialogContent,
  DialogInputFile,
  DialogRow,
} from "../../primitives/DialogContent";
import { useSetAppDataByKey } from "../AppData/useUISettings";
import { APP_DATA } from "../../common/constants";

export function PDFFileOptions({ onOpenChange }) {
  const [pdfConfig, setPDFConfig] = useSetAppDataByKey(APP_DATA.pdfConfig);
  const [pdfFile, setPDFFile] = useState();
  return (
    <Dialog.Root defaultOpen onOpenChange={onOpenChange}>
      <DialogContent title="Share PDF">
        <DialogInputFile
          onChange={target => {
            setPDFFile(target.files[0]);
          }}
          title="Upload File"
          accept=".pdf"
          placeholder="Upload pdf file"
          type="file"
        />
        <DialogRow>
          <Text>Upload PDF file which you will annotate.</Text>
        </DialogRow>
        <DialogRow>
          <Button
            variant="standard"
            outlined
            type="submit"
            onClick={() => {
              onOpenChange(false);
            }}
            css={{ mr: "$4" }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            onClick={() => {
              setPDFConfig({ state: true, file: pdfFile });
              onOpenChange(false);
            }}
            data-testid="share_pdf_btn"
          >
            Start Sharing
          </Button>
        </DialogRow>
      </DialogContent>
    </Dialog.Root>
  );
}
