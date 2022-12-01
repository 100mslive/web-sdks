import { decodeWithLyra, encodeWithLyra, isLyraReady } from "lyra-codec";

export class LyraPlugin {
  kNumRequiredFrames = 2;
  kSampleRate = 48000;
  kNumSamplesPerFrame = 0.01 * this.kSampleRate;
  kNumRequiredSamples = this.kNumSamplesPerFrame * this.kNumRequiredFrames;
  buffer = new Float32Array(this.kNumRequiredSamples);
  buffer_index = 0;
  num_frames_copied = 0;
  initial_frame_start_time = 0;
  isLyraCodecReady = false;
  abortController = null;
  init() {}
  getName() {
    return "LyraPlugin";
  }
  checkSupport() {
    if (
      typeof MediaStreamTrackProcessor === "undefined" ||
      typeof MediaStreamTrackGenerator === "undefined"
    ) {
      return {
        isSupported: false,
        errType: "PLATFORM_NOT_SUPPORTED",
        errMsg:
          "Your browser does not support the experimental MediaStreamTrack API " +
          "for Insertable Streams of Media used by this demo. Please try on the latest Chrome or Edge browsers.",
      };
    }

    if (typeof AudioData === "undefined") {
      return {
        isSupported: false,
        errType: "PLATFORM_NOT_SUPPORTED",
        errMsg: "Your browser does not support WebCodecs",
      };
    }

    try {
      // eslint-disable-next-line no-undef
      new MediaStreamTrackGenerator("audio");
    } catch (e) {
      return {
        isSupported: false,
        errType: "PLATFORM_NOT_SUPPORTED",
        errMsg: "Your browser does not support insertable audio codecs",
      };
    }

    return { isSupported: true };
  }

  stop() {
    this.abortController.abort();
    this.abortController = null;
  }

  processAudioTrack(audioContext, sourceNode) {
    if (!audioContext) {
      throw new Error("Audio context is not created");
    }
    this.audioContext = audioContext;
    if (!sourceNode) {
      throw new Error("source node is not defined");
    }
    if (
      typeof MediaStreamTrackProcessor === "undefined" ||
      typeof MediaStreamTrackGenerator === "undefined"
    ) {
      throw new Error("MediaStreamTrackProcessor not supported");
    }
    //eslint-disable-next-line
    const processor = new MediaStreamTrackProcessor(
      sourceNode.stream.getAudioTracks()[0]
    );
    //eslint-disable-next-line
    const generator = new MediaStreamTrackGenerator("audio");
    const source = processor.readable;
    const sink = generator.writable;
    const transformer = new TransformStream({
      transform: this.encodeAndDecode(),
    });
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    const promise = source.pipeThrough(transformer, { signal }).pipeTo(sink);
    promise.catch(e => {
      if (signal.aborted) {
        console.log("Shutting down streams after abort.");
      } else {
        console.error("Error from stream transform:", e);
      }
      source.cancel(e);
      sink.abort(e);
    });
    const processedStream = new MediaStream();
    processedStream.addTrack(generator);
    return audioContext.createMediaStreamSource(processedStream);
  }

  encodeAndDecode() {
    return (audiodata, controller) => {
      if (!this.isLyraCodecReady && isLyraReady()) {
        this.isLyraCodecReady = true;
        console.log("Lyra codec is ready.");
      }

      if (!this.isLyraCodecReady) {
        console.log("*****Lyra codec is not in use*****.");
        controller.enqueue(audiodata);
      } else {
        console.log("*****Lyra codec is in use*****.");
        const format = "f32-planar";

        const current_buffer = new Float32Array(audiodata.numberOfFrames);
        audiodata.copyTo(current_buffer, { planeIndex: 0, format });

        // Copy from current buffer to accumulator buffer.
        for (let i = 0; i < audiodata.numberOfFrames; i++) {
          this.buffer[this.buffer_index % this.kNumRequiredSamples] =
            current_buffer[i];
          this.buffer_index++;
        }
        this.num_frames_copied++;
        if (this.num_frames_copied % this.kNumRequiredFrames === 0) {
          // We have enough frames to encode and decode.
          const encoded = encodeWithLyra(this.buffer, this.kSampleRate);
          const decoded = decodeWithLyra(
            encoded,
            this.kSampleRate,
            this.kNumRequiredSamples
          );

          controller.enqueue(
            // eslint-disable-next-line
            new AudioData({
              format: format,
              sampleRate: audiodata.sampleRate,
              numberOfFrames: decoded.length, // this is the number of samples.
              numberOfChannels: 1,
              timestamp: this.initial_frame_start_time,
              // A typed array of audio data.
              data: decoded,
            })
          );
        } else if (this.num_frames_copied % this.kNumRequiredFrames === 1) {
          this.initial_frame_start_time = audiodata.timestamp;
        }
      }
    };
  }
}
