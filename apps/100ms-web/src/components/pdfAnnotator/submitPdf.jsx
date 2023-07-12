import { useCallback } from "react";
import { Button, Flex } from "@100mslive/react-ui";
import { useSetAppDataByKey } from "../AppData/useUISettings";
import { APP_DATA } from "../../common/constants";

export const SubmitPDF = ({
  pdfFile,
  pdfURL,
  isValidateProgress,
  setIsPDFUrlValid,
  setIsValidateProgress,
  onOpenChange,
  hideSecondaryCTA = false,
}) => {
  const [, setPDFConfig] = useSetAppDataByKey(APP_DATA.pdfConfig);

  const isValidPDF = useCallback(
    async pdfURL => {
      setIsValidateProgress(true);
      try {
        // added for out ui purpose. Will be handled internally as well for client.
        await isValidPDFUrl(pdfURL);
        setPDFConfig({ data: pdfURL });
        onOpenChange(false);
        setIsPDFUrlValid(true);
      } catch (err) {
        setIsPDFUrlValid(false);
      } finally {
        setIsValidateProgress(false);
      }
    },
    [setIsValidateProgress, setPDFConfig, onOpenChange, setIsPDFUrlValid]
  );
  const resetConfig = useCallback(() => setPDFConfig(), [setPDFConfig]);
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
            setPDFConfig({ data: pdfFile });
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

export const isValidPDFUrl = pdfURL => {
  return new Promise((resolve, reject) => {
    if (!pdfURL) {
      reject(new Error("URL is empty"));
    }
    fetch(pdfURL, { method: "HEAD" })
      .then(response => response.headers.get("content-type"))
      .then(contentType => {
        if (contentType === "application/pdf") {
          resolve(true);
        } else {
          reject(new Error("URL does not contain pdf"));
        }
      })
      .catch(error => {
        reject(error);
      });
  });
};
