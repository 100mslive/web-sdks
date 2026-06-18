import { HMSPrebuilt, Diagnostics } from '@100mslive/roomkit-react';
import FontScaleRepro from './FontScaleRepro';
import PrebuiltScaled from './PrebuiltScaled';
import { getRoomCodeFromUrl } from './utils';

export default function App() {
  const roomCode = getRoomCodeFromUrl();
  const isDiagnostics = location.pathname.startsWith('/diagnostics');
  const isFontScaleRepro = location.pathname.startsWith('/font-scale-repro');
  const isPrebuiltScaled = location.pathname.startsWith('/prebuilt-scaled');

  if (isPrebuiltScaled) {
    return <PrebuiltScaled />;
  }

  if (isFontScaleRepro) {
    return <FontScaleRepro />;
  }

  if (isDiagnostics) {
    return <Diagnostics />;
  }

  return <HMSPrebuilt roomCode={roomCode} />;
}
