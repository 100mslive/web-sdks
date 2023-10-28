import r2wc from '@r2wc/react-to-web-component';
import { HMSPrebuilt } from '@100mslive/roomkit-react';

const HMSPrebuiltWebComponent = r2wc(HMSPrebuilt, {
  props: {
    roomCode: 'string',
    authToken: 'string',
    onLeave: 'function',
    roomId: 'string',
    role: 'string',
    options: 'json',
  },
});

customElements.define('hms-prebuilt', HMSPrebuiltWebComponent);
