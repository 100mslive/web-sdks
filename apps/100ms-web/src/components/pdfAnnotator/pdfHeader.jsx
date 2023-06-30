import { CrossIcon } from "@100mslive/react-icons";
import { Dialog, Text, Flex } from "@100mslive/react-ui";
import { DialogCol } from "../../primitives/DialogContent";

export const PDFHeader = ({ onOpenChange }) => {
  return (
    <DialogCol
      align="start"
      css={{
        mt: 0,
        mb: "$6",
      }}
    >
      <Dialog.Title asChild>
        <Flex justify="between" align="center" css={{ w: "100%" }}>
          <Text as="h6" variant="h6">
            Start PDF Sharing
          </Text>
          <Flex
            onClick={() => onOpenChange(false)}
            css={{
              color: "$textHighEmp",
              cursor: "pointer",
              p: "$2",
              borderRadius: "$round",
              "&:hover": { backgroundColor: "$surfaceLighter" },
            }}
          >
            <CrossIcon />
          </Flex>
        </Flex>
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
};
