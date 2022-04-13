import { ToastConfig } from "./ToastConfig";
import { ToastManager } from "./ToastManager";

export const ToastBatcher = {
  toastsType: new Map(),
  addToastType(toast) {
    const { type, duration } = toast;
    const toastType = this.toastsType.has(type);
    if (toastType) {
      const toastDetail = this.toastsType.get(type);
      const { id } = toastDetail;
      let count = toastDetail.count;
      count = parseInt(count) + 1;
      const toastText = ToastConfig[type].multiple({
        name: toast.title,
        count: count,
      });
      const toastId = ToastManager.replaceToast(id, {
        title: toastText,
        duration: duration,
      });
      this.toastsType.set(type, {
        id: toastId,
        count: count,
        title: toastText,
        duration: duration,
      });
    } else {
      const toastText = ToastConfig[type].single({ name: toast.title });
      const toastId = ToastManager.addToast({
        title: toastText,
        duration: duration,
      });
      this.toastsType.set(type, {
        id: toastId,
        count: 0,
        title: toastText,
        duration: duration,
      });
    }
  },
};
