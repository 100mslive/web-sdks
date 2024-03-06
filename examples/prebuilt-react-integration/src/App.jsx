import { HMSPrebuilt } from '@100mslive/roomkit-react';
// import { getRoomCodeFromUrl } from './utils';

export default function App() {
  // const roomCode = getRoomCodeFromUrl();

  return (
    <HMSPrebuilt
      // roomCode={roomCode}
      authToken="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXJzaW9uIjoyLCJ0eXBlIjoiYXBwIiwiYXBwX2RhdGEiOm51bGwsImFjY2Vzc19rZXkiOiI2MmU5MjlmMzNkZWM2M2JkNDlmNTM5MmEiLCJyb2xlIjoiX19pbnRlcm5hbF9yZWNvcmRlciIsInJvb21faWQiOiI2NTVhZjAyMjIwOTA2YWY5MjRiYzQ5NjIiLCJ1c2VyX2lkIjoiMTAwbXNfOWVlMzdmYTctZWEwMC00NWU0LTg0YTQtNDA5NmNhYmVkMWYwIiwiZXhwIjoxNzA5ODIzOTU3LCJqdGkiOiJlMjkzZjkxYi1mZWYzLTQ5ZjItOTM2Yi0xOWEzYzBlNTc3MjIiLCJpYXQiOjE3MDk3Mzc1NTcsImlzcyI6IjYyZTkyOWYzM2RlYzYzYmQ0OWY1MzkyNyIsIm5iZiI6MTcwOTczNzU1Nywic3ViIjoiYXBpIn0.RRCQm3eXCeXB97xJqpREN25vGIo_OttZeUnTEqfb0Nc"
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
