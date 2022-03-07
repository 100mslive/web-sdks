/* @refresh reload */
import { HMSRoomProvider } from '@100mslive/solid-sdk';
import { render } from 'solid-js/web';
import App from './App';

render(
  () => (
    <HMSRoomProvider>
      <App />
    </HMSRoomProvider>
  ),
  document.getElementById('root'),
);
