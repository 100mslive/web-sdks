import { ReactNode } from 'react';
import '@100mslive/types-prebuilt';

declare module '@100mslive/types-prebuilt/elements/participant_list' {
  export interface ParticipantList {
    footer?: ReactNode;
  }
}

declare module '@100mslive/types-prebuilt/elements/preview_header' {
  export interface PreviewHeader {
    logoAdornment?: ReactNode;
  }
}

interface CustomSettingOption {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

interface SettingElements {
  customOptions?: CustomSettingOption[];
}

declare module '@100mslive/types-prebuilt' {
  export interface DefaultConferencingScreen_Elements {
    settings?: SettingElements;
  }

  export interface DefaultPreviewScreen_Elements {
    settings?: SettingElements;
  }
}
