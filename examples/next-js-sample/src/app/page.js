'use client';
import dynamic from 'next/dynamic';
const HMSPrebuilt = dynamic(() => import('@100mslive/roomkit-react').then(module => module.HMSPrebuilt), {
  ssr: false,
});
export default function Home() {
  return <HMSPrebuilt roomCode="thirsty-malachite-quail" />;
}
