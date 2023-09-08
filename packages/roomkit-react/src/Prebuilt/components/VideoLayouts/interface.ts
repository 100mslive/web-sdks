import { HMSPeer } from '@100mslive/react-sdk';

export interface LayoutProps {
  isInsetEnabled?: boolean;
  edgeToEdge?: boolean;
  prominentRoles?: string[];
  peers: HMSPeer[];
  onPageChange?: (page: number) => void;
  onPageSize?: (size: number) => void;
}
