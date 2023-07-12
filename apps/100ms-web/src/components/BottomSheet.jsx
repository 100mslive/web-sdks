import React, { useEffect, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { CrossIcon } from "@100mslive/react-icons";
import { Box, Flex, Text } from "@100mslive/react-ui";
import { getUpdatedHeight } from "../common/utils";

const BottomSheet = ({
  title = "",
  children = <></>,
  triggerContent,
  containerCSS = {},
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetHeight, setSheetHeight] = useState("50vh");
  const closeRef = useRef();

  // Close the sheet if height goes under 40vh
  useEffect(() => {
    if (closeRef?.current && parseFloat(sheetHeight.slice(0, -2)) <= 40) {
      setSheetOpen(false);
      // Delay for showing the opacity animation, can be removed if not needed
      setTimeout(() => closeRef.current?.click(), 200);
    }
  }, [sheetHeight]);

  return (
    <>
      <Popover.Root
        onOpenChange={open => {
          if (!open) {
            setSheetHeight(0);
          }
          setSheetOpen(open);
        }}
      >
        <Popover.Trigger asChild>{triggerContent}</Popover.Trigger>
        <Popover.Portal>
          <Popover.Content sideOffset={-48}>
            <Box
              css={{
                w: "100vw",
                py: "$8",
                position: "relative",
                opacity: sheetOpen ? "1" : "0.5",
                zIndex: "30",
                h: sheetHeight,
                minHeight: "50vh",
                overflowY: "auto",
                backgroundColor: "$surfaceDefault",
                transition: "all 0.2s linear",
                ...containerCSS,
              }}
            >
              <Flex
                justify="between"
                onTouchMove={e => {
                  const updatedSheetHeight = getUpdatedHeight(e);
                  setSheetHeight(updatedSheetHeight);
                }}
                css={{
                  borderBottom: "1px solid $borderLight",
                  px: "$8",
                  pb: "$4",
                  mb: "$4",
                  w: "100%",
                }}
              >
                <Text variant="h6" css={{ color: "$textHighEmp" }}>
                  {title}
                </Text>
                <Popover.Close aria-label="Close" ref={closeRef}>
                  <Box
                    css={{
                      color: "$textHighEmp",
                      bg: "$surfaceLight",
                      p: "$2",
                      borderRadius: "$round",
                    }}
                  >
                    <CrossIcon />
                  </Box>
                </Popover.Close>
              </Flex>
              <Box css={{ px: "$8" }}>{children}</Box>
            </Box>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </>
  );
};

export default BottomSheet;
