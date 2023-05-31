import { PageWrapper } from '../PageWrapper';

export class HlsViewerPage {
  private page: PageWrapper;

  hls_viewer_name_field = 'input[placeholder="Enter your name"]';
  hls_viewer_get_started_btn = 'text="Join Room"';
  hls_viewer_play_pause_btn = 'button[data-testid="play_pause_btn"]';
  hls_viewer_full_screen_btn = 'button[data-testid="fullscreen_btn"]';
  hls_viewer_leave_room_btn = 'button[data-testid="leave_room_btn"]';
  hls_viewer_more_settings_btn = 'button[data-testid="more_settings_btn"]';
  hls_viewer_hls_stats = 'text="Show HLS Stats"';
  hls_viewer_stats_url = 'text="URL"';
  hls_viewer_stats_video_size = 'text="Video size"';
  hls_viewer_stats_buffer_duration = 'text="Buffer duration"';
  hls_viewer_stats_connection_speed = 'text="Connection speed"';
  hls_viewer_stats_bitrate = 'text="Bitrate"';
  hls_viewer_stats_distance_from_live = 'text="distance from live"';
  hls_viewer_stats_dropped_frames = 'text="Dropped frames"';
  waiting_stream_start_text = 'Waiting for the stream to start...';

  constructor(page: PageWrapper) {
    this.page = page;
  }

  async gotoHLSMeetingRoom(url: string, name: string) {
    await this.page.goto({ url });
    await this.page.sendText(this.hls_viewer_name_field, name);
    await this.page.click(this.hls_viewer_get_started_btn);
  }
}
