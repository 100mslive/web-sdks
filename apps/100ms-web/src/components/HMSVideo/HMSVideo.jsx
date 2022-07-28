import { forwardRef } from "react";
import { Box } from "@100mslive/react-ui";

export const HMSVideo = forwardRef(({ children }, videoRef) => {
  return (
    <Box id="hms-video" style={{ height: "100%", width: "100%" }}>
      <video
        style={{ height: "100%", margin: "auto" }}
        ref={videoRef}
        autoPlay
        controls
        playsInline
      />
      {children}
    </Box>
  );
});
