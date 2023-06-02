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
  const [pdfConfig, setPDFConfig] = useSetAppDataByKey(APP_DATA.pdfConfig);
  const [pdfFile, setPDFFile] = useState(null);
  const [pdfURL, setPDFURL] = useState("");

  const PDFInfo = useCallback(() => {
    return (
      <DialogRow
        css={{
          px: "$8",
          py: "$6",
          bg: "$surfaceLight",
          r: "8px",
          outline: "none",
          border: "1px solid $borderLight",
          minHeight: "30px",
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
        }}
      >
        <Button
          variant="standard"
          outlined
          type="submit"
          onClick={() => {
            onOpenChange(false);
          }}
          css={{ mr: "$4", w: "50%" }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          onClick={() => {
            setPDFConfig({ state: true, file: pdfFile, url: pdfURL });
            onOpenChange(false);
          }}
          disabled={!pdfFile && !pdfURL}
          data-testid="share_pdf_btn"
          css={{
            w: "50%",
          }}
        >
          Start Sharing
        </Button>
      </Flex>
    );
  }, [onOpenChange, pdfFile, pdfURL, setPDFConfig]);
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
    return (
      <Dialog.Root defaultOpen onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content
            css={{
              w: "min(420px,80%)",
              h: "min(348px, 90%)",
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
                  p: "0.5rem 0.75rem",
                  minHeight: "30px",
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
                <Text css={{ flexGrow: "1" }}>{pdfFile.name}</Text>
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
  return !pdfFile ? (
    <Dialog.Root defaultOpen onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content
          css={{
            w: "min(420px,80%)",
            h: "min(638px, 90%)",
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
              onChange={e => setPDFURL(e.target.value)}
              placeholder="Add PDF URL"
              type="text"
            />
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
