import { Flex, Input, Label } from "@100mslive/react-ui";
import React from "react";

export const ResolutionInput = () => {
  return (
    <Flex justify="start" align="center">
      <Label
        htmlFor="resolution"
        css={{ ml: "$4", fontSize: "$sm", cursor: "pointer", width: "40%" }}
      >
        resolution
      </Label>
      <Input
        css={{ mb: "1rem", marginLeft: "1rem", width: "30%" }}
        autoComplete="name"
        type="text"
        required
        autoFocus
        maxLength={20}
        value="1280"
        onChange={e => {}}
        data-testid="preview_name_field"
      />
      <Input
        css={{ mb: "1rem", marginLeft: "1rem", width: "30%" }}
        autoComplete="name"
        type="text"
        required
        autoFocus
        maxLength={20}
        value="720"
        onChange={e => {}}
        data-testid="preview_name_field"
      />
    </Flex>
  );
};
