import { useCallback } from "react";
import { usePDFConfig } from "@100mslive/react-sdk";
import { Button, Flex } from "@100mslive/react-ui";

export const SubmitPDF = ({
  pdfFile,
  pdfURL,
  isValidateProgress,
  setIsPDFUrlValid,
  setIsValidateProgress,
  onOpenChange,
  hideSecondaryCTA = false,
}) => {
  const { setPDFConfig, resetPDFConfig } = usePDFConfig();
  const isValidPDF = useCallback(
    pdfURL => {
      const extension = pdfURL.split(".").pop().toLowerCase();
      setIsValidateProgress(true);
      if (extension === "pdf") {
        setIsPDFUrlValid(true);
        setIsValidateProgress(false);
        setPDFConfig({ isSharingPDF: true, url: pdfURL });
        onOpenChange(false);
      }

      fetch(pdfURL, { method: "HEAD" })
        .then(response => response.headers.get("content-type"))
        .then(contentType => {
          if (contentType === "application/pdf") {
            setIsPDFUrlValid(true);
            setIsValidateProgress(false);
            setPDFConfig({
              isSharingPDF: true,
              url: pdfURL,
            });
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
    [onOpenChange, setIsPDFUrlValid, setIsValidateProgress, setPDFConfig]
  );
  return (
    <Flex
      direction="row"
      css={{
        mb: "0",
        mt: "auto",
        gap: "$8",
      }}
    >
      {hideSecondaryCTA ? null : (
        <Button
          variant="standard"
          outlined
          type="submit"
          onClick={() => resetPDFConfig()}
          css={{ w: "50%" }}
        >
          Go Back
        </Button>
      )}
      <Button
        variant="primary"
        type="submit"
        onClick={() => {
          if (pdfFile) {
            setPDFConfig({
              isSharingPDF: true,
              file: pdfFile,
            });
            onOpenChange(false);
          } else if (pdfURL) {
            isValidPDF(pdfURL);
          }
        }}
        disabled={!pdfFile && !pdfURL}
        loading={isValidateProgress}
        data-testid="share_pdf_btn"
        css={{
          w: hideSecondaryCTA ? "100%" : "50%",
        }}
      >
        Start Sharing
      </Button>
    </Flex>
  );
};
