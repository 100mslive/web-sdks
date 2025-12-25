import isEqual from 'lodash.isequal';

/**
 * Utility function to generate a property change checker for settings objects
 * @param newSettings - The new settings to compare against
 * @param oldSettings - The old settings to compare
 * @returns Function that checks if a specific property has changed
 */
export function generateHasPropertyChanged<T extends Record<string, any>>(
  newSettings: Partial<T>,
  oldSettings: T,
): (prop: keyof T) => boolean {
  return function hasChanged(prop: keyof T): boolean {
    return !isEqual(newSettings[prop], oldSettings[prop]);
  };
}

/**
 * Utility to merge settings objects with type safety
 * @param currentSettings - Current settings object
 * @param updates - Partial updates to apply
 * @returns Merged settings object
 */
export function mergeSettings<T extends Record<string, any>>(currentSettings: T, updates: Partial<T>): T {
  return { ...currentSettings, ...updates };
}

/**
 * Utility to check if device ID has changed in settings
 * @param newSettings - New settings to check
 * @param oldSettings - Old settings to compare against
 * @returns True if device ID has changed
 */
export function hasDeviceIdChanged<T extends { deviceId?: string }>(newSettings: Partial<T>, oldSettings: T): boolean {
  const hasChanged = generateHasPropertyChanged(newSettings, oldSettings);
  return hasChanged('deviceId');
}

/**
 * Common pattern for handling manual device selection tracking
 */
export class ManualDeviceSelection {
  private manuallySelectedDeviceId?: string;

  setManuallySelected(deviceId?: string): void {
    this.manuallySelectedDeviceId = deviceId;
  }

  getManuallySelected(): string | undefined {
    return this.manuallySelectedDeviceId;
  }

  reset(): void {
    this.manuallySelectedDeviceId = undefined;
  }

  shouldTrackAsManual(isInternalChange: boolean, deviceId?: string): string | undefined {
    return !isInternalChange ? deviceId : this.manuallySelectedDeviceId;
  }
}
