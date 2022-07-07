import React from "react";
import { Toast as ToastPrimitive } from "@100mslive/react-ui";

export const Toast = ({
  title,
  description,
  close = true,
  open,
  duration,
  onOpenChange,
}) => {
  return (
    <ToastPrimitive.DefaultToast
      title={title}
      description={description}
      open={open}
      isClosable={close}
      onOpenChange={onOpenChange}
      duration={!close ? 600000 : duration}
    >
      {/* <ToastPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      duration={!close ? 600000 : duration}
    >
      <ToastPrimitive.Title css={{ mr: close ? "$12" : 0 }}>
        {title}
      </ToastPrimitive.Title>
      {description && (
        <ToastPrimitive.Description css={{ mr: close ? "$12" : 0 }}>
          {description}
        </ToastPrimitive.Description>
      )}
      {close && <ToastPrimitive.Close />}
    </ToastPrimitive.Root> */}
    </ToastPrimitive.DefaultToast>
  );
};
