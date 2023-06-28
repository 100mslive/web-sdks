import React from "react";
import { InfoIcon } from "@100mslive/react-icons";
import { DialogRow } from "../../primitives/DialogContent";
import { Text } from "../base-components";

export const PdfErrorView = ({ isPDFUrlValid }) => {
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
          Please enter a valid PDF URL
        </Text>
      </DialogRow>
    )
  );
};
