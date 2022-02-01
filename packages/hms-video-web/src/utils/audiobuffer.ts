export async function createStreamFromUrl(url: string): Promise<MediaStream> {
  const BlobURL = await window.fetch(url);

  const audioContext = new AudioContext();
  const buffer = await BlobURL.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(buffer);
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;

  const streamDestination = audioContext.createMediaStreamDestination();

  source.connect(audioContext.destination);
  source.connect(streamDestination);
  source.start();
  return streamDestination.stream;
}
