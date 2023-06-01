import React, { useCallback, useState } from "react";
import { TrashIcon } from "@100mslive/react-icons";
import {
  Button,
  Dialog,
  Flex,
  HorizontalDivider,
  Input,
  Text,
} from "@100mslive/react-ui";
import { DialogInputFile, DialogRow } from "../../primitives/DialogContent";
import { useSetAppDataByKey } from "../AppData/useUISettings";
import { APP_DATA } from "../../common/constants";

export function PDFFileOptions({ onOpenChange }) {
  const [pdfConfig, setPDFConfig] = useSetAppDataByKey(APP_DATA.pdfConfig);
  const [pdfFile, setPDFFile] = useState(null);
  const [pdfURL, setPDFURL] = useState("");

  const SubmitSharing = useCallback(() => {
    return (
      <DialogRow
        css={{
          mb: "0",
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
      </DialogRow>
    );
  }, [onOpenChange, pdfFile, pdfURL, setPDFConfig]);
  const PDFHeader = useCallback(() => {
    return (
      <>
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
      </>
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
              h: "min(264px, 90%)",
              overflow: "auto",
              p: "$10",
            }}
          >
            <Flex direction="column">
              <Flex direction="column" flexGrow="1">
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
              </Flex>
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
            h: "min(516px, 90%)",
            overflow: "auto",
            p: "$10",
          }}
        >
          <Flex direction="column">
            <Flex direction="column" flexGrow="1">
              <PDFHeader />
              <DialogInputFile
                onChange={target => {
                  setPDFFile(target.files[0]);
                }}
                placeholder="Click to upload"
                type="file"
                accept=".pdf"
              />
              <DialogRow>
                <HorizontalDivider
                  css={{
                    mx: "$2",
                  }}
                />
                <Text variant="sm">OR</Text>
                <HorizontalDivider
                  css={{
                    mx: "$2",
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
            </Flex>
            <SubmitSharing />
          </Flex>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  ) : (
    <ShowUploadedFile />
  );
}
