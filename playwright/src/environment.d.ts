declare global {
  namespace NodeJS {
    interface ProcessEnv {
      audio_video_screenshare_url: string;
      peer_name: string;
      beam_wait_timeout: string;
      twitch_rtmp_url: string;
      yt_rtmp_url: string;
      multi_peer_count: string;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
