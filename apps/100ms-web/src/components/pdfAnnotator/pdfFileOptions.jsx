import React, { useState } from "react";
import { Button, Dialog, Flex, Text } from "@100mslive/react-ui";
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
        <Flex direction="column">
          <DialogInputFile
            onChange={target => {
              setPDFFile(target.files[0]);
            }}
            accept=".pdf"
            placeholder="Upload pdf file"
            type="file"
            css={{
              w: "100%",
              "&:hover": {
                cursor: "pointer",
              },
            }}
          />
          <Text
            css={{
              pl: "$4",
              mt: "-$8",
            }}
          >
            Upload PDF file to share and annotate.
          </Text>
        </Flex>
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
            disabled={!pdfFile}
            data-testid="share_pdf_btn"
          >
            Start Sharing
          </Button>
        </DialogRow>
      </DialogContent>
    </Dialog.Root>
  );
}
