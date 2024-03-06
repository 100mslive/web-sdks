import { HMSPrebuilt } from '@100mslive/roomkit-react';
// import { getRoomCodeFromUrl } from './utils';

export default function App() {
  // const roomCode = getRoomCodeFromUrl();

  return (
    <HMSPrebuilt
      // roomCode={roomCode}
      authToken={""}
      options={{
        endpoints: {
          tokenByRoomCode: 'https://auth-nonprod.100ms.live/v2/token',
          roomLayout: 'https://api-nonprod.100ms.live/v2/layouts/ui',
          init: 'https://qa-in2-ipv6.100ms.live/init',
        },
      }}
      screens={{
        preview: null,
        conferencing: {
          default: {
            hideSections: ['footer', 'header'],
            elements: {
              video_tile_layout: {
                grid: {
                  enable_local_tile_inset: false,
                  hide_participant_name_on_tile: true,
                  rounded_video_tile: false,
                  hide_audio_mute_on_tile: true,
                  video_object_fit: 'contain',
                  edge_to_edge: true,
                  hide_metadata_on_tile: true,
                },
              },
            },
          },
        },
      }}
    />
  );
}
