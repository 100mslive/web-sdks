import { Button, Flex } from "@100mslive/react-ui";
import {
  useResetPDFConfig,
  useSetAppDataByKey,
} from "../AppData/useUISettings";
import { APP_DATA } from "../../common/constants";

export const SubmitPDF = ({
  pdfFile,
  pdfURL,
  onOpenChange,
  hideSecondaryCTA = false,
  setPDFFile = () => {},
}) => {
  const [, setPDFConfig] = useSetAppDataByKey(APP_DATA.pdfConfig);
  const resetConfig = useResetPDFConfig();
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
          onClick={() => {
            resetConfig();
            setPDFFile(null);
          }}
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
            setPDFConfig(pdfFile);
            onOpenChange(false);
          } else if (pdfURL) {
            setPDFConfig(pdfURL);
            onOpenChange(false);
          }
        }}
        disabled={!pdfFile && !pdfURL}
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
