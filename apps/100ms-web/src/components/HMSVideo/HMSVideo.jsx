import React, { forwardRef } from "react";

export const HMSVideoPlayer = forwardRef(({ children }, videoRef) => {
  return (
    <div id="hms-video" style={{ height: "100%", width: "100%" }}>
      <video
        style={{ height: "100%", margin: "auto" }}
        ref={videoRef}
        autoPlay
        playsInline
      />
      {children}
    </div>
  );
});
