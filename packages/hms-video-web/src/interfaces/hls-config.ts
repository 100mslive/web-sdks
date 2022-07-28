export interface HLSConfig {
  /**
   * A list of meeting url which needs to be streamed as HLS feed, only one url is currently supported, all entries
   * except the first one will be ignored.
   */
  variants?: Array<HLSMeetingURLVariant>;
  /**
   * pass in this field if recording needs to be turned on as well
   */
  recording?: {
    /**
     * if the desired end result is a mp4 file per HLS layer, false by default
     */
    singleFilePerLayer?: boolean;
    /**
     * if the desired end result is a zip of m3u8 and all the chunks, false by default
     */
    hlsVod?: boolean;
  };
}

export interface HLSMeetingURLVariant {
  /**
   * This meeting url is opened in a headless chrome instance for generating the HLS feed.
   * Make sure this url leads the joiner straight to the room without any preview screen or requiring additional clicks.
   */
  meetingURL: string;
  /**
   * additional metadata for this url for e.g. - landscape/portrait, the field is not currently supported
   * @alpha
   */
  metadata?: string;
}

export interface HLSTimedMetadata {
  payload: string;
  duration: number; // Duration in seconds
}
