import { useCallback } from "react";
import { usePDFScreenShare } from "@100mslive/react-sdk";
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
  const { setPDFConfig, resetPDFConfig } = usePDFScreenShare();
  const isValidPDF = useCallback(
    async pdfURL => {
      setIsValidateProgress(true);
      try {
        await setPDFConfig({
          isSharing: true,
          url: pdfURL,
        });
        onOpenChange(false);
        setIsPDFUrlValid(true);
      } catch (err) {
        setIsPDFUrlValid(false);
      } finally {
        setIsValidateProgress(false);
      }
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
        onClick={async () => {
          if (pdfFile) {
            setPDFConfig({
              isSharing: true,
              file: pdfFile,
            });
            onOpenChange(false);
          } else if (pdfURL) {
            await isValidPDF(pdfURL);
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
