import { useCallback } from "react";
import { usePDFAnnotator } from "@100mslive/react-sdk";
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
  const { setConfig, resetConfig } = usePDFAnnotator();
  const isValidPDF = useCallback(
    async pdfURL => {
      setIsValidateProgress(true);
      try {
        await setConfig({
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
    [onOpenChange, setIsPDFUrlValid, setIsValidateProgress, setConfig]
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
          onClick={() => resetConfig()}
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
            setConfig({
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
