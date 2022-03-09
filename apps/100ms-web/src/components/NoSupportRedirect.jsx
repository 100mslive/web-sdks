import { parsedUserAgent } from "@100mslive/react-sdk";
import { useEffect } from "react";
import { useHistory } from "react-router-dom";
import { ToastManager } from "./Toast/ToastManager";

export const NoSupportRedirect = () => {
  const history = useHistory();
  useEffect(() => {
    const browser = parsedUserAgent.getBrowser();
    ToastManager.addToast({ title: browser.name });
    if (browser.name?.toLowerCase().includes("miui")) {
      history.replace("/nosupport");
    }
  }, [history]);
  return null;
};
