export async function playSilentAudio() {
  const SILENT_AUDIO_URL = URL.createObjectURL(
    new Blob(
      [
        new Uint8Array([
          255, 227, 24, 196, 0, 0, 0, 3, 72, 1, 64, 0, 0, 4, 132, 16, 31, 227, 192, 225, 76, 255, 67, 12, 255, 221, 27,
          255, 228, 97, 73, 63, 255, 195, 131, 69, 192, 232, 223, 255, 255, 207, 102, 239, 255, 255, 255, 101, 158, 206,
          70, 20, 59, 255, 254, 95, 70, 149, 66, 4, 16, 128, 0, 2, 2, 32, 240, 138, 255, 36, 106, 183, 255, 227, 24,
          196, 59, 11, 34, 62, 80, 49, 135, 40, 0, 253, 29, 191, 209, 200, 141, 71, 7, 255, 252, 152, 74, 15, 130, 33,
          185, 6, 63, 255, 252, 195, 70, 203, 86, 53, 15, 255, 255, 247, 103, 76, 121, 64, 32, 47, 255, 34, 227, 194,
          209, 138, 76, 65, 77, 69, 51, 46, 57, 55, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 255, 227, 24, 196,
          73, 13, 153, 210, 100, 81, 135, 56, 0, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170,
          170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170,
          170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170, 170,
          170,
        ]),
      ],
      { type: 'audio/mpeg' },
    ),
  );

  const audio = document.createElement('audio');
  audio.src = SILENT_AUDIO_URL;
  let error: Error | undefined;
  try {
    await audio.play();
  } catch (err) {
    error = err as Error;
  }
  // reset audio src properly to reduce the mediaplayer element count
  // because of a bug in chrome 92 https://bugs.chromium.org/p/chromium/issues/detail?id=1232649
  audio.srcObject = null;
  audio.remove();
  if (error) {
    throw error;
  }
}
