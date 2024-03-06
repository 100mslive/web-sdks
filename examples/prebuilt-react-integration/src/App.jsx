import { HMSPrebuilt } from '@100mslive/roomkit-react';
// import { getRoomCodeFromUrl } from './utils';

export default function App() {
  // const roomCode = getRoomCodeFromUrl();

  return (
    <HMSPrebuilt
      authToken={
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXJzaW9uIjoyLCJ0eXBlIjoiYXBwIiwiYXBwX2RhdGEiOm51bGwsImFjY2Vzc19rZXkiOiI2MmU5MjlmMzNkZWM2M2JkNDlmNTM5MmEiLCJyb2xlIjoiX19pbnRlcm5hbF9yZWNvcmRlciIsInJvb21faWQiOiI2NTVhZjAyMjIwOTA2YWY5MjRiYzQ5NjIiLCJ1c2VyX2lkIjoiMTAwbXNfNGY1OGQ3MDEtMmVkYS00N2RlLTg5MWQtMjkwMjJjMjdlMTcxIiwiZXhwIjoxNzA5Nzg2NzY0LCJqdGkiOiI3MjZkNDU2Yy0xYzQ2LTRjMzUtOTY3MS05NzMyNDE4YmYzMjUiLCJpYXQiOjE3MDk3MDAzNjQsImlzcyI6IjYyZTkyOWYzM2RlYzYzYmQ0OWY1MzkyNyIsIm5iZiI6MTcwOTcwMDM2NCwic3ViIjoiYXBpIn0.p2Pe5U8BEkxDshkhYxk3vCWj978PS-HJY5I0jBZuOLY'
        // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXJzaW9uIjoyLCJ0eXBlIjoiYXBwIiwiYXBwX2RhdGEiOm51bGwsImFjY2Vzc19rZXkiOiI2MmVlNTQxY2MxNjY0MDA2NTY5NmFjNjIiLCJyb2xlIjoiX19pbnRlcm5hbF9yZWNvcmRlciIsInJvb21faWQiOiI2NWM1ZjRhYTQzOTZiZDYzZjIwNzJmNTgiLCJ1c2VyX2lkIjoiMTAwbXNfZTcwYmEyYmYtZDE5Ni00YmYzLTgyZGEtNzIwZTEzODM3MGVmIiwiZXhwIjoxNzA5NzMwMDI4LCJqdGkiOiI5ZjY2OGY5NC1mMGI2LTQ2MGEtOThiMS1hOGY4ZTQ4YjRmNzYiLCJpYXQiOjE3MDk2NDM2MjgsImlzcyI6IjYyZWU1NDFjYzE2NjQwMDY1Njk2YWM1ZiIsIm5iZiI6MTcwOTY0MzYyOCwic3ViIjoiYXBpIn0.bMJicd4nGtdK-2qmHG3QYWBaKr6aVqBnUBt0jaWOtp0'
      }
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
