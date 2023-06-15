import { Box } from "@100mslive/react-ui";

// Width to be supplied as %
export const ProgressBar = ({ w }) => (
  <Box
    css={{
      backgroundColor: "$secondaryDark",
      h: "$4",
      borderRadius: "100px",
      overflow: "hidden",
    }}
  >
    <Box
      css={{
        backgroundColor: "$primaryDefault",
        h: "$4",
        w: w,
      }}
    />
  </Box>
);
