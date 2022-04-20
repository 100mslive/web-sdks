import { ToastConfig } from "./ToastConfig";
import { ToastManager } from "./ToastManager";

export const ToastBatcher = {
  toastsType: new Map(),
  showToast(notification, duration = 2000, type) {
    let notificationType = type;
    if (!type) {
      notificationType = notification.type;
    }
    const toastType = this.toastsType.has(notificationType);
    if (toastType) {
      let { notifications } = this.toastsType.get(notificationType);
      const { id } = notifications[0];
      notifications.push(notification);
      const toastText = ToastConfig[notificationType].multiple(notifications);
      const toastId = ToastManager.replaceToast(id, {
        title: toastText,
        duration: duration,
      });
      this.toastsType.set(notificationType, {
        id: toastId,
        notifications: notifications,
        duration: duration,
      });
    } else {
      const toastText = ToastConfig[notificationType].single(notification);
      const toastId = ToastManager.addToast({
        title: toastText,
        duration: duration,
      });
      let notifications = [];
      notifications.push(notification);
      this.toastsType.set(notificationType, {
        id: toastId,
        notifications: [...notifications],
        duration: duration,
      });
    }
  },
  syncUItoast(toastsDisplaying) {
    for (const [toastType, toastInfo] of this.toastsType.entries()) {
      if (!toastsDisplaying.find(toast => toast.id === toastInfo.id)) {
        this.toastsType.delete(toastType);
      }
    }
  },
};

ToastManager.addListener(ToastBatcher.syncUItoast.bind(ToastBatcher));
