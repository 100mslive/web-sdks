import { Flex, styled } from "@100mslive/react-ui";

export const VideoControls = styled(Flex, {
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  gap: 2,
});

export const LeftControls = styled(Flex, {
  justifyContent: "start",
  alignItems: "center",
  width: "100%",
  gap: 2,
});
export const RightControls = styled(Flex, {
  justifyContent: "end",
  alignItems: "center",
  width: "100%",
  gap: 2,
});
// export const LeftControls = ({ children }) => {
//   return (
//     <Flex
//       id="hms-video-controls-left"
//       justify="start"
//       align="center"
//       gap={2}
//       css={{ width: "100%" }}
//     >
//       {children}
//     </Flex>
//   );
// };

// export const RightControls = ({ children }) => {
//   return (
//     <Flex
//       id="hms-video-controls-right"
//       justify="end"
//       align="center"
//       gap={2}
//       css={{ width: "100%" }}
//     >
//       {children}
//     </Flex>
//   );
// };
