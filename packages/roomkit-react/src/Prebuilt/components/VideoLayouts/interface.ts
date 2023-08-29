import { HMSPeer } from '@100mslive/react-sdk';

export interface LayoutProps {
  peers: HMSPeer[];
  onPageChange?: (page: number) => void;
  onPageSize?: (size: number) => void;
}
