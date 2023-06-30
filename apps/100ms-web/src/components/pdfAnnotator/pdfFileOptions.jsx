import React, { useState } from "react";
import {
  Dialog,
  Flex,
  HorizontalDivider,
  Input,
  Text,
} from "@100mslive/react-ui";
import { DialogInputFile, DialogRow } from "../../primitives/DialogContent";
import { PdfErrorView } from "./pdfErrorView";
import { PDFHeader } from "./pdfHeader";
import { PDFInfo } from "./pdfInfo";
import { SubmitPDF } from "./submitPdf";
import { UploadedFile } from "./uploadedFile";
import Tabs from "../Tabs";
import { PDF_SHARING_OPTIONS } from "../../common/constants";

export function PDFFileOptions({ onOpenChange }) {
  const [isPDFUrlValid, setIsPDFUrlValid] = useState(true);
  const [isValidateProgress, setIsValidateProgress] = useState(false);
  const [pdfFile, setPDFFile] = useState(null);
  const [pdfURL, setPDFURL] = useState("");
  const [activeTab, setActiveTab] = useState(
    PDF_SHARING_OPTIONS.FROM_YOUR_COMPUTER
  );

  return !pdfFile ? (
    <Dialog.Root defaultOpen onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content
          css={{
            w: "min(420px,80%)",
            overflow: "auto",
            p: "$10",
          }}
        >
          <Flex direction="column">
            <PDFHeader
              onOpenChange={onOpenChange}
              title="Start PDF Sharing"
              subtitle="Choose a PDF to annotate and share"
            />
            <Tabs
              options={Object.values(PDF_SHARING_OPTIONS)}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
            {activeTab === PDF_SHARING_OPTIONS.FROM_YOUR_COMPUTER ? (
              <>
                <DialogInputFile
                  onChange={target => {
                    setPDFFile(target.files[0]);
                  }}
                  placeholder="Click to upload"
                  type="file"
                  accept=".pdf"
                />
              </>
            ) : null}

            {activeTab === PDF_SHARING_OPTIONS.FROM_A_URL ? (
              <>
                <Text
                  variant="sm"
                  css={{
                    mt: "$8",
                    pb: "$2",
                  }}
                >
                  Enter PDF URL
                </Text>
                <Input
                  css={{ w: "100%" }}
                  value={pdfURL}
                  onFocus={() => {
                    setIsPDFUrlValid(true);
                    setIsValidateProgress(false);
                  }}
                  onChange={e => {
                    setPDFURL(e.target.value);
                  }}
                  placeholder="e.g. https://www.coin.co/whitepaper.pdf"
                  type="text"
                  error={!isPDFUrlValid}
                />
                {!isPDFUrlValid && (
                  <PdfErrorView isPDFUrlValid={isPDFUrlValid} />
                )}
                <PDFInfo />
              </>
            ) : null}

            <SubmitPDF
              pdfFile={pdfFile}
              pdfURL={pdfURL}
              isValidateProgress={isValidateProgress}
              setIsPDFUrlValid={setIsPDFUrlValid}
              setIsValidateProgress={setIsValidateProgress}
              onOpenChange={onOpenChange}
              hideSecondaryCTA
            />
          </Flex>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  ) : (
    <UploadedFile
      pdfFile={pdfFile}
      pdfURL={pdfURL}
      isValidateProgress={isValidateProgress}
      setPDFFile={setPDFFile}
      setIsPDFUrlValid={setIsPDFUrlValid}
      setIsValidateProgress={setIsValidateProgress}
      onOpenChange={onOpenChange}
    />
  );
}
