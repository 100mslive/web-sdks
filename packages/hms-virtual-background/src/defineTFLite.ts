const pkg = require('../package.json');
const BASE_URL = `https://unpkg.com/${pkg.name}/src`;
const TAG = 'VBProcessor';
const TFLITE_JS_FILE = 'tflite/tflite.js';
const TFLITE_SIMD_JS_FILE = 'tflite/tflite-simd.js';
const MODEL_FILE_NAME = 'models/selfie_segmentation_landscape.tflite';

const loadScript = (src: string) => {
  return new Promise(function (resolve, reject) {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
};

const loadTFLiteModel = async () => {
  let tfLite: any;
  let path = `${BASE_URL}/${TFLITE_SIMD_JS_FILE}`;
  await loadScript(path);
  try {
    //@ts-ignore
    tfLite = await createTFLiteSIMDModule();
  } catch {
    console.warn('SIMD not supported. You may experience poor virtual background effect.');
    path = `${BASE_URL}/${TFLITE_JS_FILE}`;
    await loadScript(path);
    // @ts-ignore
    tfLite = await createTFLiteModule();
  }
  return tfLite;
};

const loadTFLite = async () => {
  const modelPath = `${BASE_URL}/${MODEL_FILE_NAME}`;
  const [tfLite, modelResponse] = await Promise.all([loadTFLiteModel(), fetch(modelPath)]);

  const model = await modelResponse.arrayBuffer();
  const modelBufferOffset = tfLite._getModelBufferMemoryOffset();
  tfLite.HEAPU8.set(new Uint8Array(model), modelBufferOffset);
  tfLite._loadModel(model.byteLength);

  console.debug(TAG, 'Input memory offset:', tfLite._getInputMemoryOffset());
  console.debug(TAG, 'Input height:', tfLite._getInputHeight());
  console.debug(TAG, 'Input width:', tfLite._getInputWidth());
  console.debug(TAG, 'Input channels:', tfLite._getInputChannelCount());

  return tfLite;
};

export { loadTFLite };
