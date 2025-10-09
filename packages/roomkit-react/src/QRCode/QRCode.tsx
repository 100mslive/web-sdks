import { ComponentProps } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export const QRCode = (props: ComponentProps<typeof QRCodeSVG>) => {
  return <QRCodeSVG style={{ width: '100%', height: '100%' }} {...props} />;
};
