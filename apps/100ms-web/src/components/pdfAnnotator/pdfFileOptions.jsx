import React, { useCallback, useState } from "react";
import { InfoIcon, TrashIcon } from "@100mslive/react-icons";
import {
  Button,
  Dialog,
  Flex,
  HorizontalDivider,
  Input,
  Text,
} from "@100mslive/react-ui";
import {
  DialogCol,
  DialogInputFile,
  DialogRow,
} from "../../primitives/DialogContent";
import { useSetAppDataByKey } from "../AppData/useUISettings";
import { APP_DATA } from "../../common/constants";

export function PDFFileOptions({ onOpenChange }) {
  const [, setPDFConfig] = useSetAppDataByKey(APP_DATA.pdfConfig);
  const [isPDFUrlValid, setIsPDFUrlValid] = useState(true);
  const [isValidateProgress, setIsValidateProgress] = useState(false);
  const [pdfFile, setPDFFile] = useState(null);
  const [pdfURL, setPDFURL] = useState("");

  const isValidPDF = useCallback(
    pdfURL => {
      const extension = pdfURL.split(".").pop().toLowerCase();
      setIsValidateProgress(true);
      if (extension === "pdf") {
        setIsPDFUrlValid(true);
        setIsValidateProgress(false);
        setPDFConfig({ state: true, file: pdfFile, url: pdfURL });
        onOpenChange(false);
      }

      fetch(pdfURL, { method: "HEAD" })
        .then(response => response.headers.get("content-type"))
        .then(contentType => {
          if (contentType === "application/pdf") {
            setIsPDFUrlValid(true);
            setIsValidateProgress(false);
            setPDFConfig({ state: true, file: pdfFile, url: pdfURL });
            onOpenChange(false);
          } else {
            setIsPDFUrlValid(false);
            setIsValidateProgress(false);
          }
        })
        .catch(error => {
          setIsPDFUrlValid(false);
          setIsValidateProgress(false);
        });
    },
    [onOpenChange, pdfFile, setPDFConfig]
  );

  const PDFInfo = useCallback(() => {
    return (
      <DialogRow
        css={{
          px: "$8",
          py: "$3",
          bg: "$surfaceLight",
          r: "$1",
          outline: "none",
          border: "1px solid $borderLight",
          minHeight: "$11",
        }}
      >
        <InfoIcon
          width="64px"
          height="64px"
          style={{
            paddingRight: "16px",
          }}
        />
        <Text variant="caption">
          On the next screen, ensure you select “This Tab” and click on share.
          Only the PDF viewer will be seen by other participants
        </Text>
      </DialogRow>
    );
  }, []);
  const SubmitSharing = useCallback(() => {
    return (
      <Flex
        direction="row"
        css={{
          mb: "0",
          mt: "auto",
          gap: "$8",
        }}
      >
        <Button
          variant="standard"
          outlined
          type="submit"
          onClick={() => {
            onOpenChange(false);
          }}
          css={{ w: "50%" }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          onClick={() => {
            if (pdfFile) {
              setPDFConfig({ state: true, file: pdfFile, url: pdfURL });
              onOpenChange(false);
            } else if (pdfURL) {
              isValidPDF(pdfURL);
            }
          }}
          disabled={!pdfFile && !pdfURL}
          loading={isValidateProgress}
          data-testid="share_pdf_btn"
          css={{
            w: "50%",
          }}
        >
          Start Sharing
        </Button>
      </Flex>
    );
  }, [
    pdfFile,
    pdfURL,
    isValidateProgress,
    onOpenChange,
    setPDFConfig,
    isValidPDF,
  ]);
  const PDFHeader = useCallback(() => {
    return (
      <DialogCol
        align="start"
        css={{
          mt: 0,
          mb: "$6",
        }}
      >
        <Dialog.Title asChild>
          <Text as="h6" variant="h6">
            Share PDF
          </Text>
        </Dialog.Title>
        <Dialog.Description asChild>
          <Text
            variant="sm"
            css={{
              c: "$textMedEmp",
            }}
          >
            Choose PDF you want to annotate and share
          </Text>
        </Dialog.Description>
      </DialogCol>
    );
  }, []);
  const ShowUploadedFile = useCallback(() => {
    const [fileName, ext] = pdfFile.name.split(".");
    return (
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
              <PDFHeader />
              <DialogRow
                css={{
                  fontFamily: "$sans",
                  bg: "$surfaceLight",
                  r: "$1",
                  outline: "none",
                  border: "1px solid $borderLight",
                  p: "$4 $6",
                  minHeight: "$11",
                  c: "$textPrimary",
                  fs: "$md",
                  w: "100%",
                  "&:focus": {
                    boxShadow: "0 0 0 1px $colors$borderAccent",
                    border: "1px solid $transparent",
                  },
                  mb: 0,
                  mt: "$6",
                }}
              >
                <Flex direction="row" css={{ flexGrow: "1", maxWidth: "88%" }}>
                  <Text
                    css={{
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fileName}
                  </Text>
                  <Text css={{ whiteSpace: "nowrap" }}>.{ext}</Text>
                </Flex>
                <TrashIcon
                  onClick={() => setPDFFile(null)}
                  style={{
                    cursor: "pointer",
                  }}
                />
              </DialogRow>
              <PDFInfo />
              <SubmitSharing />
            </Flex>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }, [onOpenChange, pdfFile]);
  const PdfURLView = useCallback(() => {
    return (
      !isPDFUrlValid && (
        <DialogRow
          css={{
            mt: "-$8",
            color: "$error",
            justifyContent: "start",
          }}
        >
          <InfoIcon width="12px" height="12px" />
          <Text
            variant="caption"
            css={{
              pl: "$1",
              color: "$error",
            }}
          >
            Invalid PDF URL, try again
          </Text>
        </DialogRow>
      )
    );
  }, [isPDFUrlValid]);
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
            <PDFHeader />
            <DialogInputFile
              onChange={target => {
                setPDFFile(target.files[0]);
              }}
              placeholder="Click to upload"
              type="file"
              accept=".pdf"
            />
            <DialogRow
              css={{
                m: "$10 0",
              }}
            >
              <HorizontalDivider
                css={{
                  mr: "$4",
                }}
              />
              <Text
                variant="tiny"
                css={{
                  color: "$textDisabled",
                }}
              >
                OR
              </Text>
              <HorizontalDivider
                css={{
                  ml: "$4",
                }}
              />
            </DialogRow>
            <Text
              variant="sm"
              css={{
                py: "$2",
              }}
            >
              Import from URL
            </Text>
            <Input
              css={{ w: "100%", mb: "$10" }}
              value={pdfURL}
              onFocus={() => {
                setIsPDFUrlValid(true);
                setIsValidateProgress(false);
              }}
              onChange={e => {
                setPDFURL(e.target.value);
              }}
              placeholder="Add PDF URL"
              type="text"
              error={!isPDFUrlValid}
            />
            {!isPDFUrlValid && <PdfURLView />}
            <PDFInfo />
            <SubmitSharing />
          </Flex>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  ) : (
    <ShowUploadedFile />
  );
}
