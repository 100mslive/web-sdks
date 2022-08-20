/* eslint-disable */
var _a$2, _b;
var _c, _d;
typeof File !== "undefined" && ((_a$2 = (_c = File.prototype).arrayBuffer) !== null && _a$2 !== void 0 ? _a$2 : _c.arrayBuffer = arrayBuffer);
typeof Blob !== "undefined" && ((_b = (_d = Blob.prototype).arrayBuffer) !== null && _b !== void 0 ? _b : _d.arrayBuffer = arrayBuffer);
function arrayBuffer() {
  return new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.readAsArrayBuffer(this);
  });
}
let id = 0;
const uid$1 = () => id++;
class Worker {
  constructor(code) {
    if (typeof window === "undefined")
      return this;
    const url = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
    const wrkr = new globalThis.Worker(url);
    URL.revokeObjectURL(url);
    return wrkr;
  }
}
var SetTimeout = "(function () {\n    'use strict';\n\n    onmessage = ({ data: request }) => {\n        const response = { id: request.id };\n        setTimeout(postMessage, request.timeout, response);\n    };\n\n})();\n";
const worker$1 = new Worker(SetTimeout);
const callbacks$2 = new Map();
const setTimeout$3 = (callback, timeout) => {
  const id2 = uid$1();
  const request = { id: id2, timeout };
  callbacks$2.set(request.id, callback);
  worker$1.postMessage(request);
  return id2;
};
worker$1.onmessage = ({ data: response }) => {
  const callback = callbacks$2.get(response.id);
  callbacks$2.delete(response.id);
  callback();
};
const fps = 60;
const interval = 1e3 / fps;
const callbacks$1 = [];
let then = 0;
const requestAnimationFrame$3 = (callback) => {
  const id2 = uid$1();
  if (callbacks$1.length === 0) {
    const now = performance.now();
    const timeout = interval - (now - then) % interval;
    setTimeout$3(() => {
      const now2 = then = performance.now();
      const copy = [...callbacks$1];
      callbacks$1.length = 0;
      copy.forEach((callback2) => callback2(now2));
    }, timeout);
  }
  callbacks$1.push(callback);
  return id2;
};
var offscreen = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  setTimeout: setTimeout$3,
  requestAnimationFrame: requestAnimationFrame$3
});
const setTimeout$2 = (...args) => window.setTimeout(...args);
const callbacks = new Map();
const requestAnimationFrame$2 = (callback) => {
  const rafId = window.requestAnimationFrame((...args) => {
    callbacks.delete(rafId);
    callback(...args);
  });
  callbacks.set(rafId, callback);
  return rafId;
};
if (typeof document !== "undefined")
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible")
      return;
    callbacks.forEach((callback, rafId) => {
      callbacks.delete(rafId);
      cancelAnimationFrame(rafId);
      requestAnimationFrame$3(callback);
    });
  });
var window$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  setTimeout: setTimeout$2,
  requestAnimationFrame: requestAnimationFrame$2
});
const getContext = () => document.visibilityState === "visible" ? window$1 : offscreen;
const requestAnimationFrame$1 = (callback) => getContext().requestAnimationFrame(callback);
const setTimeout$1 = (callback, timeout) => getContext().setTimeout(callback, timeout);
const tick = () => new Promise((r) => requestAnimationFrame$1(r));
const varying = (currentFps = -1) => {
  return function(_target, _propertyKey, descriptor) {
    const method = descriptor.value;
    async function* value(...args) {
      const generator = method.call(this, ...args);
      let then2 = 0;
      let now = 0;
      while (true) {
        const interval2 = 1e3 / currentFps;
        const tolerance = 0.1 * interval2;
        while ((now = performance.now()) - then2 < interval2 - tolerance)
          await tick();
        then2 = now;
        const { done, value: value2 } = await generator.next();
        if (done)
          return value2;
        const fps2 = yield value2;
        if (typeof fps2 !== "undefined")
          currentFps = fps2;
      }
    }
    return { ...descriptor, value };
  };
};
const createVideoElement = async (source, options = {}) => new Promise((resolve) => {
  const video = document.createElement("video");
  video.muted = true;
  video.controls = false;
  video.playsInline = true;
  Object.assign(video, options);
  if (source instanceof globalThis.MediaStream) {
    video.srcObject = source;
    video.addEventListener("ended", () => video.srcObject = null, { once: true });
    source.addEventListener("inactive", () => video.dispatchEvent(new CustomEvent("ended")), {
      once: true
    });
  } else {
    if (typeof source !== "string") {
      const src = source = URL.createObjectURL(source);
      video.addEventListener("emptied", () => URL.revokeObjectURL(src), { once: true });
    }
    video.crossOrigin = "anonymous";
    video.src = source;
    video.addEventListener("ended", () => video.src = "", { once: true });
  }
  video.style.position = "fixed";
  video.style.zIndex = "-9999999";
  video.style.opacity = "0.0000000001";
  document.body.appendChild(video);
  video.addEventListener("emptied", () => video.remove(), { once: true });
  const i = setInterval(() => video.readyState, 300);
  video.addEventListener("play", () => clearInterval(i), { once: true });
  video.addEventListener("play", () => resolve(video), { once: true });
  video.addEventListener("loadedmetadata", () => video.play(), { once: true });
});
const createCanvas$2 = (width = 300, height = 150) => {
  let canvas;
  if (typeof OffscreenCanvas === "undefined") {
    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
  } else {
    canvas = new OffscreenCanvas(width, height);
  }
  return canvas;
};
const createRenderingContext$2 = (externalCanvas, settings = {}) => {
  const canvas = externalCanvas || createCanvas$2();
  const ctx = canvas.getContext("2d", settings);
  return {
    get width() {
      return canvas.width;
    },
    get height() {
      return canvas.height;
    },
    drawImage: async (source, dx, dy, dw, dh) => {
      var _a2, _b2;
      canvas.width = (_a2 = source.videoWidth) !== null && _a2 !== void 0 ? _a2 : source.width;
      canvas.height = (_b2 = source.videoHeight) !== null && _b2 !== void 0 ? _b2 : source.height;
      ctx.save();
      ctx.translate(dx, dy);
      ctx.scale(Math.sign(dw), Math.sign(dh));
      if (source instanceof ImageData) {
        ctx.putImageData(source, dx, dy);
      } else {
        ctx.drawImage(source, 0, 0, Math.abs(dw), Math.abs(dh));
      }
      ctx.restore();
    },
    getImageData: async (...args) => {
      const { width, height, data } = ctx.getImageData(...args);
      return { width, height, data, format: "RGBA" };
    },
    dispose: () => {
    }
  };
};
const defaultSettings = {
  alpha: true,
  antialias: false,
  depth: false,
  desynchronized: false,
  premultipliedAlpha: false,
  preserveDrawingBuffer: false,
  stencil: false
};
const createRenderingContext$1 = (externalCanvas, settings = {}) => {
  const canvas = externalCanvas || createCanvas$2();
  const gl = canvas.getContext("webgl2", {
    ...defaultSettings,
    ...settings
  });
  if (gl == null)
    return null;
  const vs = createShader(gl, gl.VERTEX_SHADER, `#version 300 es
    uniform vec2 u_scale;
    out vec2 v_tex_uv;

    void main() {
      float x = -1.0 + float((gl_VertexID & 1) << 2);
      float y = -1.0 + float((gl_VertexID & 2) << 1);

      v_tex_uv.x = (x + 1.0) * 0.5;
      v_tex_uv.y = (y + 1.0) * 0.5;

      gl_Position = vec4(x, y, 0, 1);
      gl_Position.xy *= u_scale;
    }
  `);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, `#version 300 es
    precision mediump float;

    in vec2 v_tex_uv;
    uniform sampler2D u_texture;
    out vec4 fragColor;

    void main () {
      fragColor = texture(u_texture, v_tex_uv);
    }
  `);
  const program = createProgram(gl, vs, fs);
  const write = createTexture(gl, gl.TEXTURE0);
  const read = createTexture(gl, gl.TEXTURE1);
  let fb = null;
  if (externalCanvas instanceof HTMLCanvasElement)
    ;
  else {
    fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, read, 0);
  }
  const pb = gl.createBuffer();
  gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pb);
  gl.bufferData(gl.PIXEL_PACK_BUFFER, 0, gl.STREAM_READ);
  const scale = gl.getUniformLocation(program, "u_scale");
  const glFormat = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_FORMAT);
  const glType = gl.getParameter(gl.IMPLEMENTATION_COLOR_READ_TYPE);
  const format = glFormat === gl.RGB ? "RGB" : "RGBA";
  const components = format.length;
  if (format === "RGB")
    gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
  let data;
  return {
    get width() {
      return gl.drawingBufferWidth;
    },
    get height() {
      return gl.drawingBufferHeight;
    },
    async drawImage(source, dx, dy, dw, dh) {
      gl.activeTexture(gl.TEXTURE0);
      gl.texImage2D(gl.TEXTURE_2D, 0, glFormat, glFormat, glType, source);
      const scaleX = Math.sign(dw);
      const scaleY = Math.sign(dh);
      if (scale.x !== scaleX || scale.y !== scaleY) {
        gl.uniform2fv(scale, new Float32Array([scale.x = scaleX, scale.y = scaleY]));
      }
      if (dw < 0)
        dw = Math.abs(dw);
      if (dh < 0)
        dh = Math.abs(dh);
      if (canvas.width !== dw || canvas.height !== dh) {
        gl.activeTexture(gl.TEXTURE1);
        gl.texImage2D(gl.TEXTURE_2D, 0, glFormat, canvas.width = dw, canvas.height = dh, 0, glFormat, glType, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    getImageData: async (sx, sy, sw, sh) => {
      if ((data === null || data === void 0 ? void 0 : data.length) !== sw * sh * components) {
        data = new Uint8ClampedArray(sw * sh * components);
        gl.bufferData(gl.PIXEL_PACK_BUFFER, data.length, gl.STREAM_READ);
      }
      gl.readPixels(sx, sy, sw, sh, glFormat, glType, 0);
      await fence(gl);
      gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, data);
      return { width: sw, height: sh, data, format };
    },
    dispose() {
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
      gl.activeTexture(gl.TEXTURE1);
      if (fb)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.useProgram(null);
      gl.deleteBuffer(pb);
      gl.deleteFramebuffer(fb);
      gl.deleteTexture(write);
      gl.deleteTexture(read);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    }
  };
};
function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);
  return program;
}
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}
function createTexture(gl, texture) {
  const tex = gl.createTexture();
  gl.activeTexture(texture);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return tex;
}
const didGPUComplete = (gl, sync) => {
  const status = gl.clientWaitSync(sync, 0, 0);
  return status === gl.CONDITION_SATISFIED || status === gl.ALREADY_SIGNALED;
};
async function fence(gl) {
  const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  gl.flush();
  await new Promise((resolve) => function test() {
    if (didGPUComplete(gl, sync))
      resolve();
    else
      setTimeout$1(test, 2);
  }());
  gl.deleteSync(sync);
}
const createRenderingContext = (canvas, settings) => {
  let ctx = createRenderingContext$1(canvas, settings);
  if (ctx == null)
    ctx = createRenderingContext$2(canvas, settings);
  return ctx;
};
const defaultOptions = {
  horizontalFlip: false,
  resize: (width, height) => [width, height],
  crop: (width, height) => [0, 0, width, height]
};
const createFramer = (options = {}) => {
  const { resize, crop, horizontalFlip } = { ...defaultOptions, ...options };
  return {
    dxywh(source) {
      var _a2, _b2;
      const width = (_a2 = source.videoWidth) !== null && _a2 !== void 0 ? _a2 : source.width;
      const height = (_b2 = source.videoHeight) !== null && _b2 !== void 0 ? _b2 : source.height;
      let [dx, dy] = [0, 0];
      let [dw, dh] = resize(width, height);
      if (horizontalFlip)
        [dx, dw] = [dw, -dw];
      return [dx, dy, dw, dh];
    },
    sxywh(source) {
      var _a2, _b2;
      const width = (_a2 = source.videoWidth) !== null && _a2 !== void 0 ? _a2 : source.width;
      const height = (_b2 = source.videoHeight) !== null && _b2 !== void 0 ? _b2 : source.height;
      const [sx, sy, sw, sh] = crop(width, height);
      return [sx, sy, sw, sh];
    }
  };
};
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
function __decorate(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1; i >= 0; i--)
      if (d = decorators[i])
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}
var _a$1;
class Image$1 {
  constructor(source) {
    Object.defineProperty(this, "_src", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this._src = typeof source === "string" ? source : URL.createObjectURL(source);
  }
  async *[_a$1 = Symbol.asyncIterator](options) {
    const img = document.createElement("img");
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.crossOrigin = "anonymous";
      img.src = this._src;
    });
    const ctx = createRenderingContext();
    const framer = createFramer(options);
    ctx.drawImage(img, ...framer.dxywh(img));
    const frame = await ctx.getImageData(...framer.sxywh(ctx));
    ctx.dispose();
    URL.revokeObjectURL(img.src), img.src = "";
    while (true)
      yield frame;
  }
}
__decorate([
  varying(30)
], Image$1.prototype, _a$1, null);
var _a;
const defaultVideoOptions = {
  loop: false
};
class Video {
  constructor(source, options) {
    Object.defineProperty(this, "_video", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: null
    });
    Object.defineProperty(this, "_ctx", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: null
    });
    Object.defineProperty(this, "_src", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_options", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this._src = source;
    this._options = {
      ...defaultVideoOptions,
      ...options
    };
  }
  async *[_a = Symbol.asyncIterator](options) {
    var _b2, _c2;
    const video = (_b2 = this._video) !== null && _b2 !== void 0 ? _b2 : this._video = await createVideoElement(this._src, this._options);
    const ctx = (_c2 = this._ctx) !== null && _c2 !== void 0 ? _c2 : this._ctx = createRenderingContext();
    const framer = createFramer(options);
    let isEmpty = false;
    video.addEventListener("ended", () => this.stop(), { once: true });
    video.addEventListener("emptied", () => isEmpty = true, { once: true });
    video.addEventListener("emptied", () => next.then(() => ctx.dispose()), { once: true });
    ctx.drawImage(video, ...framer.dxywh(video));
    let prev = ctx.getImageData(...framer.sxywh(ctx));
    let next;
    while (!isEmpty) {
      ctx.drawImage(video, ...framer.dxywh(video));
      next = ctx.getImageData(...framer.sxywh(ctx));
      await new Promise((r) => setTimeout$1(r));
      yield prev;
      await (prev = next);
      await new Promise((r) => requestAnimationFrame$1(r));
    }
  }
  stop() {
    if (this._video)
      this._video.srcObject = null, this._video.src = "";
    this._ctx = null;
    this._video = null;
  }
}
__decorate([
  varying(30)
], Video.prototype, _a, null);
class MediaStream$1 {
  constructor(stream) {
    Object.defineProperty(this, "_video", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: null
    });
    Object.defineProperty(this, "_stream", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: null
    });
    if (!MediaStream$1.cache.has(stream))
      MediaStream$1.cache.set(stream, this);
    else
      return MediaStream$1.cache.get(stream);
    this._stream = stream;
  }
  async *[Symbol.asyncIterator](options) {
    var _a2;
    const video = (_a2 = this._video) !== null && _a2 !== void 0 ? _a2 : this._video = new Video(this._stream);
    const frames = video[Symbol.asyncIterator](options);
    let opts;
    while (true) {
      const { done, value } = await frames.next(opts);
      if (done)
        break;
      else
        opts = yield value;
    }
    this.stop();
  }
  stop() {
    var _a2, _b2, _c2;
    const tracks = (_c2 = (_b2 = (_a2 = this._stream) === null || _a2 === void 0 ? void 0 : _a2.getVideoTracks) === null || _b2 === void 0 ? void 0 : _b2.call(_a2)) !== null && _c2 !== void 0 ? _c2 : [];
    for (const track of tracks)
      track.stop();
    this._stream = null;
    this._video = null;
  }
}
Object.defineProperty(MediaStream$1, "cache", {
  enumerable: true,
  configurable: true,
  writable: true,
  value: new WeakMap()
});
const isMobile = typeof screen !== "undefined" && screen.height > screen.width;
const defaultVideoConstraints = {
  facingMode: "user",
  width: isMobile ? {} : { min: 640, ideal: 1280, max: 1920 },
  height: isMobile ? {} : { min: 480, ideal: 720, max: 1080 },
  resizeMode: { ideal: "crop-and-scale" }
};
class Webcam {
  constructor(videoConstraints) {
    Object.defineProperty(this, "_stream", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: null
    });
    Object.defineProperty(this, "_constraints", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this._constraints = {
      ...defaultVideoConstraints,
      ...videoConstraints
    };
  }
  async start() {
    var _a2;
    (_a2 = this._stream) !== null && _a2 !== void 0 ? _a2 : this._stream = await createStream(this._constraints);
    return this;
  }
  async *[Symbol.asyncIterator]({ horizontalFlip = true, ...options } = {}) {
    var _a2;
    const stream = (_a2 = this._stream) !== null && _a2 !== void 0 ? _a2 : this._stream = await createStream(this._constraints);
    const frames = stream[Symbol.asyncIterator]({ horizontalFlip, ...options });
    let opts;
    while (true) {
      const { done, value } = await frames.next(opts);
      if (done)
        break;
      else
        opts = yield value;
    }
    this.stop();
  }
  stop() {
    var _a2;
    (_a2 = this._stream) === null || _a2 === void 0 ? void 0 : _a2.stop();
    this._stream = null;
  }
}
const createStream = async (videoConstraints) => {
  if (typeof navigator.mediaDevices === "undefined") {
    throw new Error("SecureContext is required to access webcam\nIt's likely you need to set up HTTPS/TLS for your website\nSee https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#Encryption_based_security for details ");
  }
  return new MediaStream$1(await navigator.mediaDevices.getUserMedia({ video: videoConstraints }));
};
const utils = { createRenderingContext, createVideoElement };
let urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
let nanoid = (size = 21) => {
  let id2 = "";
  let i = size;
  while (i--) {
    id2 += urlAlphabet[Math.random() * 64 | 0];
  }
  return id2;
};
var Module = (() => {
  var _scriptDir = typeof document !== "undefined" && document.currentScript ? document.currentScript.src : void 0;
  return function(Module2) {
    Module2 = Module2 || {};
    var Module2 = typeof Module2 !== "undefined" ? Module2 : {};
    var objAssign = Object.assign;
    var readyPromiseResolve, readyPromiseReject;
    Module2["ready"] = new Promise(function(resolve, reject) {
      readyPromiseResolve = resolve;
      readyPromiseReject = reject;
    });
    if (!Module2.expectedDataFileDownloads) {
      Module2.expectedDataFileDownloads = 0;
    }
    Module2.expectedDataFileDownloads++;
    (function() {
      if (Module2["ENVIRONMENT_IS_PTHREAD"])
        return;
      var loadPackage = function(metadata) {
        if (typeof window === "object") {
          window["encodeURIComponent"](window.location.pathname.toString().substring(0, window.location.pathname.toString().lastIndexOf("/")) + "/");
        } else if (typeof process === "undefined" && typeof location !== "undefined") {
          encodeURIComponent(location.pathname.toString().substring(0, location.pathname.toString().lastIndexOf("/")) + "/");
        }
        var PACKAGE_NAME = "BanubaSDK.data";
        var REMOTE_PACKAGE_BASE = "BanubaSDK.data";
        if (typeof Module2["locateFilePackage"] === "function" && !Module2["locateFile"]) {
          Module2["locateFile"] = Module2["locateFilePackage"];
          err("warning: you defined Module.locateFilePackage, that has been renamed to Module.locateFile (using your locateFilePackage for now)");
        }
        var REMOTE_PACKAGE_NAME = Module2["locateFile"] ? Module2["locateFile"](REMOTE_PACKAGE_BASE, "") : REMOTE_PACKAGE_BASE;
        var REMOTE_PACKAGE_SIZE = metadata["remote_package_size"];
        metadata["package_uuid"];
        function fetchRemotePackage(packageName, packageSize, callback, errback) {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", packageName, true);
          xhr.responseType = "arraybuffer";
          xhr.onprogress = function(event) {
            var url = packageName;
            var size = packageSize;
            if (event.total)
              size = event.total;
            if (event.loaded) {
              if (!xhr.addedTotal) {
                xhr.addedTotal = true;
                if (!Module2.dataFileDownloads)
                  Module2.dataFileDownloads = {};
                Module2.dataFileDownloads[url] = { loaded: event.loaded, total: size };
              } else {
                Module2.dataFileDownloads[url].loaded = event.loaded;
              }
              var total = 0;
              var loaded = 0;
              var num = 0;
              for (var download in Module2.dataFileDownloads) {
                var data = Module2.dataFileDownloads[download];
                total += data.total;
                loaded += data.loaded;
                num++;
              }
              total = Math.ceil(total * Module2.expectedDataFileDownloads / num);
              if (Module2["setStatus"])
                Module2["setStatus"]("Downloading data... (" + loaded + "/" + total + ")");
            } else if (!Module2.dataFileDownloads) {
              if (Module2["setStatus"])
                Module2["setStatus"]("Downloading data...");
            }
          };
          xhr.onerror = function(event) {
            throw new Error("NetworkError for: " + packageName);
          };
          xhr.onload = function(event) {
            if (xhr.status == 200 || xhr.status == 304 || xhr.status == 206 || xhr.status == 0 && xhr.response) {
              var packageData = xhr.response;
              callback(packageData);
            } else {
              throw new Error(xhr.statusText + " : " + xhr.responseURL);
            }
          };
          xhr.send(null);
        }
        var fetchedCallback = null;
        var fetched = Module2["getPreloadedPackage"] ? Module2["getPreloadedPackage"](REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE) : null;
        if (!fetched)
          fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE, function(data) {
            if (fetchedCallback) {
              fetchedCallback(data);
              fetchedCallback = null;
            } else {
              fetched = data;
            }
          });
        function runWithFS() {
          function assert2(check, msg) {
            if (!check)
              throw msg + new Error().stack;
          }
          Module2["FS_createPath"]("/", "frx", true, true);
          Module2["FS_createPath"]("/", "bnb_js", true, true);
          Module2["FS_createPath"]("/", "flow", true, true);
          Module2["FS_createPath"]("/", "bnb_shaders", true, true);
          Module2["FS_createPath"]("/bnb_shaders", "bnb", true, true);
          Module2["FS_createPath"]("/bnb_shaders/bnb", "lib", true, true);
          function DataRequest(start, end, audio) {
            this.start = start;
            this.end = end;
            this.audio = audio;
          }
          DataRequest.prototype = { requests: {}, open: function(mode, name) {
            this.name = name;
            this.requests[name] = this;
            Module2["addRunDependency"]("fp " + this.name);
          }, send: function() {
          }, onload: function() {
            var byteArray = this.byteArray.subarray(this.start, this.end);
            this.finish(byteArray);
          }, finish: function(byteArray) {
            var that = this;
            Module2["FS_createDataFile"](this.name, null, byteArray, true, true, true);
            Module2["removeRunDependency"]("fp " + that.name);
            this.requests[this.name] = null;
          } };
          var files = metadata["files"];
          for (var i2 = 0; i2 < files.length; ++i2) {
            new DataRequest(files[i2]["start"], files[i2]["end"], files[i2]["audio"] || 0).open("GET", files[i2]["filename"]);
          }
          function processPackageData(arrayBuffer2) {
            assert2(arrayBuffer2, "Loading data file failed.");
            assert2(arrayBuffer2 instanceof ArrayBuffer, "bad input to processPackageData");
            var byteArray = new Uint8Array(arrayBuffer2);
            DataRequest.prototype.byteArray = byteArray;
            var files2 = metadata["files"];
            for (var i3 = 0; i3 < files2.length; ++i3) {
              DataRequest.prototype.requests[files2[i3].filename].onload();
            }
            Module2["removeRunDependency"]("datafile_BanubaSDK.data");
          }
          Module2["addRunDependency"]("datafile_BanubaSDK.data");
          if (!Module2.preloadResults)
            Module2.preloadResults = {};
          Module2.preloadResults[PACKAGE_NAME] = { fromCache: false };
          if (fetched) {
            processPackageData(fetched);
            fetched = null;
          } else {
            fetchedCallback = processPackageData;
          }
        }
        if (Module2["calledRun"]) {
          runWithFS();
        } else {
          if (!Module2["preRun"])
            Module2["preRun"] = [];
          Module2["preRun"].push(runWithFS);
        }
      };
      loadPackage({ "files": [{ "filename": "/resources-versions.txt", "start": 0, "end": 97 }, { "filename": "/watermark.png", "start": 97, "end": 6018 }, { "filename": "/watermark_blurred.png", "start": 6018, "end": 99640 }, { "filename": "/frx/frx.js", "start": 99640, "end": 102162 }, { "filename": "/bnb_js/.empty", "start": 102162, "end": 102182 }, { "filename": "/bnb_js/console.js", "start": 102182, "end": 102742 }, { "filename": "/bnb_js/global.js", "start": 102742, "end": 103123 }, { "filename": "/bnb_js/legacy.js", "start": 103123, "end": 107400 }, { "filename": "/bnb_js/light_streaks.js", "start": 107400, "end": 117107 }, { "filename": "/bnb_js/timers.js", "start": 117107, "end": 120426 }, { "filename": "/bnb_js/background.js", "start": 120426, "end": 122976 }, { "filename": "/flow/bg_lite_horiz.tflite.bbin", "start": 122976, "end": 397082 }, { "filename": "/flow/bg_lite_vert.tflite.bbin", "start": 397082, "end": 671190 }, { "filename": "/bnb_shaders/.empty", "start": 671190, "end": 671209 }, { "filename": "/bnb_shaders/bnb/anim_transform.glsl", "start": 671209, "end": 671372 }, { "filename": "/bnb_shaders/bnb/decode_int1010102.glsl", "start": 671372, "end": 672571 }, { "filename": "/bnb_shaders/bnb/get_transform.glsl", "start": 672571, "end": 674024 }, { "filename": "/bnb_shaders/bnb/glsl.frag", "start": 674024, "end": 674790 }, { "filename": "/bnb_shaders/bnb/math.glsl", "start": 674790, "end": 675163 }, { "filename": "/bnb_shaders/bnb/morph_transform.glsl", "start": 675163, "end": 676221 }, { "filename": "/bnb_shaders/bnb/quat_rotation.glsl", "start": 676221, "end": 676973 }, { "filename": "/bnb_shaders/bnb/samplers_declaration.glsl", "start": 676973, "end": 679717 }, { "filename": "/bnb_shaders/bnb/version.glsl", "start": 679717, "end": 680021 }, { "filename": "/bnb_shaders/bnb/color_spaces.glsl", "start": 680021, "end": 684318 }, { "filename": "/bnb_shaders/bnb/get_bone.glsl", "start": 684318, "end": 685117 }, { "filename": "/bnb_shaders/bnb/glsl.vert", "start": 685117, "end": 686169 }, { "filename": "/bnb_shaders/bnb/lut.glsl", "start": 686169, "end": 691037 }, { "filename": "/bnb_shaders/bnb/matrix_operations.glsl", "start": 691037, "end": 694688 }, { "filename": "/bnb_shaders/bnb/texture_bicubic.glsl", "start": 694688, "end": 696218 }, { "filename": "/bnb_shaders/bnb/textures_lookup.glsl", "start": 696218, "end": 698927 }, { "filename": "/bnb_shaders/bnb/transform_uv.glsl", "start": 698927, "end": 701359 }, { "filename": "/bnb_shaders/bnb/lib/apply_light_streaks.frag", "start": 701359, "end": 701671 }, { "filename": "/bnb_shaders/bnb/lib/apply_light_streaks.vert", "start": 701671, "end": 701926 }, { "filename": "/bnb_shaders/bnb/lib/auto_morph.frag", "start": 701926, "end": 702039 }, { "filename": "/bnb_shaders/bnb/lib/auto_morph.vert", "start": 702039, "end": 702675 }, { "filename": "/bnb_shaders/bnb/lib/auto_morph_fisheye.frag", "start": 702675, "end": 702788 }, { "filename": "/bnb_shaders/bnb/lib/auto_morph_fisheye.vert", "start": 702788, "end": 703319 }, { "filename": "/bnb_shaders/bnb/lib/beauty_morph.frag", "start": 703319, "end": 703437 }, { "filename": "/bnb_shaders/bnb/lib/beauty_morph.vert", "start": 703437, "end": 704602 }, { "filename": "/bnb_shaders/bnb/lib/camera.vert", "start": 704602, "end": 704923 }, { "filename": "/bnb_shaders/bnb/lib/copy_pixels.frag", "start": 704923, "end": 705097 }, { "filename": "/bnb_shaders/bnb/lib/copy_pixels.vert", "start": 705097, "end": 705352 }, { "filename": "/bnb_shaders/bnb/lib/dual_filter_blur_downscale.frag", "start": 705352, "end": 705995 }, { "filename": "/bnb_shaders/bnb/lib/dual_filter_blur_downscale.vert", "start": 705995, "end": 706200 }, { "filename": "/bnb_shaders/bnb/lib/dual_filter_blur_upscale.frag", "start": 706200, "end": 707112 }, { "filename": "/bnb_shaders/bnb/lib/dual_filter_blur_upscale.vert", "start": 707112, "end": 707453 }, { "filename": "/bnb_shaders/bnb/lib/filter_light_streaks_0.frag", "start": 707453, "end": 708439 }, { "filename": "/bnb_shaders/bnb/lib/filter_light_streaks_0.vert", "start": 708439, "end": 709030 }, { "filename": "/bnb_shaders/bnb/lib/filter_light_streaks_1.frag", "start": 709030, "end": 710016 }, { "filename": "/bnb_shaders/bnb/lib/filter_light_streaks_1.vert", "start": 710016, "end": 710607 }, { "filename": "/bnb_shaders/bnb/lib/filter_light_streaks_2.frag", "start": 710607, "end": 711593 }, { "filename": "/bnb_shaders/bnb/lib/filter_light_streaks_2.vert", "start": 711593, "end": 712184 }, { "filename": "/bnb_shaders/bnb/lib/filter_light_streaks_3.frag", "start": 712184, "end": 713170 }, { "filename": "/bnb_shaders/bnb/lib/filter_light_streaks_3.vert", "start": 713170, "end": 713761 }, { "filename": "/bnb_shaders/bnb/lib/gltf.frag", "start": 713761, "end": 716138 }, { "filename": "/bnb_shaders/bnb/lib/gltf.vert", "start": 716138, "end": 717521 }, { "filename": "/bnb_shaders/bnb/lib/init_light_streaks.frag", "start": 717521, "end": 717851 }, { "filename": "/bnb_shaders/bnb/lib/init_light_streaks.vert", "start": 717851, "end": 718106 }, { "filename": "/bnb_shaders/bnb/lib/mesh_morph.frag", "start": 718106, "end": 718224 }, { "filename": "/bnb_shaders/bnb/lib/mesh_morph.vert", "start": 718224, "end": 720321 }, { "filename": "/bnb_shaders/bnb/lib/morph_apply.frag", "start": 720321, "end": 720664 }, { "filename": "/bnb_shaders/bnb/lib/morph_apply.vert", "start": 720664, "end": 722852 }, { "filename": "/bnb_shaders/bnb/lib/morph_blur.frag", "start": 722852, "end": 724175 }, { "filename": "/bnb_shaders/bnb/lib/morph_blur.vert", "start": 724175, "end": 724507 }, { "filename": "/bnb_shaders/bnb/lib/retouch.frag", "start": 724507, "end": 728258 }, { "filename": "/bnb_shaders/bnb/lib/retouch.vert", "start": 728258, "end": 728840 }, { "filename": "/bnb_shaders/bnb/lib/static_pos.frag", "start": 728840, "end": 728951 }, { "filename": "/bnb_shaders/bnb/lib/static_pos.vert", "start": 728951, "end": 729229 }, { "filename": "/bnb_shaders/bnb/lib/uv_morph.frag", "start": 729229, "end": 729342 }, { "filename": "/bnb_shaders/bnb/lib/uv_morph.vert", "start": 729342, "end": 729873 }, { "filename": "/bnb_shaders/bnb/lib/vbg.vert", "start": 729873, "end": 731038 }, { "filename": "/bnb_shaders/bnb/lib/camera.frag", "start": 731038, "end": 732484 }, { "filename": "/bnb_shaders/bnb/lib/vbg.frag", "start": 732484, "end": 733540 }], "remote_package_size": 733540, "package_uuid": "e9d9aa59-4f8d-467d-a922-f8c8be36e361" });
    })();
    var FinalizationGroup2 = Module2["FinalizationGroup"];
    var moduleOverrides = objAssign({}, Module2);
    var thisProgram = "./this.program";
    var quit_ = (status, toThrow) => {
      throw toThrow;
    };
    var ENVIRONMENT_IS_WEB = true;
    var scriptDirectory = "";
    function locateFile(path) {
      if (Module2["locateFile"]) {
        return Module2["locateFile"](path, scriptDirectory);
      }
      return scriptDirectory + path;
    }
    var read_, readAsync, readBinary;
    {
      if (typeof document !== "undefined" && document.currentScript) {
        scriptDirectory = document.currentScript.src;
      }
      if (_scriptDir) {
        scriptDirectory = _scriptDir;
      }
      if (scriptDirectory.indexOf("blob:") !== 0) {
        scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);
      } else {
        scriptDirectory = "";
      }
      {
        read_ = function(url) {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", url, false);
          xhr.send(null);
          return xhr.responseText;
        };
        readAsync = function(url, onload, onerror) {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", url, true);
          xhr.responseType = "arraybuffer";
          xhr.onload = function() {
            if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
              onload(xhr.response);
              return;
            }
            onerror();
          };
          xhr.onerror = onerror;
          xhr.send(null);
        };
      }
    }
    var out = Module2["print"] || console.log.bind(console);
    var err = Module2["printErr"] || console.warn.bind(console);
    objAssign(Module2, moduleOverrides);
    moduleOverrides = null;
    if (Module2["arguments"])
      ;
    if (Module2["thisProgram"])
      thisProgram = Module2["thisProgram"];
    if (Module2["quit"])
      quit_ = Module2["quit"];
    function warnOnce(text) {
      if (!warnOnce.shown)
        warnOnce.shown = {};
      if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        err(text);
      }
    }
    var wasmBinary;
    if (Module2["wasmBinary"])
      wasmBinary = Module2["wasmBinary"];
    var noExitRuntime = Module2["noExitRuntime"] || true;
    if (typeof WebAssembly !== "object") {
      abort("no native wasm support detected");
    }
    var wasmMemory;
    var ABORT = false;
    var EXITSTATUS;
    function assert(condition, text) {
      if (!condition) {
        abort(text);
      }
    }
    var ALLOC_NORMAL = 0;
    var ALLOC_STACK = 1;
    function allocate(slab, allocator) {
      var ret;
      if (allocator == ALLOC_STACK) {
        ret = stackAlloc(slab.length);
      } else {
        ret = _malloc(slab.length);
      }
      if (slab.subarray || slab.slice) {
        HEAPU8.set(slab, ret);
      } else {
        HEAPU8.set(new Uint8Array(slab), ret);
      }
      return ret;
    }
    var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : void 0;
    function UTF8ArrayToString(heap, idx, maxBytesToRead) {
      var endIdx = idx + maxBytesToRead;
      var endPtr = idx;
      while (heap[endPtr] && !(endPtr >= endIdx))
        ++endPtr;
      if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
        return UTF8Decoder.decode(heap.subarray(idx, endPtr));
      } else {
        var str = "";
        while (idx < endPtr) {
          var u0 = heap[idx++];
          if (!(u0 & 128)) {
            str += String.fromCharCode(u0);
            continue;
          }
          var u1 = heap[idx++] & 63;
          if ((u0 & 224) == 192) {
            str += String.fromCharCode((u0 & 31) << 6 | u1);
            continue;
          }
          var u2 = heap[idx++] & 63;
          if ((u0 & 240) == 224) {
            u0 = (u0 & 15) << 12 | u1 << 6 | u2;
          } else {
            u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heap[idx++] & 63;
          }
          if (u0 < 65536) {
            str += String.fromCharCode(u0);
          } else {
            var ch = u0 - 65536;
            str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
          }
        }
      }
      return str;
    }
    function UTF8ToString(ptr, maxBytesToRead) {
      return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
    }
    function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
      if (!(maxBytesToWrite > 0))
        return 0;
      var startIdx = outIdx;
      var endIdx = outIdx + maxBytesToWrite - 1;
      for (var i2 = 0; i2 < str.length; ++i2) {
        var u = str.charCodeAt(i2);
        if (u >= 55296 && u <= 57343) {
          var u1 = str.charCodeAt(++i2);
          u = 65536 + ((u & 1023) << 10) | u1 & 1023;
        }
        if (u <= 127) {
          if (outIdx >= endIdx)
            break;
          heap[outIdx++] = u;
        } else if (u <= 2047) {
          if (outIdx + 1 >= endIdx)
            break;
          heap[outIdx++] = 192 | u >> 6;
          heap[outIdx++] = 128 | u & 63;
        } else if (u <= 65535) {
          if (outIdx + 2 >= endIdx)
            break;
          heap[outIdx++] = 224 | u >> 12;
          heap[outIdx++] = 128 | u >> 6 & 63;
          heap[outIdx++] = 128 | u & 63;
        } else {
          if (outIdx + 3 >= endIdx)
            break;
          heap[outIdx++] = 240 | u >> 18;
          heap[outIdx++] = 128 | u >> 12 & 63;
          heap[outIdx++] = 128 | u >> 6 & 63;
          heap[outIdx++] = 128 | u & 63;
        }
      }
      heap[outIdx] = 0;
      return outIdx - startIdx;
    }
    function stringToUTF8(str, outPtr, maxBytesToWrite) {
      return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
    }
    function lengthBytesUTF8(str) {
      var len = 0;
      for (var i2 = 0; i2 < str.length; ++i2) {
        var u = str.charCodeAt(i2);
        if (u >= 55296 && u <= 57343)
          u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i2) & 1023;
        if (u <= 127)
          ++len;
        else if (u <= 2047)
          len += 2;
        else if (u <= 65535)
          len += 3;
        else
          len += 4;
      }
      return len;
    }
    var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : void 0;
    function UTF16ToString(ptr, maxBytesToRead) {
      var endPtr = ptr;
      var idx = endPtr >> 1;
      var maxIdx = idx + maxBytesToRead / 2;
      while (!(idx >= maxIdx) && HEAPU16[idx])
        ++idx;
      endPtr = idx << 1;
      if (endPtr - ptr > 32 && UTF16Decoder) {
        return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
      } else {
        var str = "";
        for (var i2 = 0; !(i2 >= maxBytesToRead / 2); ++i2) {
          var codeUnit = HEAP16[ptr + i2 * 2 >> 1];
          if (codeUnit == 0)
            break;
          str += String.fromCharCode(codeUnit);
        }
        return str;
      }
    }
    function stringToUTF16(str, outPtr, maxBytesToWrite) {
      if (maxBytesToWrite === void 0) {
        maxBytesToWrite = 2147483647;
      }
      if (maxBytesToWrite < 2)
        return 0;
      maxBytesToWrite -= 2;
      var startPtr = outPtr;
      var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
      for (var i2 = 0; i2 < numCharsToWrite; ++i2) {
        var codeUnit = str.charCodeAt(i2);
        HEAP16[outPtr >> 1] = codeUnit;
        outPtr += 2;
      }
      HEAP16[outPtr >> 1] = 0;
      return outPtr - startPtr;
    }
    function lengthBytesUTF16(str) {
      return str.length * 2;
    }
    function UTF32ToString(ptr, maxBytesToRead) {
      var i2 = 0;
      var str = "";
      while (!(i2 >= maxBytesToRead / 4)) {
        var utf32 = HEAP32[ptr + i2 * 4 >> 2];
        if (utf32 == 0)
          break;
        ++i2;
        if (utf32 >= 65536) {
          var ch = utf32 - 65536;
          str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
        } else {
          str += String.fromCharCode(utf32);
        }
      }
      return str;
    }
    function stringToUTF32(str, outPtr, maxBytesToWrite) {
      if (maxBytesToWrite === void 0) {
        maxBytesToWrite = 2147483647;
      }
      if (maxBytesToWrite < 4)
        return 0;
      var startPtr = outPtr;
      var endPtr = startPtr + maxBytesToWrite - 4;
      for (var i2 = 0; i2 < str.length; ++i2) {
        var codeUnit = str.charCodeAt(i2);
        if (codeUnit >= 55296 && codeUnit <= 57343) {
          var trailSurrogate = str.charCodeAt(++i2);
          codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023;
        }
        HEAP32[outPtr >> 2] = codeUnit;
        outPtr += 4;
        if (outPtr + 4 > endPtr)
          break;
      }
      HEAP32[outPtr >> 2] = 0;
      return outPtr - startPtr;
    }
    function lengthBytesUTF32(str) {
      var len = 0;
      for (var i2 = 0; i2 < str.length; ++i2) {
        var codeUnit = str.charCodeAt(i2);
        if (codeUnit >= 55296 && codeUnit <= 57343)
          ++i2;
        len += 4;
      }
      return len;
    }
    function allocateUTF8(str) {
      var size = lengthBytesUTF8(str) + 1;
      var ret = _malloc(size);
      if (ret)
        stringToUTF8Array(str, HEAP8, ret, size);
      return ret;
    }
    function writeArrayToMemory(array, buffer2) {
      HEAP8.set(array, buffer2);
    }
    function writeAsciiToMemory(str, buffer2, dontAddNull) {
      for (var i2 = 0; i2 < str.length; ++i2) {
        HEAP8[buffer2++ >> 0] = str.charCodeAt(i2);
      }
      if (!dontAddNull)
        HEAP8[buffer2 >> 0] = 0;
    }
    function alignUp(x, multiple) {
      if (x % multiple > 0) {
        x += multiple - x % multiple;
      }
      return x;
    }
    var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
    function updateGlobalBufferAndViews(buf) {
      buffer = buf;
      Module2["HEAP8"] = HEAP8 = new Int8Array(buf);
      Module2["HEAP16"] = HEAP16 = new Int16Array(buf);
      Module2["HEAP32"] = HEAP32 = new Int32Array(buf);
      Module2["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
      Module2["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
      Module2["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
      Module2["HEAPF32"] = HEAPF32 = new Float32Array(buf);
      Module2["HEAPF64"] = HEAPF64 = new Float64Array(buf);
    }
    Module2["INITIAL_MEMORY"] || 134217728;
    var wasmTable;
    var __ATPRERUN__ = [];
    var __ATINIT__ = [];
    var __ATPOSTRUN__ = [];
    var runtimeExited = false;
    var runtimeKeepaliveCounter = 0;
    function keepRuntimeAlive() {
      return noExitRuntime || runtimeKeepaliveCounter > 0;
    }
    function preRun() {
      if (Module2["preRun"]) {
        if (typeof Module2["preRun"] == "function")
          Module2["preRun"] = [Module2["preRun"]];
        while (Module2["preRun"].length) {
          addOnPreRun(Module2["preRun"].shift());
        }
      }
      callRuntimeCallbacks(__ATPRERUN__);
    }
    function initRuntime() {
      if (!Module2["noFSInit"] && !FS.init.initialized)
        FS.init();
      FS.ignorePermissions = false;
      callRuntimeCallbacks(__ATINIT__);
    }
    function exitRuntime() {
      runtimeExited = true;
    }
    function postRun() {
      if (Module2["postRun"]) {
        if (typeof Module2["postRun"] == "function")
          Module2["postRun"] = [Module2["postRun"]];
        while (Module2["postRun"].length) {
          addOnPostRun(Module2["postRun"].shift());
        }
      }
      callRuntimeCallbacks(__ATPOSTRUN__);
    }
    function addOnPreRun(cb) {
      __ATPRERUN__.unshift(cb);
    }
    function addOnInit(cb) {
      __ATINIT__.unshift(cb);
    }
    function addOnPostRun(cb) {
      __ATPOSTRUN__.unshift(cb);
    }
    var runDependencies = 0;
    var dependenciesFulfilled = null;
    function getUniqueRunDependency(id2) {
      return id2;
    }
    function addRunDependency(id2) {
      runDependencies++;
      if (Module2["monitorRunDependencies"]) {
        Module2["monitorRunDependencies"](runDependencies);
      }
    }
    function removeRunDependency(id2) {
      runDependencies--;
      if (Module2["monitorRunDependencies"]) {
        Module2["monitorRunDependencies"](runDependencies);
      }
      if (runDependencies == 0) {
        if (dependenciesFulfilled) {
          var callback = dependenciesFulfilled;
          dependenciesFulfilled = null;
          callback();
        }
      }
    }
    Module2["preloadedImages"] = {};
    Module2["preloadedAudios"] = {};
    function abort(what) {
      {
        if (Module2["onAbort"]) {
          Module2["onAbort"](what);
        }
      }
      what = "Aborted(" + what + ")";
      err(what);
      ABORT = true;
      EXITSTATUS = 1;
      what += ". Build with -s ASSERTIONS=1 for more info.";
      var e = new WebAssembly.RuntimeError(what);
      readyPromiseReject(e);
      throw e;
    }
    var dataURIPrefix = "data:application/octet-stream;base64,";
    function isDataURI(filename) {
      return filename.startsWith(dataURIPrefix);
    }
    var wasmBinaryFile;
    wasmBinaryFile = "BanubaSDK.wasm";
    if (!isDataURI(wasmBinaryFile)) {
      wasmBinaryFile = locateFile(wasmBinaryFile);
    }
    function getBinary(file) {
      try {
        if (file == wasmBinaryFile && wasmBinary) {
          return new Uint8Array(wasmBinary);
        }
        if (readBinary)
          ;
        else {
          throw "both async and sync fetching of the wasm failed";
        }
      } catch (err2) {
        abort(err2);
      }
    }
    function getBinaryPromise() {
      if (!wasmBinary && ENVIRONMENT_IS_WEB) {
        if (typeof fetch === "function") {
          return fetch(wasmBinaryFile, { credentials: "same-origin" }).then(function(response) {
            if (!response["ok"]) {
              throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
            }
            return response["arrayBuffer"]();
          }).catch(function() {
            return getBinary(wasmBinaryFile);
          });
        }
      }
      return Promise.resolve().then(function() {
        return getBinary(wasmBinaryFile);
      });
    }
    function createWasm() {
      var info = { "env": asmLibraryArg, "wasi_snapshot_preview1": asmLibraryArg };
      function receiveInstance(instance, module) {
        var exports2 = instance.exports;
        Module2["asm"] = exports2;
        wasmMemory = Module2["asm"]["memory"];
        updateGlobalBufferAndViews(wasmMemory.buffer);
        wasmTable = Module2["asm"]["__indirect_function_table"];
        addOnInit(Module2["asm"]["__wasm_call_ctors"]);
        removeRunDependency();
      }
      addRunDependency();
      function receiveInstantiationResult(result) {
        receiveInstance(result["instance"]);
      }
      function instantiateArrayBuffer(receiver) {
        return getBinaryPromise().then(function(binary) {
          return WebAssembly.instantiate(binary, info);
        }).then(function(instance) {
          return instance;
        }).then(receiver, function(reason) {
          err("failed to asynchronously prepare wasm: " + reason);
          abort(reason);
        });
      }
      function instantiateAsync() {
        if (!wasmBinary && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && typeof fetch === "function") {
          return fetch(wasmBinaryFile, { credentials: "same-origin" }).then(function(response) {
            var result = WebAssembly.instantiateStreaming(response, info);
            return result.then(receiveInstantiationResult, function(reason) {
              err("wasm streaming compile failed: " + reason);
              err("falling back to ArrayBuffer instantiation");
              return instantiateArrayBuffer(receiveInstantiationResult);
            });
          });
        } else {
          return instantiateArrayBuffer(receiveInstantiationResult);
        }
      }
      if (Module2["instantiateWasm"]) {
        try {
          var exports = Module2["instantiateWasm"](info, receiveInstance);
          return exports;
        } catch (e) {
          err("Module.instantiateWasm callback failed with error: " + e);
          return false;
        }
      }
      instantiateAsync().catch(readyPromiseReject);
      return {};
    }
    var tempDouble;
    var tempI64;
    function create_video(file_path) {
      const path = UTF8ToString(file_path);
      const data = FS.readFile(path);
      const video = document.createElement("video");
      const src = URL.createObjectURL(new Blob([data], { type: "video/mp4" }));
      const proxy = Module2["proxyVideoRequestsTo"];
      video.muted = true;
      video.autoplay = false;
      video.controls = false;
      video.playsInline = true;
      video.src = proxy ? proxy + encodeURIComponent(src) : src;
      return Emval.toHandle(video);
    }
    function delete_video(video_handle) {
      const video = Emval.toValue(video_handle);
      URL.revokeObjectURL(video.src);
      video.src = "";
    }
    function get_camera_texture() {
      if (Module2.useCamTexture && Module2.texture) {
        if (!Module2.camTextureId) {
          Module2.camTextureId = GL.getNewId(GL.textures);
          Module2.texture.name = Module2.camTextureId;
          GL.textures[Module2.camTextureId] = Module2.texture;
        }
        return Module2.camTextureId;
      } else {
        return 0;
      }
    }
    function get_current_hostname() {
      var currentHostname = window.location.hostname;
      var lengthBytes = lengthBytesUTF8(currentHostname) + 1;
      var stringOnWasmHeap = _malloc(lengthBytes);
      stringToUTF8(currentHostname, stringOnWasmHeap, lengthBytes);
      return stringOnWasmHeap;
    }
    function is_electron() {
      return /electron/i.test(navigator.userAgent);
    }
    function callRuntimeCallbacks(callbacks2) {
      while (callbacks2.length > 0) {
        var callback = callbacks2.shift();
        if (typeof callback == "function") {
          callback(Module2);
          continue;
        }
        var func = callback.func;
        if (typeof func === "number") {
          if (callback.arg === void 0) {
            getWasmTableEntry(func)();
          } else {
            getWasmTableEntry(func)(callback.arg);
          }
        } else {
          func(callback.arg === void 0 ? null : callback.arg);
        }
      }
    }
    var wasmTableMirror = [];
    function getWasmTableEntry(funcPtr) {
      var func = wasmTableMirror[funcPtr];
      if (!func) {
        if (funcPtr >= wasmTableMirror.length)
          wasmTableMirror.length = funcPtr + 1;
        wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
      }
      return func;
    }
    function handleException(e) {
      if (e instanceof ExitStatus || e == "unwind") {
        return EXITSTATUS;
      }
      quit_(1, e);
    }
    var _emscripten_get_now;
    _emscripten_get_now = () => performance.now();
    var _emscripten_get_now_is_monotonic = true;
    function setErrNo(value) {
      HEAP32[___errno_location() >> 2] = value;
      return value;
    }
    function _clock_gettime(clk_id, tp) {
      var now;
      if (clk_id === 0) {
        now = Date.now();
      } else if ((clk_id === 1 || clk_id === 4) && _emscripten_get_now_is_monotonic) {
        now = _emscripten_get_now();
      } else {
        setErrNo(28);
        return -1;
      }
      HEAP32[tp >> 2] = now / 1e3 | 0;
      HEAP32[tp + 4 >> 2] = now % 1e3 * 1e3 * 1e3 | 0;
      return 0;
    }
    function ___clock_gettime(a0, a1) {
      return _clock_gettime(a0, a1);
    }
    function ___cxa_allocate_exception(size) {
      return _malloc(size + 16) + 16;
    }
    var exceptionCaught = [];
    function ___cxa_rethrow() {
      var catchInfo = exceptionCaught.pop();
      if (!catchInfo) {
        abort("no exception to throw");
      }
      var info = catchInfo.get_exception_info();
      var ptr = catchInfo.get_base_ptr();
      if (!info.get_rethrown()) {
        exceptionCaught.push(catchInfo);
        info.set_rethrown(true);
        info.set_caught(false);
      } else {
        catchInfo.free();
      }
      throw ptr;
    }
    function ExceptionInfo(excPtr) {
      this.excPtr = excPtr;
      this.ptr = excPtr - 16;
      this.set_type = function(type) {
        HEAP32[this.ptr + 4 >> 2] = type;
      };
      this.get_type = function() {
        return HEAP32[this.ptr + 4 >> 2];
      };
      this.set_destructor = function(destructor) {
        HEAP32[this.ptr + 8 >> 2] = destructor;
      };
      this.get_destructor = function() {
        return HEAP32[this.ptr + 8 >> 2];
      };
      this.set_refcount = function(refcount) {
        HEAP32[this.ptr >> 2] = refcount;
      };
      this.set_caught = function(caught) {
        caught = caught ? 1 : 0;
        HEAP8[this.ptr + 12 >> 0] = caught;
      };
      this.get_caught = function() {
        return HEAP8[this.ptr + 12 >> 0] != 0;
      };
      this.set_rethrown = function(rethrown) {
        rethrown = rethrown ? 1 : 0;
        HEAP8[this.ptr + 13 >> 0] = rethrown;
      };
      this.get_rethrown = function() {
        return HEAP8[this.ptr + 13 >> 0] != 0;
      };
      this.init = function(type, destructor) {
        this.set_type(type);
        this.set_destructor(destructor);
        this.set_refcount(0);
        this.set_caught(false);
        this.set_rethrown(false);
      };
      this.add_ref = function() {
        var value = HEAP32[this.ptr >> 2];
        HEAP32[this.ptr >> 2] = value + 1;
      };
      this.release_ref = function() {
        var prev = HEAP32[this.ptr >> 2];
        HEAP32[this.ptr >> 2] = prev - 1;
        return prev === 1;
      };
    }
    function ___cxa_throw(ptr, type, destructor) {
      var info = new ExceptionInfo(ptr);
      info.init(type, destructor);
      throw ptr;
    }
    function _gmtime_r(time, tmPtr) {
      var date = new Date(HEAP32[time >> 2] * 1e3);
      HEAP32[tmPtr >> 2] = date.getUTCSeconds();
      HEAP32[tmPtr + 4 >> 2] = date.getUTCMinutes();
      HEAP32[tmPtr + 8 >> 2] = date.getUTCHours();
      HEAP32[tmPtr + 12 >> 2] = date.getUTCDate();
      HEAP32[tmPtr + 16 >> 2] = date.getUTCMonth();
      HEAP32[tmPtr + 20 >> 2] = date.getUTCFullYear() - 1900;
      HEAP32[tmPtr + 24 >> 2] = date.getUTCDay();
      HEAP32[tmPtr + 36 >> 2] = 0;
      HEAP32[tmPtr + 32 >> 2] = 0;
      var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
      var yday = (date.getTime() - start) / (1e3 * 60 * 60 * 24) | 0;
      HEAP32[tmPtr + 28 >> 2] = yday;
      if (!_gmtime_r.GMTString)
        _gmtime_r.GMTString = allocateUTF8("GMT");
      HEAP32[tmPtr + 40 >> 2] = _gmtime_r.GMTString;
      return tmPtr;
    }
    function ___gmtime_r(a0, a1) {
      return _gmtime_r(a0, a1);
    }
    var PATH = { splitPath: function(filename) {
      var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
      return splitPathRe.exec(filename).slice(1);
    }, normalizeArray: function(parts, allowAboveRoot) {
      var up = 0;
      for (var i2 = parts.length - 1; i2 >= 0; i2--) {
        var last = parts[i2];
        if (last === ".") {
          parts.splice(i2, 1);
        } else if (last === "..") {
          parts.splice(i2, 1);
          up++;
        } else if (up) {
          parts.splice(i2, 1);
          up--;
        }
      }
      if (allowAboveRoot) {
        for (; up; up--) {
          parts.unshift("..");
        }
      }
      return parts;
    }, normalize: function(path) {
      var isAbsolute = path.charAt(0) === "/", trailingSlash = path.substr(-1) === "/";
      path = PATH.normalizeArray(path.split("/").filter(function(p) {
        return !!p;
      }), !isAbsolute).join("/");
      if (!path && !isAbsolute) {
        path = ".";
      }
      if (path && trailingSlash) {
        path += "/";
      }
      return (isAbsolute ? "/" : "") + path;
    }, dirname: function(path) {
      var result = PATH.splitPath(path), root = result[0], dir = result[1];
      if (!root && !dir) {
        return ".";
      }
      if (dir) {
        dir = dir.substr(0, dir.length - 1);
      }
      return root + dir;
    }, basename: function(path) {
      if (path === "/")
        return "/";
      path = PATH.normalize(path);
      path = path.replace(/\/$/, "");
      var lastSlash = path.lastIndexOf("/");
      if (lastSlash === -1)
        return path;
      return path.substr(lastSlash + 1);
    }, extname: function(path) {
      return PATH.splitPath(path)[3];
    }, join: function() {
      var paths = Array.prototype.slice.call(arguments, 0);
      return PATH.normalize(paths.join("/"));
    }, join2: function(l, r) {
      return PATH.normalize(l + "/" + r);
    } };
    function getRandomDevice() {
      if (typeof crypto === "object" && typeof crypto["getRandomValues"] === "function") {
        var randomBuffer = new Uint8Array(1);
        return function() {
          crypto.getRandomValues(randomBuffer);
          return randomBuffer[0];
        };
      } else
        return function() {
          abort("randomDevice");
        };
    }
    var PATH_FS = { resolve: function() {
      var resolvedPath = "", resolvedAbsolute = false;
      for (var i2 = arguments.length - 1; i2 >= -1 && !resolvedAbsolute; i2--) {
        var path = i2 >= 0 ? arguments[i2] : FS.cwd();
        if (typeof path !== "string") {
          throw new TypeError("Arguments to path.resolve must be strings");
        } else if (!path) {
          return "";
        }
        resolvedPath = path + "/" + resolvedPath;
        resolvedAbsolute = path.charAt(0) === "/";
      }
      resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(function(p) {
        return !!p;
      }), !resolvedAbsolute).join("/");
      return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
    }, relative: function(from, to) {
      from = PATH_FS.resolve(from).substr(1);
      to = PATH_FS.resolve(to).substr(1);
      function trim(arr) {
        var start = 0;
        for (; start < arr.length; start++) {
          if (arr[start] !== "")
            break;
        }
        var end = arr.length - 1;
        for (; end >= 0; end--) {
          if (arr[end] !== "")
            break;
        }
        if (start > end)
          return [];
        return arr.slice(start, end - start + 1);
      }
      var fromParts = trim(from.split("/"));
      var toParts = trim(to.split("/"));
      var length = Math.min(fromParts.length, toParts.length);
      var samePartsLength = length;
      for (var i2 = 0; i2 < length; i2++) {
        if (fromParts[i2] !== toParts[i2]) {
          samePartsLength = i2;
          break;
        }
      }
      var outputParts = [];
      for (var i2 = samePartsLength; i2 < fromParts.length; i2++) {
        outputParts.push("..");
      }
      outputParts = outputParts.concat(toParts.slice(samePartsLength));
      return outputParts.join("/");
    } };
    var TTY = { ttys: [], init: function() {
    }, shutdown: function() {
    }, register: function(dev, ops) {
      TTY.ttys[dev] = { input: [], output: [], ops };
      FS.registerDevice(dev, TTY.stream_ops);
    }, stream_ops: { open: function(stream) {
      var tty = TTY.ttys[stream.node.rdev];
      if (!tty) {
        throw new FS.ErrnoError(43);
      }
      stream.tty = tty;
      stream.seekable = false;
    }, close: function(stream) {
      stream.tty.ops.flush(stream.tty);
    }, flush: function(stream) {
      stream.tty.ops.flush(stream.tty);
    }, read: function(stream, buffer2, offset, length, pos) {
      if (!stream.tty || !stream.tty.ops.get_char) {
        throw new FS.ErrnoError(60);
      }
      var bytesRead = 0;
      for (var i2 = 0; i2 < length; i2++) {
        var result;
        try {
          result = stream.tty.ops.get_char(stream.tty);
        } catch (e) {
          throw new FS.ErrnoError(29);
        }
        if (result === void 0 && bytesRead === 0) {
          throw new FS.ErrnoError(6);
        }
        if (result === null || result === void 0)
          break;
        bytesRead++;
        buffer2[offset + i2] = result;
      }
      if (bytesRead) {
        stream.node.timestamp = Date.now();
      }
      return bytesRead;
    }, write: function(stream, buffer2, offset, length, pos) {
      if (!stream.tty || !stream.tty.ops.put_char) {
        throw new FS.ErrnoError(60);
      }
      try {
        for (var i2 = 0; i2 < length; i2++) {
          stream.tty.ops.put_char(stream.tty, buffer2[offset + i2]);
        }
      } catch (e) {
        throw new FS.ErrnoError(29);
      }
      if (length) {
        stream.node.timestamp = Date.now();
      }
      return i2;
    } }, default_tty_ops: { get_char: function(tty) {
      if (!tty.input.length) {
        var result = null;
        if (typeof window != "undefined" && typeof window.prompt == "function") {
          result = window.prompt("Input: ");
          if (result !== null) {
            result += "\n";
          }
        } else if (typeof readline == "function") {
          result = readline();
          if (result !== null) {
            result += "\n";
          }
        }
        if (!result) {
          return null;
        }
        tty.input = intArrayFromString(result, true);
      }
      return tty.input.shift();
    }, put_char: function(tty, val) {
      if (val === null || val === 10) {
        out(UTF8ArrayToString(tty.output, 0));
        tty.output = [];
      } else {
        if (val != 0)
          tty.output.push(val);
      }
    }, flush: function(tty) {
      if (tty.output && tty.output.length > 0) {
        out(UTF8ArrayToString(tty.output, 0));
        tty.output = [];
      }
    } }, default_tty1_ops: { put_char: function(tty, val) {
      if (val === null || val === 10) {
        err(UTF8ArrayToString(tty.output, 0));
        tty.output = [];
      } else {
        if (val != 0)
          tty.output.push(val);
      }
    }, flush: function(tty) {
      if (tty.output && tty.output.length > 0) {
        err(UTF8ArrayToString(tty.output, 0));
        tty.output = [];
      }
    } } };
    function zeroMemory(address, size) {
      HEAPU8.fill(0, address, address + size);
    }
    function alignMemory(size, alignment) {
      return Math.ceil(size / alignment) * alignment;
    }
    function mmapAlloc(size) {
      size = alignMemory(size, 65536);
      var ptr = _memalign(65536, size);
      if (!ptr)
        return 0;
      zeroMemory(ptr, size);
      return ptr;
    }
    var MEMFS = { ops_table: null, mount: function(mount) {
      return MEMFS.createNode(null, "/", 16384 | 511, 0);
    }, createNode: function(parent, name, mode, dev) {
      if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
        throw new FS.ErrnoError(63);
      }
      if (!MEMFS.ops_table) {
        MEMFS.ops_table = { dir: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr, lookup: MEMFS.node_ops.lookup, mknod: MEMFS.node_ops.mknod, rename: MEMFS.node_ops.rename, unlink: MEMFS.node_ops.unlink, rmdir: MEMFS.node_ops.rmdir, readdir: MEMFS.node_ops.readdir, symlink: MEMFS.node_ops.symlink }, stream: { llseek: MEMFS.stream_ops.llseek } }, file: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr }, stream: { llseek: MEMFS.stream_ops.llseek, read: MEMFS.stream_ops.read, write: MEMFS.stream_ops.write, allocate: MEMFS.stream_ops.allocate, mmap: MEMFS.stream_ops.mmap, msync: MEMFS.stream_ops.msync } }, link: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr, readlink: MEMFS.node_ops.readlink }, stream: {} }, chrdev: { node: { getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr }, stream: FS.chrdev_stream_ops } };
      }
      var node = FS.createNode(parent, name, mode, dev);
      if (FS.isDir(node.mode)) {
        node.node_ops = MEMFS.ops_table.dir.node;
        node.stream_ops = MEMFS.ops_table.dir.stream;
        node.contents = {};
      } else if (FS.isFile(node.mode)) {
        node.node_ops = MEMFS.ops_table.file.node;
        node.stream_ops = MEMFS.ops_table.file.stream;
        node.usedBytes = 0;
        node.contents = null;
      } else if (FS.isLink(node.mode)) {
        node.node_ops = MEMFS.ops_table.link.node;
        node.stream_ops = MEMFS.ops_table.link.stream;
      } else if (FS.isChrdev(node.mode)) {
        node.node_ops = MEMFS.ops_table.chrdev.node;
        node.stream_ops = MEMFS.ops_table.chrdev.stream;
      }
      node.timestamp = Date.now();
      if (parent) {
        parent.contents[name] = node;
        parent.timestamp = node.timestamp;
      }
      return node;
    }, getFileDataAsTypedArray: function(node) {
      if (!node.contents)
        return new Uint8Array(0);
      if (node.contents.subarray)
        return node.contents.subarray(0, node.usedBytes);
      return new Uint8Array(node.contents);
    }, expandFileStorage: function(node, newCapacity) {
      var prevCapacity = node.contents ? node.contents.length : 0;
      if (prevCapacity >= newCapacity)
        return;
      var CAPACITY_DOUBLING_MAX = 1024 * 1024;
      newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) >>> 0);
      if (prevCapacity != 0)
        newCapacity = Math.max(newCapacity, 256);
      var oldContents = node.contents;
      node.contents = new Uint8Array(newCapacity);
      if (node.usedBytes > 0)
        node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
    }, resizeFileStorage: function(node, newSize) {
      if (node.usedBytes == newSize)
        return;
      if (newSize == 0) {
        node.contents = null;
        node.usedBytes = 0;
      } else {
        var oldContents = node.contents;
        node.contents = new Uint8Array(newSize);
        if (oldContents) {
          node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
        }
        node.usedBytes = newSize;
      }
    }, node_ops: { getattr: function(node) {
      var attr = {};
      attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
      attr.ino = node.id;
      attr.mode = node.mode;
      attr.nlink = 1;
      attr.uid = 0;
      attr.gid = 0;
      attr.rdev = node.rdev;
      if (FS.isDir(node.mode)) {
        attr.size = 4096;
      } else if (FS.isFile(node.mode)) {
        attr.size = node.usedBytes;
      } else if (FS.isLink(node.mode)) {
        attr.size = node.link.length;
      } else {
        attr.size = 0;
      }
      attr.atime = new Date(node.timestamp);
      attr.mtime = new Date(node.timestamp);
      attr.ctime = new Date(node.timestamp);
      attr.blksize = 4096;
      attr.blocks = Math.ceil(attr.size / attr.blksize);
      return attr;
    }, setattr: function(node, attr) {
      if (attr.mode !== void 0) {
        node.mode = attr.mode;
      }
      if (attr.timestamp !== void 0) {
        node.timestamp = attr.timestamp;
      }
      if (attr.size !== void 0) {
        MEMFS.resizeFileStorage(node, attr.size);
      }
    }, lookup: function(parent, name) {
      throw FS.genericErrors[44];
    }, mknod: function(parent, name, mode, dev) {
      return MEMFS.createNode(parent, name, mode, dev);
    }, rename: function(old_node, new_dir, new_name) {
      if (FS.isDir(old_node.mode)) {
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
        }
        if (new_node) {
          for (var i2 in new_node.contents) {
            throw new FS.ErrnoError(55);
          }
        }
      }
      delete old_node.parent.contents[old_node.name];
      old_node.parent.timestamp = Date.now();
      old_node.name = new_name;
      new_dir.contents[new_name] = old_node;
      new_dir.timestamp = old_node.parent.timestamp;
      old_node.parent = new_dir;
    }, unlink: function(parent, name) {
      delete parent.contents[name];
      parent.timestamp = Date.now();
    }, rmdir: function(parent, name) {
      var node = FS.lookupNode(parent, name);
      for (var i2 in node.contents) {
        throw new FS.ErrnoError(55);
      }
      delete parent.contents[name];
      parent.timestamp = Date.now();
    }, readdir: function(node) {
      var entries = [".", ".."];
      for (var key in node.contents) {
        if (!node.contents.hasOwnProperty(key)) {
          continue;
        }
        entries.push(key);
      }
      return entries;
    }, symlink: function(parent, newname, oldpath) {
      var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
      node.link = oldpath;
      return node;
    }, readlink: function(node) {
      if (!FS.isLink(node.mode)) {
        throw new FS.ErrnoError(28);
      }
      return node.link;
    } }, stream_ops: { read: function(stream, buffer2, offset, length, position) {
      var contents = stream.node.contents;
      if (position >= stream.node.usedBytes)
        return 0;
      var size = Math.min(stream.node.usedBytes - position, length);
      if (size > 8 && contents.subarray) {
        buffer2.set(contents.subarray(position, position + size), offset);
      } else {
        for (var i2 = 0; i2 < size; i2++)
          buffer2[offset + i2] = contents[position + i2];
      }
      return size;
    }, write: function(stream, buffer2, offset, length, position, canOwn) {
      if (buffer2.buffer === HEAP8.buffer) {
        canOwn = false;
      }
      if (!length)
        return 0;
      var node = stream.node;
      node.timestamp = Date.now();
      if (buffer2.subarray && (!node.contents || node.contents.subarray)) {
        if (canOwn) {
          node.contents = buffer2.subarray(offset, offset + length);
          node.usedBytes = length;
          return length;
        } else if (node.usedBytes === 0 && position === 0) {
          node.contents = buffer2.slice(offset, offset + length);
          node.usedBytes = length;
          return length;
        } else if (position + length <= node.usedBytes) {
          node.contents.set(buffer2.subarray(offset, offset + length), position);
          return length;
        }
      }
      MEMFS.expandFileStorage(node, position + length);
      if (node.contents.subarray && buffer2.subarray) {
        node.contents.set(buffer2.subarray(offset, offset + length), position);
      } else {
        for (var i2 = 0; i2 < length; i2++) {
          node.contents[position + i2] = buffer2[offset + i2];
        }
      }
      node.usedBytes = Math.max(node.usedBytes, position + length);
      return length;
    }, llseek: function(stream, offset, whence) {
      var position = offset;
      if (whence === 1) {
        position += stream.position;
      } else if (whence === 2) {
        if (FS.isFile(stream.node.mode)) {
          position += stream.node.usedBytes;
        }
      }
      if (position < 0) {
        throw new FS.ErrnoError(28);
      }
      return position;
    }, allocate: function(stream, offset, length) {
      MEMFS.expandFileStorage(stream.node, offset + length);
      stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
    }, mmap: function(stream, address, length, position, prot, flags) {
      if (address !== 0) {
        throw new FS.ErrnoError(28);
      }
      if (!FS.isFile(stream.node.mode)) {
        throw new FS.ErrnoError(43);
      }
      var ptr;
      var allocated;
      var contents = stream.node.contents;
      if (!(flags & 2) && contents.buffer === buffer) {
        allocated = false;
        ptr = contents.byteOffset;
      } else {
        if (position > 0 || position + length < contents.length) {
          if (contents.subarray) {
            contents = contents.subarray(position, position + length);
          } else {
            contents = Array.prototype.slice.call(contents, position, position + length);
          }
        }
        allocated = true;
        ptr = mmapAlloc(length);
        if (!ptr) {
          throw new FS.ErrnoError(48);
        }
        HEAP8.set(contents, ptr);
      }
      return { ptr, allocated };
    }, msync: function(stream, buffer2, offset, length, mmapFlags) {
      if (!FS.isFile(stream.node.mode)) {
        throw new FS.ErrnoError(43);
      }
      if (mmapFlags & 2) {
        return 0;
      }
      MEMFS.stream_ops.write(stream, buffer2, 0, length, offset, false);
      return 0;
    } } };
    function asyncLoad(url, onload, onerror, noRunDep) {
      var dep = !noRunDep ? getUniqueRunDependency("al " + url) : "";
      readAsync(url, function(arrayBuffer2) {
        assert(arrayBuffer2, 'Loading data file "' + url + '" failed (no arrayBuffer).');
        onload(new Uint8Array(arrayBuffer2));
        if (dep)
          removeRunDependency();
      }, function(event) {
        if (onerror) {
          onerror();
        } else {
          throw 'Loading data file "' + url + '" failed.';
        }
      });
      if (dep)
        addRunDependency();
    }
    var FS = { root: null, mounts: [], devices: {}, streams: [], nextInode: 1, nameTable: null, currentPath: "/", initialized: false, ignorePermissions: true, ErrnoError: null, genericErrors: {}, filesystems: null, syncFSRequests: 0, lookupPath: function(path, opts) {
      path = PATH_FS.resolve(FS.cwd(), path);
      opts = opts || {};
      if (!path)
        return { path: "", node: null };
      var defaults = { follow_mount: true, recurse_count: 0 };
      for (var key in defaults) {
        if (opts[key] === void 0) {
          opts[key] = defaults[key];
        }
      }
      if (opts.recurse_count > 8) {
        throw new FS.ErrnoError(32);
      }
      var parts = PATH.normalizeArray(path.split("/").filter(function(p) {
        return !!p;
      }), false);
      var current = FS.root;
      var current_path = "/";
      for (var i2 = 0; i2 < parts.length; i2++) {
        var islast = i2 === parts.length - 1;
        if (islast && opts.parent) {
          break;
        }
        current = FS.lookupNode(current, parts[i2]);
        current_path = PATH.join2(current_path, parts[i2]);
        if (FS.isMountpoint(current)) {
          if (!islast || islast && opts.follow_mount) {
            current = current.mounted.root;
          }
        }
        if (!islast || opts.follow) {
          var count = 0;
          while (FS.isLink(current.mode)) {
            var link = FS.readlink(current_path);
            current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
            var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
            current = lookup.node;
            if (count++ > 40) {
              throw new FS.ErrnoError(32);
            }
          }
        }
      }
      return { path: current_path, node: current };
    }, getPath: function(node) {
      var path;
      while (true) {
        if (FS.isRoot(node)) {
          var mount = node.mount.mountpoint;
          if (!path)
            return mount;
          return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path;
        }
        path = path ? node.name + "/" + path : node.name;
        node = node.parent;
      }
    }, hashName: function(parentid, name) {
      var hash = 0;
      for (var i2 = 0; i2 < name.length; i2++) {
        hash = (hash << 5) - hash + name.charCodeAt(i2) | 0;
      }
      return (parentid + hash >>> 0) % FS.nameTable.length;
    }, hashAddNode: function(node) {
      var hash = FS.hashName(node.parent.id, node.name);
      node.name_next = FS.nameTable[hash];
      FS.nameTable[hash] = node;
    }, hashRemoveNode: function(node) {
      var hash = FS.hashName(node.parent.id, node.name);
      if (FS.nameTable[hash] === node) {
        FS.nameTable[hash] = node.name_next;
      } else {
        var current = FS.nameTable[hash];
        while (current) {
          if (current.name_next === node) {
            current.name_next = node.name_next;
            break;
          }
          current = current.name_next;
        }
      }
    }, lookupNode: function(parent, name) {
      var errCode = FS.mayLookup(parent);
      if (errCode) {
        throw new FS.ErrnoError(errCode, parent);
      }
      var hash = FS.hashName(parent.id, name);
      for (var node = FS.nameTable[hash]; node; node = node.name_next) {
        var nodeName = node.name;
        if (node.parent.id === parent.id && nodeName === name) {
          return node;
        }
      }
      return FS.lookup(parent, name);
    }, createNode: function(parent, name, mode, rdev) {
      var node = new FS.FSNode(parent, name, mode, rdev);
      FS.hashAddNode(node);
      return node;
    }, destroyNode: function(node) {
      FS.hashRemoveNode(node);
    }, isRoot: function(node) {
      return node === node.parent;
    }, isMountpoint: function(node) {
      return !!node.mounted;
    }, isFile: function(mode) {
      return (mode & 61440) === 32768;
    }, isDir: function(mode) {
      return (mode & 61440) === 16384;
    }, isLink: function(mode) {
      return (mode & 61440) === 40960;
    }, isChrdev: function(mode) {
      return (mode & 61440) === 8192;
    }, isBlkdev: function(mode) {
      return (mode & 61440) === 24576;
    }, isFIFO: function(mode) {
      return (mode & 61440) === 4096;
    }, isSocket: function(mode) {
      return (mode & 49152) === 49152;
    }, flagModes: { "r": 0, "r+": 2, "w": 577, "w+": 578, "a": 1089, "a+": 1090 }, modeStringToFlags: function(str) {
      var flags = FS.flagModes[str];
      if (typeof flags === "undefined") {
        throw new Error("Unknown file open mode: " + str);
      }
      return flags;
    }, flagsToPermissionString: function(flag) {
      var perms = ["r", "w", "rw"][flag & 3];
      if (flag & 512) {
        perms += "w";
      }
      return perms;
    }, nodePermissions: function(node, perms) {
      if (FS.ignorePermissions) {
        return 0;
      }
      if (perms.includes("r") && !(node.mode & 292)) {
        return 2;
      } else if (perms.includes("w") && !(node.mode & 146)) {
        return 2;
      } else if (perms.includes("x") && !(node.mode & 73)) {
        return 2;
      }
      return 0;
    }, mayLookup: function(dir) {
      var errCode = FS.nodePermissions(dir, "x");
      if (errCode)
        return errCode;
      if (!dir.node_ops.lookup)
        return 2;
      return 0;
    }, mayCreate: function(dir, name) {
      try {
        var node = FS.lookupNode(dir, name);
        return 20;
      } catch (e) {
      }
      return FS.nodePermissions(dir, "wx");
    }, mayDelete: function(dir, name, isdir) {
      var node;
      try {
        node = FS.lookupNode(dir, name);
      } catch (e) {
        return e.errno;
      }
      var errCode = FS.nodePermissions(dir, "wx");
      if (errCode) {
        return errCode;
      }
      if (isdir) {
        if (!FS.isDir(node.mode)) {
          return 54;
        }
        if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
          return 10;
        }
      } else {
        if (FS.isDir(node.mode)) {
          return 31;
        }
      }
      return 0;
    }, mayOpen: function(node, flags) {
      if (!node) {
        return 44;
      }
      if (FS.isLink(node.mode)) {
        return 32;
      } else if (FS.isDir(node.mode)) {
        if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
          return 31;
        }
      }
      return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
    }, MAX_OPEN_FDS: 4096, nextfd: function(fd_start, fd_end) {
      fd_start = fd_start || 0;
      fd_end = fd_end || FS.MAX_OPEN_FDS;
      for (var fd = fd_start; fd <= fd_end; fd++) {
        if (!FS.streams[fd]) {
          return fd;
        }
      }
      throw new FS.ErrnoError(33);
    }, getStream: function(fd) {
      return FS.streams[fd];
    }, createStream: function(stream, fd_start, fd_end) {
      if (!FS.FSStream) {
        FS.FSStream = function() {
        };
        FS.FSStream.prototype = { object: { get: function() {
          return this.node;
        }, set: function(val) {
          this.node = val;
        } }, isRead: { get: function() {
          return (this.flags & 2097155) !== 1;
        } }, isWrite: { get: function() {
          return (this.flags & 2097155) !== 0;
        } }, isAppend: { get: function() {
          return this.flags & 1024;
        } } };
      }
      var newStream = new FS.FSStream();
      for (var p in stream) {
        newStream[p] = stream[p];
      }
      stream = newStream;
      var fd = FS.nextfd(fd_start, fd_end);
      stream.fd = fd;
      FS.streams[fd] = stream;
      return stream;
    }, closeStream: function(fd) {
      FS.streams[fd] = null;
    }, chrdev_stream_ops: { open: function(stream) {
      var device = FS.getDevice(stream.node.rdev);
      stream.stream_ops = device.stream_ops;
      if (stream.stream_ops.open) {
        stream.stream_ops.open(stream);
      }
    }, llseek: function() {
      throw new FS.ErrnoError(70);
    } }, major: function(dev) {
      return dev >> 8;
    }, minor: function(dev) {
      return dev & 255;
    }, makedev: function(ma, mi) {
      return ma << 8 | mi;
    }, registerDevice: function(dev, ops) {
      FS.devices[dev] = { stream_ops: ops };
    }, getDevice: function(dev) {
      return FS.devices[dev];
    }, getMounts: function(mount) {
      var mounts = [];
      var check = [mount];
      while (check.length) {
        var m = check.pop();
        mounts.push(m);
        check.push.apply(check, m.mounts);
      }
      return mounts;
    }, syncfs: function(populate, callback) {
      if (typeof populate === "function") {
        callback = populate;
        populate = false;
      }
      FS.syncFSRequests++;
      if (FS.syncFSRequests > 1) {
        err("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work");
      }
      var mounts = FS.getMounts(FS.root.mount);
      var completed = 0;
      function doCallback(errCode) {
        FS.syncFSRequests--;
        return callback(errCode);
      }
      function done(errCode) {
        if (errCode) {
          if (!done.errored) {
            done.errored = true;
            return doCallback(errCode);
          }
          return;
        }
        if (++completed >= mounts.length) {
          doCallback(null);
        }
      }
      mounts.forEach(function(mount) {
        if (!mount.type.syncfs) {
          return done(null);
        }
        mount.type.syncfs(mount, populate, done);
      });
    }, mount: function(type, opts, mountpoint) {
      var root = mountpoint === "/";
      var pseudo = !mountpoint;
      var node;
      if (root && FS.root) {
        throw new FS.ErrnoError(10);
      } else if (!root && !pseudo) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
        mountpoint = lookup.path;
        node = lookup.node;
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        if (!FS.isDir(node.mode)) {
          throw new FS.ErrnoError(54);
        }
      }
      var mount = { type, opts, mountpoint, mounts: [] };
      var mountRoot = type.mount(mount);
      mountRoot.mount = mount;
      mount.root = mountRoot;
      if (root) {
        FS.root = mountRoot;
      } else if (node) {
        node.mounted = mount;
        if (node.mount) {
          node.mount.mounts.push(mount);
        }
      }
      return mountRoot;
    }, unmount: function(mountpoint) {
      var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
      if (!FS.isMountpoint(lookup.node)) {
        throw new FS.ErrnoError(28);
      }
      var node = lookup.node;
      var mount = node.mounted;
      var mounts = FS.getMounts(mount);
      Object.keys(FS.nameTable).forEach(function(hash) {
        var current = FS.nameTable[hash];
        while (current) {
          var next = current.name_next;
          if (mounts.includes(current.mount)) {
            FS.destroyNode(current);
          }
          current = next;
        }
      });
      node.mounted = null;
      var idx = node.mount.mounts.indexOf(mount);
      node.mount.mounts.splice(idx, 1);
    }, lookup: function(parent, name) {
      return parent.node_ops.lookup(parent, name);
    }, mknod: function(path, mode, dev) {
      var lookup = FS.lookupPath(path, { parent: true });
      var parent = lookup.node;
      var name = PATH.basename(path);
      if (!name || name === "." || name === "..") {
        throw new FS.ErrnoError(28);
      }
      var errCode = FS.mayCreate(parent, name);
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
      if (!parent.node_ops.mknod) {
        throw new FS.ErrnoError(63);
      }
      return parent.node_ops.mknod(parent, name, mode, dev);
    }, create: function(path, mode) {
      mode = mode !== void 0 ? mode : 438;
      mode &= 4095;
      mode |= 32768;
      return FS.mknod(path, mode, 0);
    }, mkdir: function(path, mode) {
      mode = mode !== void 0 ? mode : 511;
      mode &= 511 | 512;
      mode |= 16384;
      return FS.mknod(path, mode, 0);
    }, mkdirTree: function(path, mode) {
      var dirs = path.split("/");
      var d = "";
      for (var i2 = 0; i2 < dirs.length; ++i2) {
        if (!dirs[i2])
          continue;
        d += "/" + dirs[i2];
        try {
          FS.mkdir(d, mode);
        } catch (e) {
          if (e.errno != 20)
            throw e;
        }
      }
    }, mkdev: function(path, mode, dev) {
      if (typeof dev === "undefined") {
        dev = mode;
        mode = 438;
      }
      mode |= 8192;
      return FS.mknod(path, mode, dev);
    }, symlink: function(oldpath, newpath) {
      if (!PATH_FS.resolve(oldpath)) {
        throw new FS.ErrnoError(44);
      }
      var lookup = FS.lookupPath(newpath, { parent: true });
      var parent = lookup.node;
      if (!parent) {
        throw new FS.ErrnoError(44);
      }
      var newname = PATH.basename(newpath);
      var errCode = FS.mayCreate(parent, newname);
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
      if (!parent.node_ops.symlink) {
        throw new FS.ErrnoError(63);
      }
      return parent.node_ops.symlink(parent, newname, oldpath);
    }, rename: function(old_path, new_path) {
      var old_dirname = PATH.dirname(old_path);
      var new_dirname = PATH.dirname(new_path);
      var old_name = PATH.basename(old_path);
      var new_name = PATH.basename(new_path);
      var lookup, old_dir, new_dir;
      lookup = FS.lookupPath(old_path, { parent: true });
      old_dir = lookup.node;
      lookup = FS.lookupPath(new_path, { parent: true });
      new_dir = lookup.node;
      if (!old_dir || !new_dir)
        throw new FS.ErrnoError(44);
      if (old_dir.mount !== new_dir.mount) {
        throw new FS.ErrnoError(75);
      }
      var old_node = FS.lookupNode(old_dir, old_name);
      var relative = PATH_FS.relative(old_path, new_dirname);
      if (relative.charAt(0) !== ".") {
        throw new FS.ErrnoError(28);
      }
      relative = PATH_FS.relative(new_path, old_dirname);
      if (relative.charAt(0) !== ".") {
        throw new FS.ErrnoError(55);
      }
      var new_node;
      try {
        new_node = FS.lookupNode(new_dir, new_name);
      } catch (e) {
      }
      if (old_node === new_node) {
        return;
      }
      var isdir = FS.isDir(old_node.mode);
      var errCode = FS.mayDelete(old_dir, old_name, isdir);
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
      errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
      if (!old_dir.node_ops.rename) {
        throw new FS.ErrnoError(63);
      }
      if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
        throw new FS.ErrnoError(10);
      }
      if (new_dir !== old_dir) {
        errCode = FS.nodePermissions(old_dir, "w");
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
      }
      FS.hashRemoveNode(old_node);
      try {
        old_dir.node_ops.rename(old_node, new_dir, new_name);
      } catch (e) {
        throw e;
      } finally {
        FS.hashAddNode(old_node);
      }
    }, rmdir: function(path) {
      var lookup = FS.lookupPath(path, { parent: true });
      var parent = lookup.node;
      var name = PATH.basename(path);
      var node = FS.lookupNode(parent, name);
      var errCode = FS.mayDelete(parent, name, true);
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
      if (!parent.node_ops.rmdir) {
        throw new FS.ErrnoError(63);
      }
      if (FS.isMountpoint(node)) {
        throw new FS.ErrnoError(10);
      }
      parent.node_ops.rmdir(parent, name);
      FS.destroyNode(node);
    }, readdir: function(path) {
      var lookup = FS.lookupPath(path, { follow: true });
      var node = lookup.node;
      if (!node.node_ops.readdir) {
        throw new FS.ErrnoError(54);
      }
      return node.node_ops.readdir(node);
    }, unlink: function(path) {
      var lookup = FS.lookupPath(path, { parent: true });
      var parent = lookup.node;
      if (!parent) {
        throw new FS.ErrnoError(44);
      }
      var name = PATH.basename(path);
      var node = FS.lookupNode(parent, name);
      var errCode = FS.mayDelete(parent, name, false);
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
      if (!parent.node_ops.unlink) {
        throw new FS.ErrnoError(63);
      }
      if (FS.isMountpoint(node)) {
        throw new FS.ErrnoError(10);
      }
      parent.node_ops.unlink(parent, name);
      FS.destroyNode(node);
    }, readlink: function(path) {
      var lookup = FS.lookupPath(path);
      var link = lookup.node;
      if (!link) {
        throw new FS.ErrnoError(44);
      }
      if (!link.node_ops.readlink) {
        throw new FS.ErrnoError(28);
      }
      return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
    }, stat: function(path, dontFollow) {
      var lookup = FS.lookupPath(path, { follow: !dontFollow });
      var node = lookup.node;
      if (!node) {
        throw new FS.ErrnoError(44);
      }
      if (!node.node_ops.getattr) {
        throw new FS.ErrnoError(63);
      }
      return node.node_ops.getattr(node);
    }, lstat: function(path) {
      return FS.stat(path, true);
    }, chmod: function(path, mode, dontFollow) {
      var node;
      if (typeof path === "string") {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        node = lookup.node;
      } else {
        node = path;
      }
      if (!node.node_ops.setattr) {
        throw new FS.ErrnoError(63);
      }
      node.node_ops.setattr(node, { mode: mode & 4095 | node.mode & ~4095, timestamp: Date.now() });
    }, lchmod: function(path, mode) {
      FS.chmod(path, mode, true);
    }, fchmod: function(fd, mode) {
      var stream = FS.getStream(fd);
      if (!stream) {
        throw new FS.ErrnoError(8);
      }
      FS.chmod(stream.node, mode);
    }, chown: function(path, uid2, gid, dontFollow) {
      var node;
      if (typeof path === "string") {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        node = lookup.node;
      } else {
        node = path;
      }
      if (!node.node_ops.setattr) {
        throw new FS.ErrnoError(63);
      }
      node.node_ops.setattr(node, { timestamp: Date.now() });
    }, lchown: function(path, uid2, gid) {
      FS.chown(path, uid2, gid, true);
    }, fchown: function(fd, uid2, gid) {
      var stream = FS.getStream(fd);
      if (!stream) {
        throw new FS.ErrnoError(8);
      }
      FS.chown(stream.node, uid2, gid);
    }, truncate: function(path, len) {
      if (len < 0) {
        throw new FS.ErrnoError(28);
      }
      var node;
      if (typeof path === "string") {
        var lookup = FS.lookupPath(path, { follow: true });
        node = lookup.node;
      } else {
        node = path;
      }
      if (!node.node_ops.setattr) {
        throw new FS.ErrnoError(63);
      }
      if (FS.isDir(node.mode)) {
        throw new FS.ErrnoError(31);
      }
      if (!FS.isFile(node.mode)) {
        throw new FS.ErrnoError(28);
      }
      var errCode = FS.nodePermissions(node, "w");
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
      node.node_ops.setattr(node, { size: len, timestamp: Date.now() });
    }, ftruncate: function(fd, len) {
      var stream = FS.getStream(fd);
      if (!stream) {
        throw new FS.ErrnoError(8);
      }
      if ((stream.flags & 2097155) === 0) {
        throw new FS.ErrnoError(28);
      }
      FS.truncate(stream.node, len);
    }, utime: function(path, atime, mtime) {
      var lookup = FS.lookupPath(path, { follow: true });
      var node = lookup.node;
      node.node_ops.setattr(node, { timestamp: Math.max(atime, mtime) });
    }, open: function(path, flags, mode, fd_start, fd_end) {
      if (path === "") {
        throw new FS.ErrnoError(44);
      }
      flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
      mode = typeof mode === "undefined" ? 438 : mode;
      if (flags & 64) {
        mode = mode & 4095 | 32768;
      } else {
        mode = 0;
      }
      var node;
      if (typeof path === "object") {
        node = path;
      } else {
        path = PATH.normalize(path);
        try {
          var lookup = FS.lookupPath(path, { follow: !(flags & 131072) });
          node = lookup.node;
        } catch (e) {
        }
      }
      var created = false;
      if (flags & 64) {
        if (node) {
          if (flags & 128) {
            throw new FS.ErrnoError(20);
          }
        } else {
          node = FS.mknod(path, mode, 0);
          created = true;
        }
      }
      if (!node) {
        throw new FS.ErrnoError(44);
      }
      if (FS.isChrdev(node.mode)) {
        flags &= ~512;
      }
      if (flags & 65536 && !FS.isDir(node.mode)) {
        throw new FS.ErrnoError(54);
      }
      if (!created) {
        var errCode = FS.mayOpen(node, flags);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
      }
      if (flags & 512) {
        FS.truncate(node, 0);
      }
      flags &= ~(128 | 512 | 131072);
      var stream = FS.createStream({ node, path: FS.getPath(node), id: node.id, flags, mode: node.mode, seekable: true, position: 0, stream_ops: node.stream_ops, node_ops: node.node_ops, ungotten: [], error: false }, fd_start, fd_end);
      if (stream.stream_ops.open) {
        stream.stream_ops.open(stream);
      }
      if (Module2["logReadFiles"] && !(flags & 1)) {
        if (!FS.readFiles)
          FS.readFiles = {};
        if (!(path in FS.readFiles)) {
          FS.readFiles[path] = 1;
        }
      }
      return stream;
    }, close: function(stream) {
      if (FS.isClosed(stream)) {
        throw new FS.ErrnoError(8);
      }
      if (stream.getdents)
        stream.getdents = null;
      try {
        if (stream.stream_ops.close) {
          stream.stream_ops.close(stream);
        }
      } catch (e) {
        throw e;
      } finally {
        FS.closeStream(stream.fd);
      }
      stream.fd = null;
    }, isClosed: function(stream) {
      return stream.fd === null;
    }, llseek: function(stream, offset, whence) {
      if (FS.isClosed(stream)) {
        throw new FS.ErrnoError(8);
      }
      if (!stream.seekable || !stream.stream_ops.llseek) {
        throw new FS.ErrnoError(70);
      }
      if (whence != 0 && whence != 1 && whence != 2) {
        throw new FS.ErrnoError(28);
      }
      stream.position = stream.stream_ops.llseek(stream, offset, whence);
      stream.ungotten = [];
      return stream.position;
    }, read: function(stream, buffer2, offset, length, position) {
      if (length < 0 || position < 0) {
        throw new FS.ErrnoError(28);
      }
      if (FS.isClosed(stream)) {
        throw new FS.ErrnoError(8);
      }
      if ((stream.flags & 2097155) === 1) {
        throw new FS.ErrnoError(8);
      }
      if (FS.isDir(stream.node.mode)) {
        throw new FS.ErrnoError(31);
      }
      if (!stream.stream_ops.read) {
        throw new FS.ErrnoError(28);
      }
      var seeking = typeof position !== "undefined";
      if (!seeking) {
        position = stream.position;
      } else if (!stream.seekable) {
        throw new FS.ErrnoError(70);
      }
      var bytesRead = stream.stream_ops.read(stream, buffer2, offset, length, position);
      if (!seeking)
        stream.position += bytesRead;
      return bytesRead;
    }, write: function(stream, buffer2, offset, length, position, canOwn) {
      if (length < 0 || position < 0) {
        throw new FS.ErrnoError(28);
      }
      if (FS.isClosed(stream)) {
        throw new FS.ErrnoError(8);
      }
      if ((stream.flags & 2097155) === 0) {
        throw new FS.ErrnoError(8);
      }
      if (FS.isDir(stream.node.mode)) {
        throw new FS.ErrnoError(31);
      }
      if (!stream.stream_ops.write) {
        throw new FS.ErrnoError(28);
      }
      if (stream.seekable && stream.flags & 1024) {
        FS.llseek(stream, 0, 2);
      }
      var seeking = typeof position !== "undefined";
      if (!seeking) {
        position = stream.position;
      } else if (!stream.seekable) {
        throw new FS.ErrnoError(70);
      }
      var bytesWritten = stream.stream_ops.write(stream, buffer2, offset, length, position, canOwn);
      if (!seeking)
        stream.position += bytesWritten;
      return bytesWritten;
    }, allocate: function(stream, offset, length) {
      if (FS.isClosed(stream)) {
        throw new FS.ErrnoError(8);
      }
      if (offset < 0 || length <= 0) {
        throw new FS.ErrnoError(28);
      }
      if ((stream.flags & 2097155) === 0) {
        throw new FS.ErrnoError(8);
      }
      if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
        throw new FS.ErrnoError(43);
      }
      if (!stream.stream_ops.allocate) {
        throw new FS.ErrnoError(138);
      }
      stream.stream_ops.allocate(stream, offset, length);
    }, mmap: function(stream, address, length, position, prot, flags) {
      if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
        throw new FS.ErrnoError(2);
      }
      if ((stream.flags & 2097155) === 1) {
        throw new FS.ErrnoError(2);
      }
      if (!stream.stream_ops.mmap) {
        throw new FS.ErrnoError(43);
      }
      return stream.stream_ops.mmap(stream, address, length, position, prot, flags);
    }, msync: function(stream, buffer2, offset, length, mmapFlags) {
      if (!stream || !stream.stream_ops.msync) {
        return 0;
      }
      return stream.stream_ops.msync(stream, buffer2, offset, length, mmapFlags);
    }, munmap: function(stream) {
      return 0;
    }, ioctl: function(stream, cmd, arg) {
      if (!stream.stream_ops.ioctl) {
        throw new FS.ErrnoError(59);
      }
      return stream.stream_ops.ioctl(stream, cmd, arg);
    }, readFile: function(path, opts) {
      opts = opts || {};
      opts.flags = opts.flags || 0;
      opts.encoding = opts.encoding || "binary";
      if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
        throw new Error('Invalid encoding type "' + opts.encoding + '"');
      }
      var ret;
      var stream = FS.open(path, opts.flags);
      var stat = FS.stat(path);
      var length = stat.size;
      var buf = new Uint8Array(length);
      FS.read(stream, buf, 0, length, 0);
      if (opts.encoding === "utf8") {
        ret = UTF8ArrayToString(buf, 0);
      } else if (opts.encoding === "binary") {
        ret = buf;
      }
      FS.close(stream);
      return ret;
    }, writeFile: function(path, data, opts) {
      opts = opts || {};
      opts.flags = opts.flags || 577;
      var stream = FS.open(path, opts.flags, opts.mode);
      if (typeof data === "string") {
        var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
        var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
        FS.write(stream, buf, 0, actualNumBytes, void 0, opts.canOwn);
      } else if (ArrayBuffer.isView(data)) {
        FS.write(stream, data, 0, data.byteLength, void 0, opts.canOwn);
      } else {
        throw new Error("Unsupported data type");
      }
      FS.close(stream);
    }, cwd: function() {
      return FS.currentPath;
    }, chdir: function(path) {
      var lookup = FS.lookupPath(path, { follow: true });
      if (lookup.node === null) {
        throw new FS.ErrnoError(44);
      }
      if (!FS.isDir(lookup.node.mode)) {
        throw new FS.ErrnoError(54);
      }
      var errCode = FS.nodePermissions(lookup.node, "x");
      if (errCode) {
        throw new FS.ErrnoError(errCode);
      }
      FS.currentPath = lookup.path;
    }, createDefaultDirectories: function() {
      FS.mkdir("/tmp");
      FS.mkdir("/home");
      FS.mkdir("/home/web_user");
    }, createDefaultDevices: function() {
      FS.mkdir("/dev");
      FS.registerDevice(FS.makedev(1, 3), { read: function() {
        return 0;
      }, write: function(stream, buffer2, offset, length, pos) {
        return length;
      } });
      FS.mkdev("/dev/null", FS.makedev(1, 3));
      TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
      TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
      FS.mkdev("/dev/tty", FS.makedev(5, 0));
      FS.mkdev("/dev/tty1", FS.makedev(6, 0));
      var random_device = getRandomDevice();
      FS.createDevice("/dev", "random", random_device);
      FS.createDevice("/dev", "urandom", random_device);
      FS.mkdir("/dev/shm");
      FS.mkdir("/dev/shm/tmp");
    }, createSpecialDirectories: function() {
      FS.mkdir("/proc");
      var proc_self = FS.mkdir("/proc/self");
      FS.mkdir("/proc/self/fd");
      FS.mount({ mount: function() {
        var node = FS.createNode(proc_self, "fd", 16384 | 511, 73);
        node.node_ops = { lookup: function(parent, name) {
          var fd = +name;
          var stream = FS.getStream(fd);
          if (!stream)
            throw new FS.ErrnoError(8);
          var ret = { parent: null, mount: { mountpoint: "fake" }, node_ops: { readlink: function() {
            return stream.path;
          } } };
          ret.parent = ret;
          return ret;
        } };
        return node;
      } }, {}, "/proc/self/fd");
    }, createStandardStreams: function() {
      if (Module2["stdin"]) {
        FS.createDevice("/dev", "stdin", Module2["stdin"]);
      } else {
        FS.symlink("/dev/tty", "/dev/stdin");
      }
      if (Module2["stdout"]) {
        FS.createDevice("/dev", "stdout", null, Module2["stdout"]);
      } else {
        FS.symlink("/dev/tty", "/dev/stdout");
      }
      if (Module2["stderr"]) {
        FS.createDevice("/dev", "stderr", null, Module2["stderr"]);
      } else {
        FS.symlink("/dev/tty1", "/dev/stderr");
      }
      FS.open("/dev/stdin", 0);
      FS.open("/dev/stdout", 1);
      FS.open("/dev/stderr", 1);
    }, ensureErrnoError: function() {
      if (FS.ErrnoError)
        return;
      FS.ErrnoError = function ErrnoError(errno, node) {
        this.node = node;
        this.setErrno = function(errno2) {
          this.errno = errno2;
        };
        this.setErrno(errno);
        this.message = "FS error";
      };
      FS.ErrnoError.prototype = new Error();
      FS.ErrnoError.prototype.constructor = FS.ErrnoError;
      [44].forEach(function(code) {
        FS.genericErrors[code] = new FS.ErrnoError(code);
        FS.genericErrors[code].stack = "<generic error, no stack>";
      });
    }, staticInit: function() {
      FS.ensureErrnoError();
      FS.nameTable = new Array(4096);
      FS.mount(MEMFS, {}, "/");
      FS.createDefaultDirectories();
      FS.createDefaultDevices();
      FS.createSpecialDirectories();
      FS.filesystems = { "MEMFS": MEMFS };
    }, init: function(input, output, error) {
      FS.init.initialized = true;
      FS.ensureErrnoError();
      Module2["stdin"] = input || Module2["stdin"];
      Module2["stdout"] = output || Module2["stdout"];
      Module2["stderr"] = error || Module2["stderr"];
      FS.createStandardStreams();
    }, quit: function() {
      FS.init.initialized = false;
      for (var i2 = 0; i2 < FS.streams.length; i2++) {
        var stream = FS.streams[i2];
        if (!stream) {
          continue;
        }
        FS.close(stream);
      }
    }, getMode: function(canRead, canWrite) {
      var mode = 0;
      if (canRead)
        mode |= 292 | 73;
      if (canWrite)
        mode |= 146;
      return mode;
    }, findObject: function(path, dontResolveLastLink) {
      var ret = FS.analyzePath(path, dontResolveLastLink);
      if (ret.exists) {
        return ret.object;
      } else {
        return null;
      }
    }, analyzePath: function(path, dontResolveLastLink) {
      try {
        var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
        path = lookup.path;
      } catch (e) {
      }
      var ret = { isRoot: false, exists: false, error: 0, name: null, path: null, object: null, parentExists: false, parentPath: null, parentObject: null };
      try {
        var lookup = FS.lookupPath(path, { parent: true });
        ret.parentExists = true;
        ret.parentPath = lookup.path;
        ret.parentObject = lookup.node;
        ret.name = PATH.basename(path);
        lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
        ret.exists = true;
        ret.path = lookup.path;
        ret.object = lookup.node;
        ret.name = lookup.node.name;
        ret.isRoot = lookup.path === "/";
      } catch (e) {
        ret.error = e.errno;
      }
      return ret;
    }, createPath: function(parent, path, canRead, canWrite) {
      parent = typeof parent === "string" ? parent : FS.getPath(parent);
      var parts = path.split("/").reverse();
      while (parts.length) {
        var part = parts.pop();
        if (!part)
          continue;
        var current = PATH.join2(parent, part);
        try {
          FS.mkdir(current);
        } catch (e) {
        }
        parent = current;
      }
      return current;
    }, createFile: function(parent, name, properties, canRead, canWrite) {
      var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
      var mode = FS.getMode(canRead, canWrite);
      return FS.create(path, mode);
    }, createDataFile: function(parent, name, data, canRead, canWrite, canOwn) {
      var path = name ? PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name) : parent;
      var mode = FS.getMode(canRead, canWrite);
      var node = FS.create(path, mode);
      if (data) {
        if (typeof data === "string") {
          var arr = new Array(data.length);
          for (var i2 = 0, len = data.length; i2 < len; ++i2)
            arr[i2] = data.charCodeAt(i2);
          data = arr;
        }
        FS.chmod(node, mode | 146);
        var stream = FS.open(node, 577);
        FS.write(stream, data, 0, data.length, 0, canOwn);
        FS.close(stream);
        FS.chmod(node, mode);
      }
      return node;
    }, createDevice: function(parent, name, input, output) {
      var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
      var mode = FS.getMode(!!input, !!output);
      if (!FS.createDevice.major)
        FS.createDevice.major = 64;
      var dev = FS.makedev(FS.createDevice.major++, 0);
      FS.registerDevice(dev, { open: function(stream) {
        stream.seekable = false;
      }, close: function(stream) {
        if (output && output.buffer && output.buffer.length) {
          output(10);
        }
      }, read: function(stream, buffer2, offset, length, pos) {
        var bytesRead = 0;
        for (var i2 = 0; i2 < length; i2++) {
          var result;
          try {
            result = input();
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
          if (result === void 0 && bytesRead === 0) {
            throw new FS.ErrnoError(6);
          }
          if (result === null || result === void 0)
            break;
          bytesRead++;
          buffer2[offset + i2] = result;
        }
        if (bytesRead) {
          stream.node.timestamp = Date.now();
        }
        return bytesRead;
      }, write: function(stream, buffer2, offset, length, pos) {
        for (var i2 = 0; i2 < length; i2++) {
          try {
            output(buffer2[offset + i2]);
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
        }
        if (length) {
          stream.node.timestamp = Date.now();
        }
        return i2;
      } });
      return FS.mkdev(path, mode, dev);
    }, forceLoadFile: function(obj) {
      if (obj.isDevice || obj.isFolder || obj.link || obj.contents)
        return true;
      if (typeof XMLHttpRequest !== "undefined") {
        throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
      } else if (read_) {
        try {
          obj.contents = intArrayFromString(read_(obj.url), true);
          obj.usedBytes = obj.contents.length;
        } catch (e) {
          throw new FS.ErrnoError(29);
        }
      } else {
        throw new Error("Cannot load without read() or XMLHttpRequest.");
      }
    }, createLazyFile: function(parent, name, url, canRead, canWrite) {
      function LazyUint8Array() {
        this.lengthKnown = false;
        this.chunks = [];
      }
      LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
        if (idx > this.length - 1 || idx < 0) {
          return void 0;
        }
        var chunkOffset = idx % this.chunkSize;
        var chunkNum = idx / this.chunkSize | 0;
        return this.getter(chunkNum)[chunkOffset];
      };
      LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
        this.getter = getter;
      };
      LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
        var xhr = new XMLHttpRequest();
        xhr.open("HEAD", url, false);
        xhr.send(null);
        if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304))
          throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
        var datalength = Number(xhr.getResponseHeader("Content-length"));
        var header;
        var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
        var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
        var chunkSize = 1024 * 1024;
        if (!hasByteServing)
          chunkSize = datalength;
        var doXHR = function(from, to) {
          if (from > to)
            throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
          if (to > datalength - 1)
            throw new Error("only " + datalength + " bytes available! programmer error!");
          var xhr2 = new XMLHttpRequest();
          xhr2.open("GET", url, false);
          if (datalength !== chunkSize)
            xhr2.setRequestHeader("Range", "bytes=" + from + "-" + to);
          if (typeof Uint8Array != "undefined")
            xhr2.responseType = "arraybuffer";
          if (xhr2.overrideMimeType) {
            xhr2.overrideMimeType("text/plain; charset=x-user-defined");
          }
          xhr2.send(null);
          if (!(xhr2.status >= 200 && xhr2.status < 300 || xhr2.status === 304))
            throw new Error("Couldn't load " + url + ". Status: " + xhr2.status);
          if (xhr2.response !== void 0) {
            return new Uint8Array(xhr2.response || []);
          } else {
            return intArrayFromString(xhr2.responseText || "", true);
          }
        };
        var lazyArray2 = this;
        lazyArray2.setDataGetter(function(chunkNum) {
          var start = chunkNum * chunkSize;
          var end = (chunkNum + 1) * chunkSize - 1;
          end = Math.min(end, datalength - 1);
          if (typeof lazyArray2.chunks[chunkNum] === "undefined") {
            lazyArray2.chunks[chunkNum] = doXHR(start, end);
          }
          if (typeof lazyArray2.chunks[chunkNum] === "undefined")
            throw new Error("doXHR failed!");
          return lazyArray2.chunks[chunkNum];
        });
        if (usesGzip || !datalength) {
          chunkSize = datalength = 1;
          datalength = this.getter(0).length;
          chunkSize = datalength;
          out("LazyFiles on gzip forces download of the whole file when length is accessed");
        }
        this._length = datalength;
        this._chunkSize = chunkSize;
        this.lengthKnown = true;
      };
      if (typeof XMLHttpRequest !== "undefined") {
        throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
        var lazyArray = new LazyUint8Array();
        var properties = { isDevice: false, contents: lazyArray };
      } else {
        var properties = { isDevice: false, url };
      }
      var node = FS.createFile(parent, name, properties, canRead, canWrite);
      if (properties.contents) {
        node.contents = properties.contents;
      } else if (properties.url) {
        node.contents = null;
        node.url = properties.url;
      }
      Object.defineProperties(node, { usedBytes: { get: function() {
        return this.contents.length;
      } } });
      var stream_ops = {};
      var keys = Object.keys(node.stream_ops);
      keys.forEach(function(key) {
        var fn = node.stream_ops[key];
        stream_ops[key] = function forceLoadLazyFile() {
          FS.forceLoadFile(node);
          return fn.apply(null, arguments);
        };
      });
      stream_ops.read = function stream_ops_read(stream, buffer2, offset, length, position) {
        FS.forceLoadFile(node);
        var contents = stream.node.contents;
        if (position >= contents.length)
          return 0;
        var size = Math.min(contents.length - position, length);
        if (contents.slice) {
          for (var i2 = 0; i2 < size; i2++) {
            buffer2[offset + i2] = contents[position + i2];
          }
        } else {
          for (var i2 = 0; i2 < size; i2++) {
            buffer2[offset + i2] = contents.get(position + i2);
          }
        }
        return size;
      };
      node.stream_ops = stream_ops;
      return node;
    }, createPreloadedFile: function(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
      Browser.init();
      var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
      function processData(byteArray) {
        function finish(byteArray2) {
          if (preFinish)
            preFinish();
          if (!dontCreateFile) {
            FS.createDataFile(parent, name, byteArray2, canRead, canWrite, canOwn);
          }
          if (onload)
            onload();
          removeRunDependency();
        }
        var handled = false;
        Module2["preloadPlugins"].forEach(function(plugin) {
          if (handled)
            return;
          if (plugin["canHandle"](fullname)) {
            plugin["handle"](byteArray, fullname, finish, function() {
              if (onerror)
                onerror();
              removeRunDependency();
            });
            handled = true;
          }
        });
        if (!handled)
          finish(byteArray);
      }
      addRunDependency();
      if (typeof url == "string") {
        asyncLoad(url, function(byteArray) {
          processData(byteArray);
        }, onerror);
      } else {
        processData(url);
      }
    }, indexedDB: function() {
      return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    }, DB_NAME: function() {
      return "EM_FS_" + window.location.pathname;
    }, DB_VERSION: 20, DB_STORE_NAME: "FILE_DATA", saveFilesToDB: function(paths, onload, onerror) {
      onload = onload || function() {
      };
      onerror = onerror || function() {
      };
      var indexedDB = FS.indexedDB();
      try {
        var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
      } catch (e) {
        return onerror(e);
      }
      openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
        out("creating db");
        var db = openRequest.result;
        db.createObjectStore(FS.DB_STORE_NAME);
      };
      openRequest.onsuccess = function openRequest_onsuccess() {
        var db = openRequest.result;
        var transaction = db.transaction([FS.DB_STORE_NAME], "readwrite");
        var files = transaction.objectStore(FS.DB_STORE_NAME);
        var ok = 0, fail = 0, total = paths.length;
        function finish() {
          if (fail == 0)
            onload();
          else
            onerror();
        }
        paths.forEach(function(path) {
          var putRequest = files.put(FS.analyzePath(path).object.contents, path);
          putRequest.onsuccess = function putRequest_onsuccess() {
            ok++;
            if (ok + fail == total)
              finish();
          };
          putRequest.onerror = function putRequest_onerror() {
            fail++;
            if (ok + fail == total)
              finish();
          };
        });
        transaction.onerror = onerror;
      };
      openRequest.onerror = onerror;
    }, loadFilesFromDB: function(paths, onload, onerror) {
      onload = onload || function() {
      };
      onerror = onerror || function() {
      };
      var indexedDB = FS.indexedDB();
      try {
        var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
      } catch (e) {
        return onerror(e);
      }
      openRequest.onupgradeneeded = onerror;
      openRequest.onsuccess = function openRequest_onsuccess() {
        var db = openRequest.result;
        try {
          var transaction = db.transaction([FS.DB_STORE_NAME], "readonly");
        } catch (e) {
          onerror(e);
          return;
        }
        var files = transaction.objectStore(FS.DB_STORE_NAME);
        var ok = 0, fail = 0, total = paths.length;
        function finish() {
          if (fail == 0)
            onload();
          else
            onerror();
        }
        paths.forEach(function(path) {
          var getRequest = files.get(path);
          getRequest.onsuccess = function getRequest_onsuccess() {
            if (FS.analyzePath(path).exists) {
              FS.unlink(path);
            }
            FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
            ok++;
            if (ok + fail == total)
              finish();
          };
          getRequest.onerror = function getRequest_onerror() {
            fail++;
            if (ok + fail == total)
              finish();
          };
        });
        transaction.onerror = onerror;
      };
      openRequest.onerror = onerror;
    } };
    var SYSCALLS = { mappings: {}, DEFAULT_POLLMASK: 5, calculateAt: function(dirfd, path, allowEmpty) {
      if (path[0] === "/") {
        return path;
      }
      var dir;
      if (dirfd === -100) {
        dir = FS.cwd();
      } else {
        var dirstream = FS.getStream(dirfd);
        if (!dirstream)
          throw new FS.ErrnoError(8);
        dir = dirstream.path;
      }
      if (path.length == 0) {
        if (!allowEmpty) {
          throw new FS.ErrnoError(44);
        }
        return dir;
      }
      return PATH.join2(dir, path);
    }, doStat: function(func, path, buf) {
      try {
        var stat = func(path);
      } catch (e) {
        if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
          return -54;
        }
        throw e;
      }
      HEAP32[buf >> 2] = stat.dev;
      HEAP32[buf + 4 >> 2] = 0;
      HEAP32[buf + 8 >> 2] = stat.ino;
      HEAP32[buf + 12 >> 2] = stat.mode;
      HEAP32[buf + 16 >> 2] = stat.nlink;
      HEAP32[buf + 20 >> 2] = stat.uid;
      HEAP32[buf + 24 >> 2] = stat.gid;
      HEAP32[buf + 28 >> 2] = stat.rdev;
      HEAP32[buf + 32 >> 2] = 0;
      tempI64 = [stat.size >>> 0, (tempDouble = stat.size, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 40 >> 2] = tempI64[0], HEAP32[buf + 44 >> 2] = tempI64[1];
      HEAP32[buf + 48 >> 2] = 4096;
      HEAP32[buf + 52 >> 2] = stat.blocks;
      HEAP32[buf + 56 >> 2] = stat.atime.getTime() / 1e3 | 0;
      HEAP32[buf + 60 >> 2] = 0;
      HEAP32[buf + 64 >> 2] = stat.mtime.getTime() / 1e3 | 0;
      HEAP32[buf + 68 >> 2] = 0;
      HEAP32[buf + 72 >> 2] = stat.ctime.getTime() / 1e3 | 0;
      HEAP32[buf + 76 >> 2] = 0;
      tempI64 = [stat.ino >>> 0, (tempDouble = stat.ino, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 80 >> 2] = tempI64[0], HEAP32[buf + 84 >> 2] = tempI64[1];
      return 0;
    }, doMsync: function(addr, stream, len, flags, offset) {
      var buffer2 = HEAPU8.slice(addr, addr + len);
      FS.msync(stream, buffer2, offset, len, flags);
    }, doMkdir: function(path, mode) {
      path = PATH.normalize(path);
      if (path[path.length - 1] === "/")
        path = path.substr(0, path.length - 1);
      FS.mkdir(path, mode, 0);
      return 0;
    }, doMknod: function(path, mode, dev) {
      switch (mode & 61440) {
        case 32768:
        case 8192:
        case 24576:
        case 4096:
        case 49152:
          break;
        default:
          return -28;
      }
      FS.mknod(path, mode, dev);
      return 0;
    }, doReadlink: function(path, buf, bufsize) {
      if (bufsize <= 0)
        return -28;
      var ret = FS.readlink(path);
      var len = Math.min(bufsize, lengthBytesUTF8(ret));
      var endChar = HEAP8[buf + len];
      stringToUTF8(ret, buf, bufsize + 1);
      HEAP8[buf + len] = endChar;
      return len;
    }, doAccess: function(path, amode) {
      if (amode & ~7) {
        return -28;
      }
      var lookup = FS.lookupPath(path, { follow: true });
      var node = lookup.node;
      if (!node) {
        return -44;
      }
      var perms = "";
      if (amode & 4)
        perms += "r";
      if (amode & 2)
        perms += "w";
      if (amode & 1)
        perms += "x";
      if (perms && FS.nodePermissions(node, perms)) {
        return -2;
      }
      return 0;
    }, doDup: function(path, flags, suggestFD) {
      var suggest = FS.getStream(suggestFD);
      if (suggest)
        FS.close(suggest);
      return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
    }, doReadv: function(stream, iov, iovcnt, offset) {
      var ret = 0;
      for (var i2 = 0; i2 < iovcnt; i2++) {
        var ptr = HEAP32[iov + i2 * 8 >> 2];
        var len = HEAP32[iov + (i2 * 8 + 4) >> 2];
        var curr = FS.read(stream, HEAP8, ptr, len, offset);
        if (curr < 0)
          return -1;
        ret += curr;
        if (curr < len)
          break;
      }
      return ret;
    }, doWritev: function(stream, iov, iovcnt, offset) {
      var ret = 0;
      for (var i2 = 0; i2 < iovcnt; i2++) {
        var ptr = HEAP32[iov + i2 * 8 >> 2];
        var len = HEAP32[iov + (i2 * 8 + 4) >> 2];
        var curr = FS.write(stream, HEAP8, ptr, len, offset);
        if (curr < 0)
          return -1;
        ret += curr;
      }
      return ret;
    }, varargs: void 0, get: function() {
      SYSCALLS.varargs += 4;
      var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
      return ret;
    }, getStr: function(ptr) {
      var ret = UTF8ToString(ptr);
      return ret;
    }, getStreamFromFD: function(fd) {
      var stream = FS.getStream(fd);
      if (!stream)
        throw new FS.ErrnoError(8);
      return stream;
    }, get64: function(low, high) {
      return low;
    } };
    function ___syscall_fcntl64(fd, cmd, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (cmd) {
          case 0: {
            var arg = SYSCALLS.get();
            if (arg < 0) {
              return -28;
            }
            var newStream;
            newStream = FS.open(stream.path, stream.flags, 0, arg);
            return newStream.fd;
          }
          case 1:
          case 2:
            return 0;
          case 3:
            return stream.flags;
          case 4: {
            var arg = SYSCALLS.get();
            stream.flags |= arg;
            return 0;
          }
          case 5: {
            var arg = SYSCALLS.get();
            var offset = 0;
            HEAP16[arg + offset >> 1] = 2;
            return 0;
          }
          case 6:
          case 7:
            return 0;
          case 16:
          case 8:
            return -28;
          case 9:
            setErrNo(28);
            return -1;
          default: {
            return -28;
          }
        }
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          throw e;
        return -e.errno;
      }
    }
    function ___syscall_fstatat64(dirfd, path, buf, flags) {
      try {
        path = SYSCALLS.getStr(path);
        var nofollow = flags & 256;
        var allowEmpty = flags & 4096;
        flags = flags & ~4352;
        path = SYSCALLS.calculateAt(dirfd, path, allowEmpty);
        return SYSCALLS.doStat(nofollow ? FS.lstat : FS.stat, path, buf);
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          throw e;
        return -e.errno;
      }
    }
    function ___syscall_ftruncate64(fd, low, high) {
      try {
        var length = SYSCALLS.get64(low, high);
        FS.ftruncate(fd, length);
        return 0;
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          throw e;
        return -e.errno;
      }
    }
    function ___syscall_getcwd(buf, size) {
      try {
        if (size === 0)
          return -28;
        var cwd = FS.cwd();
        var cwdLengthInBytes = lengthBytesUTF8(cwd);
        if (size < cwdLengthInBytes + 1)
          return -68;
        stringToUTF8(cwd, buf, size);
        return buf;
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          throw e;
        return -e.errno;
      }
    }
    function ___syscall_getdents64(fd, dirp, count) {
      try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        if (!stream.getdents) {
          stream.getdents = FS.readdir(stream.path);
        }
        var struct_size = 280;
        var pos = 0;
        var off = FS.llseek(stream, 0, 1);
        var idx = Math.floor(off / struct_size);
        while (idx < stream.getdents.length && pos + struct_size <= count) {
          var id2;
          var type;
          var name = stream.getdents[idx];
          if (name === ".") {
            id2 = stream.id;
            type = 4;
          } else if (name === "..") {
            var lookup = FS.lookupPath(stream.path, { parent: true });
            id2 = lookup.node.id;
            type = 4;
          } else {
            var child = FS.lookupNode(stream, name);
            id2 = child.id;
            type = FS.isChrdev(child.mode) ? 2 : FS.isDir(child.mode) ? 4 : FS.isLink(child.mode) ? 10 : 8;
          }
          tempI64 = [id2 >>> 0, (tempDouble = id2, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[dirp + pos >> 2] = tempI64[0], HEAP32[dirp + pos + 4 >> 2] = tempI64[1];
          tempI64 = [(idx + 1) * struct_size >>> 0, (tempDouble = (idx + 1) * struct_size, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[dirp + pos + 8 >> 2] = tempI64[0], HEAP32[dirp + pos + 12 >> 2] = tempI64[1];
          HEAP16[dirp + pos + 16 >> 1] = 280;
          HEAP8[dirp + pos + 18 >> 0] = type;
          stringToUTF8(name, dirp + pos + 19, 256);
          pos += struct_size;
          idx += 1;
        }
        FS.llseek(stream, idx * struct_size, 0);
        return pos;
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          throw e;
        return -e.errno;
      }
    }
    function ___syscall_ioctl(fd, op, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (op) {
          case 21509:
          case 21505: {
            if (!stream.tty)
              return -59;
            return 0;
          }
          case 21510:
          case 21511:
          case 21512:
          case 21506:
          case 21507:
          case 21508: {
            if (!stream.tty)
              return -59;
            return 0;
          }
          case 21519: {
            if (!stream.tty)
              return -59;
            var argp = SYSCALLS.get();
            HEAP32[argp >> 2] = 0;
            return 0;
          }
          case 21520: {
            if (!stream.tty)
              return -59;
            return -28;
          }
          case 21531: {
            var argp = SYSCALLS.get();
            return FS.ioctl(stream, op, argp);
          }
          case 21523: {
            if (!stream.tty)
              return -59;
            return 0;
          }
          case 21524: {
            if (!stream.tty)
              return -59;
            return 0;
          }
          default:
            abort("bad ioctl syscall " + op);
        }
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          throw e;
        return -e.errno;
      }
    }
    function ___syscall_lstat64(path, buf) {
      try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doStat(FS.lstat, path, buf);
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          throw e;
        return -e.errno;
      }
    }
    function ___syscall_mkdir(path, mode) {
      try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doMkdir(path, mode);
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          throw e;
        return -e.errno;
      }
    }
    function syscallMmap2(addr, len, prot, flags, fd, off) {
      off <<= 12;
      var ptr;
      var allocated = false;
      if ((flags & 16) !== 0 && addr % 65536 !== 0) {
        return -28;
      }
      if ((flags & 32) !== 0) {
        ptr = mmapAlloc(len);
        if (!ptr)
          return -48;
        allocated = true;
      } else {
        var info = FS.getStream(fd);
        if (!info)
          return -8;
        var res = FS.mmap(info, addr, len, off, prot, flags);
        ptr = res.ptr;
        allocated = res.allocated;
      }
      SYSCALLS.mappings[ptr] = { malloc: ptr, len, allocated, fd, prot, flags, offset: off };
      return ptr;
    }
    function ___syscall_mmap2(addr, len, prot, flags, fd, off) {
      try {
        return syscallMmap2(addr, len, prot, flags, fd, off);
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          throw e;
        return -e.errno;
      }
    }
    function syscallMunmap(addr, len) {
      var info = SYSCALLS.mappings[addr];
      if (len === 0 || !info) {
        return -28;
      }
      if (len === info.len) {
        var stream = FS.getStream(info.fd);
        if (stream) {
          if (info.prot & 2) {
            SYSCALLS.doMsync(addr, stream, len, info.flags, info.offset);
          }
          FS.munmap(stream);
        }
        SYSCALLS.mappings[addr] = null;
        if (info.allocated) {
          _free(info.malloc);
        }
      }
      return 0;
    }
    function ___syscall_munmap(addr, len) {
      try {
        return syscallMunmap(addr, len);
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          throw e;
        return -e.errno;
      }
    }
    function ___syscall_open(path, flags, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        var pathname = SYSCALLS.getStr(path);
        var mode = varargs ? SYSCALLS.get() : 0;
        var stream = FS.open(pathname, flags, mode);
        return stream.fd;
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          throw e;
        return -e.errno;
      }
    }
    function ___syscall_readlink(path, buf, bufsize) {
      try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doReadlink(path, buf, bufsize);
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          throw e;
        return -e.errno;
      }
    }
    function ___syscall_stat64(path, buf) {
      try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doStat(FS.stat, path, buf);
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          throw e;
        return -e.errno;
      }
    }
    function ___syscall_unlink(path) {
      try {
        path = SYSCALLS.getStr(path);
        FS.unlink(path);
        return 0;
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          throw e;
        return -e.errno;
      }
    }
    function __dlopen_js(filename, flag) {
      abort("To use dlopen, you need to use Emscripten's linking support, see https://github.com/emscripten-core/emscripten/wiki/Linking");
    }
    function __dlsym_js(handle, symbol) {
      abort("To use dlopen, you need to use Emscripten's linking support, see https://github.com/emscripten-core/emscripten/wiki/Linking");
    }
    function __embind_register_bigint(primitiveType, name, size, minRange, maxRange) {
    }
    function getShiftFromSize(size) {
      switch (size) {
        case 1:
          return 0;
        case 2:
          return 1;
        case 4:
          return 2;
        case 8:
          return 3;
        default:
          throw new TypeError("Unknown type size: " + size);
      }
    }
    function embind_init_charCodes() {
      var codes = new Array(256);
      for (var i2 = 0; i2 < 256; ++i2) {
        codes[i2] = String.fromCharCode(i2);
      }
      embind_charCodes = codes;
    }
    var embind_charCodes = void 0;
    function readLatin1String(ptr) {
      var ret = "";
      var c = ptr;
      while (HEAPU8[c]) {
        ret += embind_charCodes[HEAPU8[c++]];
      }
      return ret;
    }
    var awaitingDependencies = {};
    var registeredTypes = {};
    var typeDependencies = {};
    var char_0 = 48;
    var char_9 = 57;
    function makeLegalFunctionName(name) {
      if (name === void 0) {
        return "_unknown";
      }
      name = name.replace(/[^a-zA-Z0-9_]/g, "$");
      var f = name.charCodeAt(0);
      if (f >= char_0 && f <= char_9) {
        return "_" + name;
      } else {
        return name;
      }
    }
    function createNamedFunction(name, body) {
      name = makeLegalFunctionName(name);
      return new Function("body", "return function " + name + '() {\n    "use strict";    return body.apply(this, arguments);\n};\n')(body);
    }
    function extendError(baseErrorType, errorName) {
      var errorClass = createNamedFunction(errorName, function(message) {
        this.name = errorName;
        this.message = message;
        var stack = new Error(message).stack;
        if (stack !== void 0) {
          this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "");
        }
      });
      errorClass.prototype = Object.create(baseErrorType.prototype);
      errorClass.prototype.constructor = errorClass;
      errorClass.prototype.toString = function() {
        if (this.message === void 0) {
          return this.name;
        } else {
          return this.name + ": " + this.message;
        }
      };
      return errorClass;
    }
    var BindingError = void 0;
    function throwBindingError(message) {
      throw new BindingError(message);
    }
    var InternalError = void 0;
    function throwInternalError(message) {
      throw new InternalError(message);
    }
    function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
      myTypes.forEach(function(type) {
        typeDependencies[type] = dependentTypes;
      });
      function onComplete(typeConverters2) {
        var myTypeConverters = getTypeConverters(typeConverters2);
        if (myTypeConverters.length !== myTypes.length) {
          throwInternalError("Mismatched type converter count");
        }
        for (var i2 = 0; i2 < myTypes.length; ++i2) {
          registerType(myTypes[i2], myTypeConverters[i2]);
        }
      }
      var typeConverters = new Array(dependentTypes.length);
      var unregisteredTypes = [];
      var registered = 0;
      dependentTypes.forEach(function(dt, i2) {
        if (registeredTypes.hasOwnProperty(dt)) {
          typeConverters[i2] = registeredTypes[dt];
        } else {
          unregisteredTypes.push(dt);
          if (!awaitingDependencies.hasOwnProperty(dt)) {
            awaitingDependencies[dt] = [];
          }
          awaitingDependencies[dt].push(function() {
            typeConverters[i2] = registeredTypes[dt];
            ++registered;
            if (registered === unregisteredTypes.length) {
              onComplete(typeConverters);
            }
          });
        }
      });
      if (unregisteredTypes.length === 0) {
        onComplete(typeConverters);
      }
    }
    function registerType(rawType, registeredInstance, options) {
      options = options || {};
      if (!("argPackAdvance" in registeredInstance)) {
        throw new TypeError("registerType registeredInstance requires argPackAdvance");
      }
      var name = registeredInstance.name;
      if (!rawType) {
        throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
      }
      if (registeredTypes.hasOwnProperty(rawType)) {
        if (options.ignoreDuplicateRegistrations) {
          return;
        } else {
          throwBindingError("Cannot register type '" + name + "' twice");
        }
      }
      registeredTypes[rawType] = registeredInstance;
      delete typeDependencies[rawType];
      if (awaitingDependencies.hasOwnProperty(rawType)) {
        var callbacks2 = awaitingDependencies[rawType];
        delete awaitingDependencies[rawType];
        callbacks2.forEach(function(cb) {
          cb();
        });
      }
    }
    function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
      var shift = getShiftFromSize(size);
      name = readLatin1String(name);
      registerType(rawType, { name, "fromWireType": function(wt) {
        return !!wt;
      }, "toWireType": function(destructors, o) {
        return o ? trueValue : falseValue;
      }, "argPackAdvance": 8, "readValueFromPointer": function(pointer) {
        var heap;
        if (size === 1) {
          heap = HEAP8;
        } else if (size === 2) {
          heap = HEAP16;
        } else if (size === 4) {
          heap = HEAP32;
        } else {
          throw new TypeError("Unknown boolean type size: " + name);
        }
        return this["fromWireType"](heap[pointer >> shift]);
      }, destructorFunction: null });
    }
    function ClassHandle_isAliasOf(other) {
      if (!(this instanceof ClassHandle)) {
        return false;
      }
      if (!(other instanceof ClassHandle)) {
        return false;
      }
      var leftClass = this.$$.ptrType.registeredClass;
      var left = this.$$.ptr;
      var rightClass = other.$$.ptrType.registeredClass;
      var right = other.$$.ptr;
      while (leftClass.baseClass) {
        left = leftClass.upcast(left);
        leftClass = leftClass.baseClass;
      }
      while (rightClass.baseClass) {
        right = rightClass.upcast(right);
        rightClass = rightClass.baseClass;
      }
      return leftClass === rightClass && left === right;
    }
    function shallowCopyInternalPointer(o) {
      return { count: o.count, deleteScheduled: o.deleteScheduled, preservePointerOnDelete: o.preservePointerOnDelete, ptr: o.ptr, ptrType: o.ptrType, smartPtr: o.smartPtr, smartPtrType: o.smartPtrType };
    }
    function throwInstanceAlreadyDeleted(obj) {
      function getInstanceTypeName(handle) {
        return handle.$$.ptrType.registeredClass.name;
      }
      throwBindingError(getInstanceTypeName(obj) + " instance already deleted");
    }
    var finalizationGroup = false;
    function detachFinalizer(handle) {
    }
    function runDestructor($$) {
      if ($$.smartPtr) {
        $$.smartPtrType.rawDestructor($$.smartPtr);
      } else {
        $$.ptrType.registeredClass.rawDestructor($$.ptr);
      }
    }
    function releaseClassHandle($$) {
      $$.count.value -= 1;
      var toDelete = $$.count.value === 0;
      if (toDelete) {
        runDestructor($$);
      }
    }
    function attachFinalizer(handle) {
      if (typeof FinalizationGroup2 === "undefined") {
        attachFinalizer = function(handle2) {
          return handle2;
        };
        return handle;
      }
      finalizationGroup = new FinalizationGroup2(function(iter) {
        for (var result = iter.next(); !result.done; result = iter.next()) {
          var $$ = result.value;
          if (!$$.ptr) {
            console.warn("object already deleted: " + $$.ptr);
          } else {
            releaseClassHandle($$);
          }
        }
      });
      attachFinalizer = function(handle2) {
        finalizationGroup.register(handle2, handle2.$$, handle2.$$);
        return handle2;
      };
      detachFinalizer = function(handle2) {
        finalizationGroup.unregister(handle2.$$);
      };
      return attachFinalizer(handle);
    }
    function ClassHandle_clone() {
      if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this);
      }
      if (this.$$.preservePointerOnDelete) {
        this.$$.count.value += 1;
        return this;
      } else {
        var clone = attachFinalizer(Object.create(Object.getPrototypeOf(this), { $$: { value: shallowCopyInternalPointer(this.$$) } }));
        clone.$$.count.value += 1;
        clone.$$.deleteScheduled = false;
        return clone;
      }
    }
    function ClassHandle_delete() {
      if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this);
      }
      if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
        throwBindingError("Object already scheduled for deletion");
      }
      detachFinalizer(this);
      releaseClassHandle(this.$$);
      if (!this.$$.preservePointerOnDelete) {
        this.$$.smartPtr = void 0;
        this.$$.ptr = void 0;
      }
    }
    function ClassHandle_isDeleted() {
      return !this.$$.ptr;
    }
    var delayFunction = void 0;
    var deletionQueue = [];
    function flushPendingDeletes() {
      while (deletionQueue.length) {
        var obj = deletionQueue.pop();
        obj.$$.deleteScheduled = false;
        obj["delete"]();
      }
    }
    function ClassHandle_deleteLater() {
      if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this);
      }
      if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
        throwBindingError("Object already scheduled for deletion");
      }
      deletionQueue.push(this);
      if (deletionQueue.length === 1 && delayFunction) {
        delayFunction(flushPendingDeletes);
      }
      this.$$.deleteScheduled = true;
      return this;
    }
    function init_ClassHandle() {
      ClassHandle.prototype["isAliasOf"] = ClassHandle_isAliasOf;
      ClassHandle.prototype["clone"] = ClassHandle_clone;
      ClassHandle.prototype["delete"] = ClassHandle_delete;
      ClassHandle.prototype["isDeleted"] = ClassHandle_isDeleted;
      ClassHandle.prototype["deleteLater"] = ClassHandle_deleteLater;
    }
    function ClassHandle() {
    }
    var registeredPointers = {};
    function ensureOverloadTable(proto, methodName, humanName) {
      if (proto[methodName].overloadTable === void 0) {
        var prevFunc = proto[methodName];
        proto[methodName] = function() {
          if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
            throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!");
          }
          return proto[methodName].overloadTable[arguments.length].apply(this, arguments);
        };
        proto[methodName].overloadTable = [];
        proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
      }
    }
    function exposePublicSymbol(name, value, numArguments) {
      if (Module2.hasOwnProperty(name)) {
        if (numArguments === void 0 || Module2[name].overloadTable !== void 0 && Module2[name].overloadTable[numArguments] !== void 0) {
          throwBindingError("Cannot register public name '" + name + "' twice");
        }
        ensureOverloadTable(Module2, name, name);
        if (Module2.hasOwnProperty(numArguments)) {
          throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!");
        }
        Module2[name].overloadTable[numArguments] = value;
      } else {
        Module2[name] = value;
        if (numArguments !== void 0) {
          Module2[name].numArguments = numArguments;
        }
      }
    }
    function RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast) {
      this.name = name;
      this.constructor = constructor;
      this.instancePrototype = instancePrototype;
      this.rawDestructor = rawDestructor;
      this.baseClass = baseClass;
      this.getActualType = getActualType;
      this.upcast = upcast;
      this.downcast = downcast;
      this.pureVirtualFunctions = [];
    }
    function upcastPointer(ptr, ptrClass, desiredClass) {
      while (ptrClass !== desiredClass) {
        if (!ptrClass.upcast) {
          throwBindingError("Expected null or instance of " + desiredClass.name + ", got an instance of " + ptrClass.name);
        }
        ptr = ptrClass.upcast(ptr);
        ptrClass = ptrClass.baseClass;
      }
      return ptr;
    }
    function constNoSmartPtrRawPointerToWireType(destructors, handle) {
      if (handle === null) {
        if (this.isReference) {
          throwBindingError("null is not a valid " + this.name);
        }
        return 0;
      }
      if (!handle.$$) {
        throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
      }
      if (!handle.$$.ptr) {
        throwBindingError("Cannot pass deleted object as a pointer of type " + this.name);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      return ptr;
    }
    function genericPointerToWireType(destructors, handle) {
      var ptr;
      if (handle === null) {
        if (this.isReference) {
          throwBindingError("null is not a valid " + this.name);
        }
        if (this.isSmartPointer) {
          ptr = this.rawConstructor();
          if (destructors !== null) {
            destructors.push(this.rawDestructor, ptr);
          }
          return ptr;
        } else {
          return 0;
        }
      }
      if (!handle.$$) {
        throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
      }
      if (!handle.$$.ptr) {
        throwBindingError("Cannot pass deleted object as a pointer of type " + this.name);
      }
      if (!this.isConst && handle.$$.ptrType.isConst) {
        throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      if (this.isSmartPointer) {
        if (handle.$$.smartPtr === void 0) {
          throwBindingError("Passing raw pointer to smart pointer is illegal");
        }
        switch (this.sharingPolicy) {
          case 0:
            if (handle.$$.smartPtrType === this) {
              ptr = handle.$$.smartPtr;
            } else {
              throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name);
            }
            break;
          case 1:
            ptr = handle.$$.smartPtr;
            break;
          case 2:
            if (handle.$$.smartPtrType === this) {
              ptr = handle.$$.smartPtr;
            } else {
              var clonedHandle = handle["clone"]();
              ptr = this.rawShare(ptr, Emval.toHandle(function() {
                clonedHandle["delete"]();
              }));
              if (destructors !== null) {
                destructors.push(this.rawDestructor, ptr);
              }
            }
            break;
          default:
            throwBindingError("Unsupporting sharing policy");
        }
      }
      return ptr;
    }
    function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
      if (handle === null) {
        if (this.isReference) {
          throwBindingError("null is not a valid " + this.name);
        }
        return 0;
      }
      if (!handle.$$) {
        throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
      }
      if (!handle.$$.ptr) {
        throwBindingError("Cannot pass deleted object as a pointer of type " + this.name);
      }
      if (handle.$$.ptrType.isConst) {
        throwBindingError("Cannot convert argument of type " + handle.$$.ptrType.name + " to parameter type " + this.name);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      return ptr;
    }
    function simpleReadValueFromPointer(pointer) {
      return this["fromWireType"](HEAPU32[pointer >> 2]);
    }
    function RegisteredPointer_getPointee(ptr) {
      if (this.rawGetPointee) {
        ptr = this.rawGetPointee(ptr);
      }
      return ptr;
    }
    function RegisteredPointer_destructor(ptr) {
      if (this.rawDestructor) {
        this.rawDestructor(ptr);
      }
    }
    function RegisteredPointer_deleteObject(handle) {
      if (handle !== null) {
        handle["delete"]();
      }
    }
    function downcastPointer(ptr, ptrClass, desiredClass) {
      if (ptrClass === desiredClass) {
        return ptr;
      }
      if (desiredClass.baseClass === void 0) {
        return null;
      }
      var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
      if (rv === null) {
        return null;
      }
      return desiredClass.downcast(rv);
    }
    function getInheritedInstanceCount() {
      return Object.keys(registeredInstances).length;
    }
    function getLiveInheritedInstances() {
      var rv = [];
      for (var k in registeredInstances) {
        if (registeredInstances.hasOwnProperty(k)) {
          rv.push(registeredInstances[k]);
        }
      }
      return rv;
    }
    function setDelayFunction(fn) {
      delayFunction = fn;
      if (deletionQueue.length && delayFunction) {
        delayFunction(flushPendingDeletes);
      }
    }
    function init_embind() {
      Module2["getInheritedInstanceCount"] = getInheritedInstanceCount;
      Module2["getLiveInheritedInstances"] = getLiveInheritedInstances;
      Module2["flushPendingDeletes"] = flushPendingDeletes;
      Module2["setDelayFunction"] = setDelayFunction;
    }
    var registeredInstances = {};
    function getBasestPointer(class_, ptr) {
      if (ptr === void 0) {
        throwBindingError("ptr should not be undefined");
      }
      while (class_.baseClass) {
        ptr = class_.upcast(ptr);
        class_ = class_.baseClass;
      }
      return ptr;
    }
    function getInheritedInstance(class_, ptr) {
      ptr = getBasestPointer(class_, ptr);
      return registeredInstances[ptr];
    }
    function makeClassHandle(prototype, record) {
      if (!record.ptrType || !record.ptr) {
        throwInternalError("makeClassHandle requires ptr and ptrType");
      }
      var hasSmartPtrType = !!record.smartPtrType;
      var hasSmartPtr = !!record.smartPtr;
      if (hasSmartPtrType !== hasSmartPtr) {
        throwInternalError("Both smartPtrType and smartPtr must be specified");
      }
      record.count = { value: 1 };
      return attachFinalizer(Object.create(prototype, { $$: { value: record } }));
    }
    function RegisteredPointer_fromWireType(ptr) {
      var rawPointer = this.getPointee(ptr);
      if (!rawPointer) {
        this.destructor(ptr);
        return null;
      }
      var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
      if (registeredInstance !== void 0) {
        if (registeredInstance.$$.count.value === 0) {
          registeredInstance.$$.ptr = rawPointer;
          registeredInstance.$$.smartPtr = ptr;
          return registeredInstance["clone"]();
        } else {
          var rv = registeredInstance["clone"]();
          this.destructor(ptr);
          return rv;
        }
      }
      function makeDefaultHandle() {
        if (this.isSmartPointer) {
          return makeClassHandle(this.registeredClass.instancePrototype, { ptrType: this.pointeeType, ptr: rawPointer, smartPtrType: this, smartPtr: ptr });
        } else {
          return makeClassHandle(this.registeredClass.instancePrototype, { ptrType: this, ptr });
        }
      }
      var actualType = this.registeredClass.getActualType(rawPointer);
      var registeredPointerRecord = registeredPointers[actualType];
      if (!registeredPointerRecord) {
        return makeDefaultHandle.call(this);
      }
      var toType;
      if (this.isConst) {
        toType = registeredPointerRecord.constPointerType;
      } else {
        toType = registeredPointerRecord.pointerType;
      }
      var dp = downcastPointer(rawPointer, this.registeredClass, toType.registeredClass);
      if (dp === null) {
        return makeDefaultHandle.call(this);
      }
      if (this.isSmartPointer) {
        return makeClassHandle(toType.registeredClass.instancePrototype, { ptrType: toType, ptr: dp, smartPtrType: this, smartPtr: ptr });
      } else {
        return makeClassHandle(toType.registeredClass.instancePrototype, { ptrType: toType, ptr: dp });
      }
    }
    function init_RegisteredPointer() {
      RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
      RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
      RegisteredPointer.prototype["argPackAdvance"] = 8;
      RegisteredPointer.prototype["readValueFromPointer"] = simpleReadValueFromPointer;
      RegisteredPointer.prototype["deleteObject"] = RegisteredPointer_deleteObject;
      RegisteredPointer.prototype["fromWireType"] = RegisteredPointer_fromWireType;
    }
    function RegisteredPointer(name, registeredClass, isReference, isConst, isSmartPointer, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor) {
      this.name = name;
      this.registeredClass = registeredClass;
      this.isReference = isReference;
      this.isConst = isConst;
      this.isSmartPointer = isSmartPointer;
      this.pointeeType = pointeeType;
      this.sharingPolicy = sharingPolicy;
      this.rawGetPointee = rawGetPointee;
      this.rawConstructor = rawConstructor;
      this.rawShare = rawShare;
      this.rawDestructor = rawDestructor;
      if (!isSmartPointer && registeredClass.baseClass === void 0) {
        if (isConst) {
          this["toWireType"] = constNoSmartPtrRawPointerToWireType;
          this.destructorFunction = null;
        } else {
          this["toWireType"] = nonConstNoSmartPtrRawPointerToWireType;
          this.destructorFunction = null;
        }
      } else {
        this["toWireType"] = genericPointerToWireType;
      }
    }
    function replacePublicSymbol(name, value, numArguments) {
      if (!Module2.hasOwnProperty(name)) {
        throwInternalError("Replacing nonexistant public symbol");
      }
      if (Module2[name].overloadTable !== void 0 && numArguments !== void 0) {
        Module2[name].overloadTable[numArguments] = value;
      } else {
        Module2[name] = value;
        Module2[name].argCount = numArguments;
      }
    }
    function dynCallLegacy(sig, ptr, args) {
      var f = Module2["dynCall_" + sig];
      return args && args.length ? f.apply(null, [ptr].concat(args)) : f.call(null, ptr);
    }
    function dynCall(sig, ptr, args) {
      if (sig.includes("j")) {
        return dynCallLegacy(sig, ptr, args);
      }
      return getWasmTableEntry(ptr).apply(null, args);
    }
    function getDynCaller(sig, ptr) {
      var argCache = [];
      return function() {
        argCache.length = arguments.length;
        for (var i2 = 0; i2 < arguments.length; i2++) {
          argCache[i2] = arguments[i2];
        }
        return dynCall(sig, ptr, argCache);
      };
    }
    function embind__requireFunction(signature, rawFunction) {
      signature = readLatin1String(signature);
      function makeDynCaller() {
        if (signature.includes("j")) {
          return getDynCaller(signature, rawFunction);
        }
        return getWasmTableEntry(rawFunction);
      }
      var fp = makeDynCaller();
      if (typeof fp !== "function") {
        throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction);
      }
      return fp;
    }
    var UnboundTypeError = void 0;
    function getTypeName(type) {
      var ptr = ___getTypeName(type);
      var rv = readLatin1String(ptr);
      _free(ptr);
      return rv;
    }
    function throwUnboundTypeError(message, types) {
      var unboundTypes = [];
      var seen = {};
      function visit(type) {
        if (seen[type]) {
          return;
        }
        if (registeredTypes[type]) {
          return;
        }
        if (typeDependencies[type]) {
          typeDependencies[type].forEach(visit);
          return;
        }
        unboundTypes.push(type);
        seen[type] = true;
      }
      types.forEach(visit);
      throw new UnboundTypeError(message + ": " + unboundTypes.map(getTypeName).join([", "]));
    }
    function __embind_register_class(rawType, rawPointerType, rawConstPointerType, baseClassRawType, getActualTypeSignature, getActualType, upcastSignature, upcast, downcastSignature, downcast, name, destructorSignature, rawDestructor) {
      name = readLatin1String(name);
      getActualType = embind__requireFunction(getActualTypeSignature, getActualType);
      if (upcast) {
        upcast = embind__requireFunction(upcastSignature, upcast);
      }
      if (downcast) {
        downcast = embind__requireFunction(downcastSignature, downcast);
      }
      rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
      var legalFunctionName = makeLegalFunctionName(name);
      exposePublicSymbol(legalFunctionName, function() {
        throwUnboundTypeError("Cannot construct " + name + " due to unbound types", [baseClassRawType]);
      });
      whenDependentTypesAreResolved([rawType, rawPointerType, rawConstPointerType], baseClassRawType ? [baseClassRawType] : [], function(base) {
        base = base[0];
        var baseClass;
        var basePrototype;
        if (baseClassRawType) {
          baseClass = base.registeredClass;
          basePrototype = baseClass.instancePrototype;
        } else {
          basePrototype = ClassHandle.prototype;
        }
        var constructor = createNamedFunction(legalFunctionName, function() {
          if (Object.getPrototypeOf(this) !== instancePrototype) {
            throw new BindingError("Use 'new' to construct " + name);
          }
          if (registeredClass.constructor_body === void 0) {
            throw new BindingError(name + " has no accessible constructor");
          }
          var body = registeredClass.constructor_body[arguments.length];
          if (body === void 0) {
            throw new BindingError("Tried to invoke ctor of " + name + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(registeredClass.constructor_body).toString() + ") parameters instead!");
          }
          return body.apply(this, arguments);
        });
        var instancePrototype = Object.create(basePrototype, { constructor: { value: constructor } });
        constructor.prototype = instancePrototype;
        var registeredClass = new RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast);
        var referenceConverter = new RegisteredPointer(name, registeredClass, true, false, false);
        var pointerConverter = new RegisteredPointer(name + "*", registeredClass, false, false, false);
        var constPointerConverter = new RegisteredPointer(name + " const*", registeredClass, false, true, false);
        registeredPointers[rawType] = { pointerType: pointerConverter, constPointerType: constPointerConverter };
        replacePublicSymbol(legalFunctionName, constructor);
        return [referenceConverter, pointerConverter, constPointerConverter];
      });
    }
    function new_(constructor, argumentList) {
      if (!(constructor instanceof Function)) {
        throw new TypeError("new_ called with constructor type " + typeof constructor + " which is not a function");
      }
      var dummy = createNamedFunction(constructor.name || "unknownFunctionName", function() {
      });
      dummy.prototype = constructor.prototype;
      var obj = new dummy();
      var r = constructor.apply(obj, argumentList);
      return r instanceof Object ? r : obj;
    }
    function runDestructors(destructors) {
      while (destructors.length) {
        var ptr = destructors.pop();
        var del = destructors.pop();
        del(ptr);
      }
    }
    function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
      var argCount = argTypes.length;
      if (argCount < 2) {
        throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
      }
      var isClassMethodFunc = argTypes[1] !== null && classType !== null;
      var needsDestructorStack = false;
      for (var i2 = 1; i2 < argTypes.length; ++i2) {
        if (argTypes[i2] !== null && argTypes[i2].destructorFunction === void 0) {
          needsDestructorStack = true;
          break;
        }
      }
      var returns = argTypes[0].name !== "void";
      var argsList = "";
      var argsListWired = "";
      for (var i2 = 0; i2 < argCount - 2; ++i2) {
        argsList += (i2 !== 0 ? ", " : "") + "arg" + i2;
        argsListWired += (i2 !== 0 ? ", " : "") + "arg" + i2 + "Wired";
      }
      var invokerFnBody = "return function " + makeLegalFunctionName(humanName) + "(" + argsList + ") {\nif (arguments.length !== " + (argCount - 2) + ") {\nthrowBindingError('function " + humanName + " called with ' + arguments.length + ' arguments, expected " + (argCount - 2) + " args!');\n}\n";
      if (needsDestructorStack) {
        invokerFnBody += "var destructors = [];\n";
      }
      var dtorStack = needsDestructorStack ? "destructors" : "null";
      var args1 = ["throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"];
      var args2 = [throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];
      if (isClassMethodFunc) {
        invokerFnBody += "var thisWired = classParam.toWireType(" + dtorStack + ", this);\n";
      }
      for (var i2 = 0; i2 < argCount - 2; ++i2) {
        invokerFnBody += "var arg" + i2 + "Wired = argType" + i2 + ".toWireType(" + dtorStack + ", arg" + i2 + "); // " + argTypes[i2 + 2].name + "\n";
        args1.push("argType" + i2);
        args2.push(argTypes[i2 + 2]);
      }
      if (isClassMethodFunc) {
        argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
      }
      invokerFnBody += (returns ? "var rv = " : "") + "invoker(fn" + (argsListWired.length > 0 ? ", " : "") + argsListWired + ");\n";
      if (needsDestructorStack) {
        invokerFnBody += "runDestructors(destructors);\n";
      } else {
        for (var i2 = isClassMethodFunc ? 1 : 2; i2 < argTypes.length; ++i2) {
          var paramName = i2 === 1 ? "thisWired" : "arg" + (i2 - 2) + "Wired";
          if (argTypes[i2].destructorFunction !== null) {
            invokerFnBody += paramName + "_dtor(" + paramName + "); // " + argTypes[i2].name + "\n";
            args1.push(paramName + "_dtor");
            args2.push(argTypes[i2].destructorFunction);
          }
        }
      }
      if (returns) {
        invokerFnBody += "var ret = retType.fromWireType(rv);\nreturn ret;\n";
      }
      invokerFnBody += "}\n";
      args1.push(invokerFnBody);
      var invokerFunction = new_(Function, args1).apply(null, args2);
      return invokerFunction;
    }
    function heap32VectorToArray(count, firstElement) {
      var array = [];
      for (var i2 = 0; i2 < count; i2++) {
        array.push(HEAP32[(firstElement >> 2) + i2]);
      }
      return array;
    }
    function __embind_register_class_class_function(rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, fn) {
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      methodName = readLatin1String(methodName);
      rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
      whenDependentTypesAreResolved([], [rawClassType], function(classType) {
        classType = classType[0];
        var humanName = classType.name + "." + methodName;
        function unboundTypesHandler() {
          throwUnboundTypeError("Cannot call " + humanName + " due to unbound types", rawArgTypes);
        }
        if (methodName.startsWith("@@")) {
          methodName = Symbol[methodName.substring(2)];
        }
        var proto = classType.registeredClass.constructor;
        if (proto[methodName] === void 0) {
          unboundTypesHandler.argCount = argCount - 1;
          proto[methodName] = unboundTypesHandler;
        } else {
          ensureOverloadTable(proto, methodName, humanName);
          proto[methodName].overloadTable[argCount - 1] = unboundTypesHandler;
        }
        whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
          var invokerArgsArray = [argTypes[0], null].concat(argTypes.slice(1));
          var func = craftInvokerFunction(humanName, invokerArgsArray, null, rawInvoker, fn);
          if (proto[methodName].overloadTable === void 0) {
            func.argCount = argCount - 1;
            proto[methodName] = func;
          } else {
            proto[methodName].overloadTable[argCount - 1] = func;
          }
          return [];
        });
        return [];
      });
    }
    function __embind_register_class_constructor(rawClassType, argCount, rawArgTypesAddr, invokerSignature, invoker, rawConstructor) {
      assert(argCount > 0);
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      invoker = embind__requireFunction(invokerSignature, invoker);
      whenDependentTypesAreResolved([], [rawClassType], function(classType) {
        classType = classType[0];
        var humanName = "constructor " + classType.name;
        if (classType.registeredClass.constructor_body === void 0) {
          classType.registeredClass.constructor_body = [];
        }
        if (classType.registeredClass.constructor_body[argCount - 1] !== void 0) {
          throw new BindingError("Cannot register multiple constructors with identical number of parameters (" + (argCount - 1) + ") for class '" + classType.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!");
        }
        classType.registeredClass.constructor_body[argCount - 1] = function unboundTypeHandler() {
          throwUnboundTypeError("Cannot construct " + classType.name + " due to unbound types", rawArgTypes);
        };
        whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
          argTypes.splice(1, 0, null);
          classType.registeredClass.constructor_body[argCount - 1] = craftInvokerFunction(humanName, argTypes, null, invoker, rawConstructor);
          return [];
        });
        return [];
      });
    }
    function __embind_register_class_function(rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, context, isPureVirtual) {
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      methodName = readLatin1String(methodName);
      rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
      whenDependentTypesAreResolved([], [rawClassType], function(classType) {
        classType = classType[0];
        var humanName = classType.name + "." + methodName;
        if (methodName.startsWith("@@")) {
          methodName = Symbol[methodName.substring(2)];
        }
        if (isPureVirtual) {
          classType.registeredClass.pureVirtualFunctions.push(methodName);
        }
        function unboundTypesHandler() {
          throwUnboundTypeError("Cannot call " + humanName + " due to unbound types", rawArgTypes);
        }
        var proto = classType.registeredClass.instancePrototype;
        var method = proto[methodName];
        if (method === void 0 || method.overloadTable === void 0 && method.className !== classType.name && method.argCount === argCount - 2) {
          unboundTypesHandler.argCount = argCount - 2;
          unboundTypesHandler.className = classType.name;
          proto[methodName] = unboundTypesHandler;
        } else {
          ensureOverloadTable(proto, methodName, humanName);
          proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
        }
        whenDependentTypesAreResolved([], rawArgTypes, function(argTypes) {
          var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context);
          if (proto[methodName].overloadTable === void 0) {
            memberFunction.argCount = argCount - 2;
            proto[methodName] = memberFunction;
          } else {
            proto[methodName].overloadTable[argCount - 2] = memberFunction;
          }
          return [];
        });
        return [];
      });
    }
    function validateThis(this_, classType, humanName) {
      if (!(this_ instanceof Object)) {
        throwBindingError(humanName + ' with invalid "this": ' + this_);
      }
      if (!(this_ instanceof classType.registeredClass.constructor)) {
        throwBindingError(humanName + ' incompatible with "this" of type ' + this_.constructor.name);
      }
      if (!this_.$$.ptr) {
        throwBindingError("cannot call emscripten binding method " + humanName + " on deleted object");
      }
      return upcastPointer(this_.$$.ptr, this_.$$.ptrType.registeredClass, classType.registeredClass);
    }
    function __embind_register_class_property(classType, fieldName, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) {
      fieldName = readLatin1String(fieldName);
      getter = embind__requireFunction(getterSignature, getter);
      whenDependentTypesAreResolved([], [classType], function(classType2) {
        classType2 = classType2[0];
        var humanName = classType2.name + "." + fieldName;
        var desc = { get: function() {
          throwUnboundTypeError("Cannot access " + humanName + " due to unbound types", [getterReturnType, setterArgumentType]);
        }, enumerable: true, configurable: true };
        if (setter) {
          desc.set = function() {
            throwUnboundTypeError("Cannot access " + humanName + " due to unbound types", [getterReturnType, setterArgumentType]);
          };
        } else {
          desc.set = function(v) {
            throwBindingError(humanName + " is a read-only property");
          };
        }
        Object.defineProperty(classType2.registeredClass.instancePrototype, fieldName, desc);
        whenDependentTypesAreResolved([], setter ? [getterReturnType, setterArgumentType] : [getterReturnType], function(types) {
          var getterReturnType2 = types[0];
          var desc2 = { get: function() {
            var ptr = validateThis(this, classType2, humanName + " getter");
            return getterReturnType2["fromWireType"](getter(getterContext, ptr));
          }, enumerable: true };
          if (setter) {
            setter = embind__requireFunction(setterSignature, setter);
            var setterArgumentType2 = types[1];
            desc2.set = function(v) {
              var ptr = validateThis(this, classType2, humanName + " setter");
              var destructors = [];
              setter(setterContext, ptr, setterArgumentType2["toWireType"](destructors, v));
              runDestructors(destructors);
            };
          }
          Object.defineProperty(classType2.registeredClass.instancePrototype, fieldName, desc2);
          return [];
        });
        return [];
      });
    }
    var emval_free_list = [];
    var emval_handle_array = [{}, { value: void 0 }, { value: null }, { value: true }, { value: false }];
    function __emval_decref(handle) {
      if (handle > 4 && --emval_handle_array[handle].refcount === 0) {
        emval_handle_array[handle] = void 0;
        emval_free_list.push(handle);
      }
    }
    function count_emval_handles() {
      var count = 0;
      for (var i2 = 5; i2 < emval_handle_array.length; ++i2) {
        if (emval_handle_array[i2] !== void 0) {
          ++count;
        }
      }
      return count;
    }
    function get_first_emval() {
      for (var i2 = 5; i2 < emval_handle_array.length; ++i2) {
        if (emval_handle_array[i2] !== void 0) {
          return emval_handle_array[i2];
        }
      }
      return null;
    }
    function init_emval() {
      Module2["count_emval_handles"] = count_emval_handles;
      Module2["get_first_emval"] = get_first_emval;
    }
    var Emval = { toValue: function(handle) {
      if (!handle) {
        throwBindingError("Cannot use deleted val. handle = " + handle);
      }
      return emval_handle_array[handle].value;
    }, toHandle: function(value) {
      switch (value) {
        case void 0: {
          return 1;
        }
        case null: {
          return 2;
        }
        case true: {
          return 3;
        }
        case false: {
          return 4;
        }
        default: {
          var handle = emval_free_list.length ? emval_free_list.pop() : emval_handle_array.length;
          emval_handle_array[handle] = { refcount: 1, value };
          return handle;
        }
      }
    } };
    function __embind_register_emval(rawType, name) {
      name = readLatin1String(name);
      registerType(rawType, { name, "fromWireType": function(handle) {
        var rv = Emval.toValue(handle);
        __emval_decref(handle);
        return rv;
      }, "toWireType": function(destructors, value) {
        return Emval.toHandle(value);
      }, "argPackAdvance": 8, "readValueFromPointer": simpleReadValueFromPointer, destructorFunction: null });
    }
    function enumReadValueFromPointer(name, shift, signed) {
      switch (shift) {
        case 0:
          return function(pointer) {
            var heap = signed ? HEAP8 : HEAPU8;
            return this["fromWireType"](heap[pointer]);
          };
        case 1:
          return function(pointer) {
            var heap = signed ? HEAP16 : HEAPU16;
            return this["fromWireType"](heap[pointer >> 1]);
          };
        case 2:
          return function(pointer) {
            var heap = signed ? HEAP32 : HEAPU32;
            return this["fromWireType"](heap[pointer >> 2]);
          };
        default:
          throw new TypeError("Unknown integer type: " + name);
      }
    }
    function __embind_register_enum(rawType, name, size, isSigned) {
      var shift = getShiftFromSize(size);
      name = readLatin1String(name);
      function ctor() {
      }
      ctor.values = {};
      registerType(rawType, { name, constructor: ctor, "fromWireType": function(c) {
        return this.constructor.values[c];
      }, "toWireType": function(destructors, c) {
        return c.value;
      }, "argPackAdvance": 8, "readValueFromPointer": enumReadValueFromPointer(name, shift, isSigned), destructorFunction: null });
      exposePublicSymbol(name, ctor);
    }
    function requireRegisteredType(rawType, humanName) {
      var impl = registeredTypes[rawType];
      if (impl === void 0) {
        throwBindingError(humanName + " has unknown type " + getTypeName(rawType));
      }
      return impl;
    }
    function __embind_register_enum_value(rawEnumType, name, enumValue) {
      var enumType = requireRegisteredType(rawEnumType, "enum");
      name = readLatin1String(name);
      var Enum = enumType.constructor;
      var Value = Object.create(enumType.constructor.prototype, { value: { value: enumValue }, constructor: { value: createNamedFunction(enumType.name + "_" + name, function() {
      }) } });
      Enum.values[enumValue] = Value;
      Enum[name] = Value;
    }
    function _embind_repr(v) {
      if (v === null) {
        return "null";
      }
      var t = typeof v;
      if (t === "object" || t === "array" || t === "function") {
        return v.toString();
      } else {
        return "" + v;
      }
    }
    function floatReadValueFromPointer(name, shift) {
      switch (shift) {
        case 2:
          return function(pointer) {
            return this["fromWireType"](HEAPF32[pointer >> 2]);
          };
        case 3:
          return function(pointer) {
            return this["fromWireType"](HEAPF64[pointer >> 3]);
          };
        default:
          throw new TypeError("Unknown float type: " + name);
      }
    }
    function __embind_register_float(rawType, name, size) {
      var shift = getShiftFromSize(size);
      name = readLatin1String(name);
      registerType(rawType, { name, "fromWireType": function(value) {
        return value;
      }, "toWireType": function(destructors, value) {
        return value;
      }, "argPackAdvance": 8, "readValueFromPointer": floatReadValueFromPointer(name, shift), destructorFunction: null });
    }
    function __embind_register_function(name, argCount, rawArgTypesAddr, signature, rawInvoker, fn) {
      var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      name = readLatin1String(name);
      rawInvoker = embind__requireFunction(signature, rawInvoker);
      exposePublicSymbol(name, function() {
        throwUnboundTypeError("Cannot call " + name + " due to unbound types", argTypes);
      }, argCount - 1);
      whenDependentTypesAreResolved([], argTypes, function(argTypes2) {
        var invokerArgsArray = [argTypes2[0], null].concat(argTypes2.slice(1));
        replacePublicSymbol(name, craftInvokerFunction(name, invokerArgsArray, null, rawInvoker, fn), argCount - 1);
        return [];
      });
    }
    function integerReadValueFromPointer(name, shift, signed) {
      switch (shift) {
        case 0:
          return signed ? function readS8FromPointer(pointer) {
            return HEAP8[pointer];
          } : function readU8FromPointer(pointer) {
            return HEAPU8[pointer];
          };
        case 1:
          return signed ? function readS16FromPointer(pointer) {
            return HEAP16[pointer >> 1];
          } : function readU16FromPointer(pointer) {
            return HEAPU16[pointer >> 1];
          };
        case 2:
          return signed ? function readS32FromPointer(pointer) {
            return HEAP32[pointer >> 2];
          } : function readU32FromPointer(pointer) {
            return HEAPU32[pointer >> 2];
          };
        default:
          throw new TypeError("Unknown integer type: " + name);
      }
    }
    function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
      name = readLatin1String(name);
      var shift = getShiftFromSize(size);
      var fromWireType = function(value) {
        return value;
      };
      if (minRange === 0) {
        var bitshift = 32 - 8 * size;
        fromWireType = function(value) {
          return value << bitshift >>> bitshift;
        };
      }
      var isUnsignedType = name.includes("unsigned");
      var checkAssertions = function(value, toTypeName) {
      };
      var toWireType;
      if (isUnsignedType) {
        toWireType = function(destructors, value) {
          checkAssertions(value, this.name);
          return value >>> 0;
        };
      } else {
        toWireType = function(destructors, value) {
          checkAssertions(value, this.name);
          return value;
        };
      }
      registerType(primitiveType, { name, "fromWireType": fromWireType, "toWireType": toWireType, "argPackAdvance": 8, "readValueFromPointer": integerReadValueFromPointer(name, shift, minRange !== 0), destructorFunction: null });
    }
    function __embind_register_memory_view(rawType, dataTypeIndex, name) {
      var typeMapping = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array];
      var TA = typeMapping[dataTypeIndex];
      function decodeMemoryView(handle) {
        handle = handle >> 2;
        var heap = HEAPU32;
        var size = heap[handle];
        var data = heap[handle + 1];
        return new TA(buffer, data, size);
      }
      name = readLatin1String(name);
      registerType(rawType, { name, "fromWireType": decodeMemoryView, "argPackAdvance": 8, "readValueFromPointer": decodeMemoryView }, { ignoreDuplicateRegistrations: true });
    }
    function __embind_register_smart_ptr(rawType, rawPointeeType, name, sharingPolicy, getPointeeSignature, rawGetPointee, constructorSignature, rawConstructor, shareSignature, rawShare, destructorSignature, rawDestructor) {
      name = readLatin1String(name);
      rawGetPointee = embind__requireFunction(getPointeeSignature, rawGetPointee);
      rawConstructor = embind__requireFunction(constructorSignature, rawConstructor);
      rawShare = embind__requireFunction(shareSignature, rawShare);
      rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
      whenDependentTypesAreResolved([rawType], [rawPointeeType], function(pointeeType) {
        pointeeType = pointeeType[0];
        var registeredPointer = new RegisteredPointer(name, pointeeType.registeredClass, false, false, true, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor);
        return [registeredPointer];
      });
    }
    function __embind_register_std_string(rawType, name) {
      name = readLatin1String(name);
      var stdStringIsUTF8 = name === "std::string";
      registerType(rawType, { name, "fromWireType": function(value) {
        var length = HEAPU32[value >> 2];
        var str;
        if (stdStringIsUTF8) {
          var decodeStartPtr = value + 4;
          for (var i2 = 0; i2 <= length; ++i2) {
            var currentBytePtr = value + 4 + i2;
            if (i2 == length || HEAPU8[currentBytePtr] == 0) {
              var maxRead = currentBytePtr - decodeStartPtr;
              var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
              if (str === void 0) {
                str = stringSegment;
              } else {
                str += String.fromCharCode(0);
                str += stringSegment;
              }
              decodeStartPtr = currentBytePtr + 1;
            }
          }
        } else {
          var a = new Array(length);
          for (var i2 = 0; i2 < length; ++i2) {
            a[i2] = String.fromCharCode(HEAPU8[value + 4 + i2]);
          }
          str = a.join("");
        }
        _free(value);
        return str;
      }, "toWireType": function(destructors, value) {
        if (value instanceof ArrayBuffer) {
          value = new Uint8Array(value);
        }
        var getLength;
        var valueIsOfTypeString = typeof value === "string";
        if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
          throwBindingError("Cannot pass non-string to std::string");
        }
        if (stdStringIsUTF8 && valueIsOfTypeString) {
          getLength = function() {
            return lengthBytesUTF8(value);
          };
        } else {
          getLength = function() {
            return value.length;
          };
        }
        var length = getLength();
        var ptr = _malloc(4 + length + 1);
        HEAPU32[ptr >> 2] = length;
        if (stdStringIsUTF8 && valueIsOfTypeString) {
          stringToUTF8(value, ptr + 4, length + 1);
        } else {
          if (valueIsOfTypeString) {
            for (var i2 = 0; i2 < length; ++i2) {
              var charCode = value.charCodeAt(i2);
              if (charCode > 255) {
                _free(ptr);
                throwBindingError("String has UTF-16 code units that do not fit in 8 bits");
              }
              HEAPU8[ptr + 4 + i2] = charCode;
            }
          } else {
            for (var i2 = 0; i2 < length; ++i2) {
              HEAPU8[ptr + 4 + i2] = value[i2];
            }
          }
        }
        if (destructors !== null) {
          destructors.push(_free, ptr);
        }
        return ptr;
      }, "argPackAdvance": 8, "readValueFromPointer": simpleReadValueFromPointer, destructorFunction: function(ptr) {
        _free(ptr);
      } });
    }
    function __embind_register_std_wstring(rawType, charSize, name) {
      name = readLatin1String(name);
      var decodeString, encodeString, getHeap, lengthBytesUTF, shift;
      if (charSize === 2) {
        decodeString = UTF16ToString;
        encodeString = stringToUTF16;
        lengthBytesUTF = lengthBytesUTF16;
        getHeap = function() {
          return HEAPU16;
        };
        shift = 1;
      } else if (charSize === 4) {
        decodeString = UTF32ToString;
        encodeString = stringToUTF32;
        lengthBytesUTF = lengthBytesUTF32;
        getHeap = function() {
          return HEAPU32;
        };
        shift = 2;
      }
      registerType(rawType, { name, "fromWireType": function(value) {
        var length = HEAPU32[value >> 2];
        var HEAP = getHeap();
        var str;
        var decodeStartPtr = value + 4;
        for (var i2 = 0; i2 <= length; ++i2) {
          var currentBytePtr = value + 4 + i2 * charSize;
          if (i2 == length || HEAP[currentBytePtr >> shift] == 0) {
            var maxReadBytes = currentBytePtr - decodeStartPtr;
            var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
            if (str === void 0) {
              str = stringSegment;
            } else {
              str += String.fromCharCode(0);
              str += stringSegment;
            }
            decodeStartPtr = currentBytePtr + charSize;
          }
        }
        _free(value);
        return str;
      }, "toWireType": function(destructors, value) {
        if (!(typeof value === "string")) {
          throwBindingError("Cannot pass non-string to C++ string type " + name);
        }
        var length = lengthBytesUTF(value);
        var ptr = _malloc(4 + length + charSize);
        HEAPU32[ptr >> 2] = length >> shift;
        encodeString(value, ptr + 4, length + charSize);
        if (destructors !== null) {
          destructors.push(_free, ptr);
        }
        return ptr;
      }, "argPackAdvance": 8, "readValueFromPointer": simpleReadValueFromPointer, destructorFunction: function(ptr) {
        _free(ptr);
      } });
    }
    function __embind_register_void(rawType, name) {
      name = readLatin1String(name);
      registerType(rawType, { isVoid: true, name, "argPackAdvance": 0, "fromWireType": function() {
        return void 0;
      }, "toWireType": function(destructors, o) {
        return void 0;
      } });
    }
    function __emval_as(handle, returnType, destructorsRef) {
      handle = Emval.toValue(handle);
      returnType = requireRegisteredType(returnType, "emval::as");
      var destructors = [];
      var rd = Emval.toHandle(destructors);
      HEAP32[destructorsRef >> 2] = rd;
      return returnType["toWireType"](destructors, handle);
    }
    function __emval_lookupTypes(argCount, argTypes) {
      var a = new Array(argCount);
      for (var i2 = 0; i2 < argCount; ++i2) {
        a[i2] = requireRegisteredType(HEAP32[(argTypes >> 2) + i2], "parameter " + i2);
      }
      return a;
    }
    function __emval_call(handle, argCount, argTypes, argv) {
      handle = Emval.toValue(handle);
      var types = __emval_lookupTypes(argCount, argTypes);
      var args = new Array(argCount);
      for (var i2 = 0; i2 < argCount; ++i2) {
        var type = types[i2];
        args[i2] = type["readValueFromPointer"](argv);
        argv += type["argPackAdvance"];
      }
      var rv = handle.apply(void 0, args);
      return Emval.toHandle(rv);
    }
    var emval_symbols = {};
    function getStringOrSymbol(address) {
      var symbol = emval_symbols[address];
      if (symbol === void 0) {
        return readLatin1String(address);
      } else {
        return symbol;
      }
    }
    var emval_methodCallers = [];
    function __emval_call_void_method(caller, handle, methodName, args) {
      caller = emval_methodCallers[caller];
      handle = Emval.toValue(handle);
      methodName = getStringOrSymbol(methodName);
      caller(handle, methodName, null, args);
    }
    function __emval_addMethodCaller(caller) {
      var id2 = emval_methodCallers.length;
      emval_methodCallers.push(caller);
      return id2;
    }
    var emval_registeredMethods = [];
    function __emval_get_method_caller(argCount, argTypes) {
      var types = __emval_lookupTypes(argCount, argTypes);
      var retType = types[0];
      var signatureName = retType.name + "_$" + types.slice(1).map(function(t) {
        return t.name;
      }).join("_") + "$";
      var returnId = emval_registeredMethods[signatureName];
      if (returnId !== void 0) {
        return returnId;
      }
      var params = ["retType"];
      var args = [retType];
      var argsList = "";
      for (var i2 = 0; i2 < argCount - 1; ++i2) {
        argsList += (i2 !== 0 ? ", " : "") + "arg" + i2;
        params.push("argType" + i2);
        args.push(types[1 + i2]);
      }
      var functionName = makeLegalFunctionName("methodCaller_" + signatureName);
      var functionBody = "return function " + functionName + "(handle, name, destructors, args) {\n";
      var offset = 0;
      for (var i2 = 0; i2 < argCount - 1; ++i2) {
        functionBody += "    var arg" + i2 + " = argType" + i2 + ".readValueFromPointer(args" + (offset ? "+" + offset : "") + ");\n";
        offset += types[i2 + 1]["argPackAdvance"];
      }
      functionBody += "    var rv = handle[name](" + argsList + ");\n";
      for (var i2 = 0; i2 < argCount - 1; ++i2) {
        if (types[i2 + 1]["deleteObject"]) {
          functionBody += "    argType" + i2 + ".deleteObject(arg" + i2 + ");\n";
        }
      }
      if (!retType.isVoid) {
        functionBody += "    return retType.toWireType(destructors, rv);\n";
      }
      functionBody += "};\n";
      params.push(functionBody);
      var invokerFunction = new_(Function, params).apply(null, args);
      returnId = __emval_addMethodCaller(invokerFunction);
      emval_registeredMethods[signatureName] = returnId;
      return returnId;
    }
    function __emval_get_module_property(name) {
      name = getStringOrSymbol(name);
      return Emval.toHandle(Module2[name]);
    }
    function __emval_get_property(handle, key) {
      handle = Emval.toValue(handle);
      key = Emval.toValue(key);
      return Emval.toHandle(handle[key]);
    }
    function __emval_incref(handle) {
      if (handle > 4) {
        emval_handle_array[handle].refcount += 1;
      }
    }
    function __emval_is_number(handle) {
      handle = Emval.toValue(handle);
      return typeof handle === "number";
    }
    function __emval_new_cstring(v) {
      return Emval.toHandle(getStringOrSymbol(v));
    }
    function __emval_run_destructors(handle) {
      var destructors = Emval.toValue(handle);
      runDestructors(destructors);
      __emval_decref(handle);
    }
    function __emval_set_property(handle, key, value) {
      handle = Emval.toValue(handle);
      key = Emval.toValue(key);
      value = Emval.toValue(value);
      handle[key] = value;
    }
    function __emval_take_value(type, argv) {
      type = requireRegisteredType(type, "_emval_take_value");
      var v = type["readValueFromPointer"](argv);
      return Emval.toHandle(v);
    }
    function _abort() {
      abort("");
    }
    function _emscripten_set_main_loop_timing(mode, value) {
      Browser.mainLoop.timingMode = mode;
      Browser.mainLoop.timingValue = value;
      if (!Browser.mainLoop.func) {
        return 1;
      }
      if (!Browser.mainLoop.running) {
        Browser.mainLoop.running = true;
      }
      if (mode == 0) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
          var timeUntilNextTick = Math.max(0, Browser.mainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
          setTimeout(Browser.mainLoop.runner, timeUntilNextTick);
        };
        Browser.mainLoop.method = "timeout";
      } else if (mode == 1) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
          Browser.requestAnimationFrame(Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = "rAF";
      } else if (mode == 2) {
        if (typeof setImmediate === "undefined") {
          var setImmediates = [];
          var emscriptenMainLoopMessageId = "setimmediate";
          var Browser_setImmediate_messageHandler = function(event) {
            if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
              event.stopPropagation();
              setImmediates.shift()();
            }
          };
          addEventListener("message", Browser_setImmediate_messageHandler, true);
          setImmediate = function Browser_emulated_setImmediate(func) {
            setImmediates.push(func);
            postMessage(emscriptenMainLoopMessageId, "*");
          };
        }
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
          setImmediate(Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = "immediate";
      }
      return 0;
    }
    function _exit(status) {
      exit(status);
    }
    function maybeExit() {
      if (!keepRuntimeAlive()) {
        try {
          _exit(EXITSTATUS);
        } catch (e) {
          handleException(e);
        }
      }
    }
    function setMainLoop(browserIterationFunc, fps2, simulateInfiniteLoop, arg, noSetTiming) {
      assert(!Browser.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
      Browser.mainLoop.func = browserIterationFunc;
      Browser.mainLoop.arg = arg;
      var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
      function checkIsRunning() {
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) {
          maybeExit();
          return false;
        }
        return true;
      }
      Browser.mainLoop.running = false;
      Browser.mainLoop.runner = function Browser_mainLoop_runner() {
        if (ABORT)
          return;
        if (Browser.mainLoop.queue.length > 0) {
          var start = Date.now();
          var blocker = Browser.mainLoop.queue.shift();
          blocker.func(blocker.arg);
          if (Browser.mainLoop.remainingBlockers) {
            var remaining = Browser.mainLoop.remainingBlockers;
            var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
            if (blocker.counted) {
              Browser.mainLoop.remainingBlockers = next;
            } else {
              next = next + 0.5;
              Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9;
            }
          }
          out('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + " ms");
          Browser.mainLoop.updateStatus();
          if (!checkIsRunning())
            return;
          setTimeout(Browser.mainLoop.runner, 0);
          return;
        }
        if (!checkIsRunning())
          return;
        Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
        if (Browser.mainLoop.timingMode == 1 && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
          Browser.mainLoop.scheduler();
          return;
        } else if (Browser.mainLoop.timingMode == 0) {
          Browser.mainLoop.tickStartTime = _emscripten_get_now();
        }
        Browser.mainLoop.runIter(browserIterationFunc);
        if (!checkIsRunning())
          return;
        if (typeof SDL === "object" && SDL.audio && SDL.audio.queueNewAudioData)
          SDL.audio.queueNewAudioData();
        Browser.mainLoop.scheduler();
      };
      if (!noSetTiming) {
        if (fps2 && fps2 > 0)
          _emscripten_set_main_loop_timing(0, 1e3 / fps2);
        else
          _emscripten_set_main_loop_timing(1, 1);
        Browser.mainLoop.scheduler();
      }
      if (simulateInfiniteLoop) {
        throw "unwind";
      }
    }
    function callUserCallback(func, synchronous) {
      if (runtimeExited || ABORT) {
        return;
      }
      if (synchronous) {
        func();
        return;
      }
      try {
        func();
      } catch (e) {
        handleException(e);
      }
    }
    function safeSetTimeout(func, timeout) {
      return setTimeout(function() {
        callUserCallback(func);
      }, timeout);
    }
    var Browser = { mainLoop: { running: false, scheduler: null, method: "", currentlyRunningMainloop: 0, func: null, arg: 0, timingMode: 0, timingValue: 0, currentFrameNumber: 0, queue: [], pause: function() {
      Browser.mainLoop.scheduler = null;
      Browser.mainLoop.currentlyRunningMainloop++;
    }, resume: function() {
      Browser.mainLoop.currentlyRunningMainloop++;
      var timingMode = Browser.mainLoop.timingMode;
      var timingValue = Browser.mainLoop.timingValue;
      var func = Browser.mainLoop.func;
      Browser.mainLoop.func = null;
      setMainLoop(func, 0, false, Browser.mainLoop.arg, true);
      _emscripten_set_main_loop_timing(timingMode, timingValue);
      Browser.mainLoop.scheduler();
    }, updateStatus: function() {
      if (Module2["setStatus"]) {
        var message = Module2["statusMessage"] || "Please wait...";
        var remaining = Browser.mainLoop.remainingBlockers;
        var expected = Browser.mainLoop.expectedBlockers;
        if (remaining) {
          if (remaining < expected) {
            Module2["setStatus"](message + " (" + (expected - remaining) + "/" + expected + ")");
          } else {
            Module2["setStatus"](message);
          }
        } else {
          Module2["setStatus"]("");
        }
      }
    }, runIter: function(func) {
      if (ABORT)
        return;
      if (Module2["preMainLoop"]) {
        var preRet = Module2["preMainLoop"]();
        if (preRet === false) {
          return;
        }
      }
      callUserCallback(func);
      if (Module2["postMainLoop"])
        Module2["postMainLoop"]();
    } }, isFullscreen: false, pointerLock: false, moduleContextCreatedCallbacks: [], workers: [], init: function() {
      if (!Module2["preloadPlugins"])
        Module2["preloadPlugins"] = [];
      if (Browser.initted)
        return;
      Browser.initted = true;
      try {
        new Blob();
        Browser.hasBlobConstructor = true;
      } catch (e) {
        Browser.hasBlobConstructor = false;
        out("warning: no blob constructor, cannot create blobs with mimetypes");
      }
      Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : !Browser.hasBlobConstructor ? out("warning: no BlobBuilder") : null;
      Browser.URLObject = typeof window != "undefined" ? window.URL ? window.URL : window.webkitURL : void 0;
      if (!Module2.noImageDecoding && typeof Browser.URLObject === "undefined") {
        out("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
        Module2.noImageDecoding = true;
      }
      var imagePlugin = {};
      imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
        return !Module2.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
      };
      imagePlugin["handle"] = function imagePlugin_handle(byteArray, name, onload, onerror) {
        var b = null;
        if (Browser.hasBlobConstructor) {
          try {
            b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            if (b.size !== byteArray.length) {
              b = new Blob([new Uint8Array(byteArray).buffer], { type: Browser.getMimetype(name) });
            }
          } catch (e) {
            warnOnce("Blob constructor present but fails: " + e + "; falling back to blob builder");
          }
        }
        if (!b) {
          var bb = new Browser.BlobBuilder();
          bb.append(new Uint8Array(byteArray).buffer);
          b = bb.getBlob();
        }
        var url = Browser.URLObject.createObjectURL(b);
        var img = new Image();
        img.onload = () => {
          assert(img.complete, "Image " + name + " could not be decoded");
          var canvas2 = document.createElement("canvas");
          canvas2.width = img.width;
          canvas2.height = img.height;
          var ctx = canvas2.getContext("2d");
          ctx.drawImage(img, 0, 0);
          Module2["preloadedImages"][name] = canvas2;
          Browser.URLObject.revokeObjectURL(url);
          if (onload)
            onload(byteArray);
        };
        img.onerror = (event) => {
          out("Image " + url + " could not be decoded");
          if (onerror)
            onerror();
        };
        img.src = url;
      };
      Module2["preloadPlugins"].push(imagePlugin);
      var audioPlugin = {};
      audioPlugin["canHandle"] = function audioPlugin_canHandle(name) {
        return !Module2.noAudioDecoding && name.substr(-4) in { ".ogg": 1, ".wav": 1, ".mp3": 1 };
      };
      audioPlugin["handle"] = function audioPlugin_handle(byteArray, name, onload, onerror) {
        var done = false;
        function finish(audio2) {
          if (done)
            return;
          done = true;
          Module2["preloadedAudios"][name] = audio2;
          if (onload)
            onload(byteArray);
        }
        function fail() {
          if (done)
            return;
          done = true;
          Module2["preloadedAudios"][name] = new Audio();
          if (onerror)
            onerror();
        }
        if (Browser.hasBlobConstructor) {
          try {
            var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
          } catch (e) {
            return fail();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var audio = new Audio();
          audio.addEventListener("canplaythrough", function() {
            finish(audio);
          }, false);
          audio.onerror = function audio_onerror(event) {
            if (done)
              return;
            out("warning: browser could not fully decode audio " + name + ", trying slower base64 approach");
            function encode64(data) {
              var BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
              var PAD = "=";
              var ret = "";
              var leftchar = 0;
              var leftbits = 0;
              for (var i2 = 0; i2 < data.length; i2++) {
                leftchar = leftchar << 8 | data[i2];
                leftbits += 8;
                while (leftbits >= 6) {
                  var curr = leftchar >> leftbits - 6 & 63;
                  leftbits -= 6;
                  ret += BASE[curr];
                }
              }
              if (leftbits == 2) {
                ret += BASE[(leftchar & 3) << 4];
                ret += PAD + PAD;
              } else if (leftbits == 4) {
                ret += BASE[(leftchar & 15) << 2];
                ret += PAD;
              }
              return ret;
            }
            audio.src = "data:audio/x-" + name.substr(-3) + ";base64," + encode64(byteArray);
            finish(audio);
          };
          audio.src = url;
          safeSetTimeout(function() {
            finish(audio);
          }, 1e4);
        } else {
          return fail();
        }
      };
      Module2["preloadPlugins"].push(audioPlugin);
      function pointerLockChange() {
        Browser.pointerLock = document["pointerLockElement"] === Module2["canvas"] || document["mozPointerLockElement"] === Module2["canvas"] || document["webkitPointerLockElement"] === Module2["canvas"] || document["msPointerLockElement"] === Module2["canvas"];
      }
      var canvas = Module2["canvas"];
      if (canvas) {
        canvas.requestPointerLock = canvas["requestPointerLock"] || canvas["mozRequestPointerLock"] || canvas["webkitRequestPointerLock"] || canvas["msRequestPointerLock"] || function() {
        };
        canvas.exitPointerLock = document["exitPointerLock"] || document["mozExitPointerLock"] || document["webkitExitPointerLock"] || document["msExitPointerLock"] || function() {
        };
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        document.addEventListener("pointerlockchange", pointerLockChange, false);
        document.addEventListener("mozpointerlockchange", pointerLockChange, false);
        document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
        document.addEventListener("mspointerlockchange", pointerLockChange, false);
        if (Module2["elementPointerLock"]) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && Module2["canvas"].requestPointerLock) {
              Module2["canvas"].requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      }
    }, createContext: function(canvas, useWebGL, setInModule, webGLContextAttributes) {
      if (useWebGL && Module2.ctx && canvas == Module2.canvas)
        return Module2.ctx;
      var ctx;
      var contextHandle;
      if (useWebGL) {
        var contextAttributes = { antialias: false, alpha: false, majorVersion: typeof WebGL2RenderingContext !== "undefined" ? 2 : 1 };
        if (webGLContextAttributes) {
          for (var attribute in webGLContextAttributes) {
            contextAttributes[attribute] = webGLContextAttributes[attribute];
          }
        }
        if (typeof GL !== "undefined") {
          contextHandle = GL.createContext(canvas, contextAttributes);
          if (contextHandle) {
            ctx = GL.getContext(contextHandle).GLctx;
          }
        }
      } else {
        ctx = canvas.getContext("2d");
      }
      if (!ctx)
        return null;
      if (setInModule) {
        if (!useWebGL)
          assert(typeof GLctx === "undefined", "cannot set in module if GLctx is used, but we are a non-GL context that would replace it");
        Module2.ctx = ctx;
        if (useWebGL)
          GL.makeContextCurrent(contextHandle);
        Module2.useWebGL = useWebGL;
        Browser.moduleContextCreatedCallbacks.forEach(function(callback) {
          callback();
        });
        Browser.init();
      }
      return ctx;
    }, destroyContext: function(canvas, useWebGL, setInModule) {
    }, fullscreenHandlersInstalled: false, lockPointer: void 0, resizeCanvas: void 0, requestFullscreen: function(lockPointer, resizeCanvas) {
      Browser.lockPointer = lockPointer;
      Browser.resizeCanvas = resizeCanvas;
      if (typeof Browser.lockPointer === "undefined")
        Browser.lockPointer = true;
      if (typeof Browser.resizeCanvas === "undefined")
        Browser.resizeCanvas = false;
      var canvas = Module2["canvas"];
      function fullscreenChange() {
        Browser.isFullscreen = false;
        var canvasContainer2 = canvas.parentNode;
        if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer2) {
          canvas.exitFullscreen = Browser.exitFullscreen;
          if (Browser.lockPointer)
            canvas.requestPointerLock();
          Browser.isFullscreen = true;
          if (Browser.resizeCanvas) {
            Browser.setFullscreenCanvasSize();
          } else {
            Browser.updateCanvasDimensions(canvas);
          }
        } else {
          canvasContainer2.parentNode.insertBefore(canvas, canvasContainer2);
          canvasContainer2.parentNode.removeChild(canvasContainer2);
          if (Browser.resizeCanvas) {
            Browser.setWindowedCanvasSize();
          } else {
            Browser.updateCanvasDimensions(canvas);
          }
        }
        if (Module2["onFullScreen"])
          Module2["onFullScreen"](Browser.isFullscreen);
        if (Module2["onFullscreen"])
          Module2["onFullscreen"](Browser.isFullscreen);
      }
      if (!Browser.fullscreenHandlersInstalled) {
        Browser.fullscreenHandlersInstalled = true;
        document.addEventListener("fullscreenchange", fullscreenChange, false);
        document.addEventListener("mozfullscreenchange", fullscreenChange, false);
        document.addEventListener("webkitfullscreenchange", fullscreenChange, false);
        document.addEventListener("MSFullscreenChange", fullscreenChange, false);
      }
      var canvasContainer = document.createElement("div");
      canvas.parentNode.insertBefore(canvasContainer, canvas);
      canvasContainer.appendChild(canvas);
      canvasContainer.requestFullscreen = canvasContainer["requestFullscreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullscreen"] ? function() {
        canvasContainer["webkitRequestFullscreen"](Element["ALLOW_KEYBOARD_INPUT"]);
      } : null) || (canvasContainer["webkitRequestFullScreen"] ? function() {
        canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]);
      } : null);
      canvasContainer.requestFullscreen();
    }, exitFullscreen: function() {
      if (!Browser.isFullscreen) {
        return false;
      }
      var CFS = document["exitFullscreen"] || document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["msExitFullscreen"] || document["webkitCancelFullScreen"] || function() {
      };
      CFS.apply(document, []);
      return true;
    }, nextRAF: 0, fakeRequestAnimationFrame: function(func) {
      var now = Date.now();
      if (Browser.nextRAF === 0) {
        Browser.nextRAF = now + 1e3 / 60;
      } else {
        while (now + 2 >= Browser.nextRAF) {
          Browser.nextRAF += 1e3 / 60;
        }
      }
      var delay = Math.max(Browser.nextRAF - now, 0);
      setTimeout(func, delay);
    }, requestAnimationFrame: function(func) {
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(func);
        return;
      }
      var RAF = Browser.fakeRequestAnimationFrame;
      RAF(func);
    }, safeSetTimeout: function(func) {
      return safeSetTimeout(func);
    }, safeRequestAnimationFrame: function(func) {
      return Browser.requestAnimationFrame(function() {
        callUserCallback(func);
      });
    }, getMimetype: function(name) {
      return { "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "bmp": "image/bmp", "ogg": "audio/ogg", "wav": "audio/wav", "mp3": "audio/mpeg" }[name.substr(name.lastIndexOf(".") + 1)];
    }, getUserMedia: function(func) {
      if (!window.getUserMedia) {
        window.getUserMedia = navigator["getUserMedia"] || navigator["mozGetUserMedia"];
      }
      window.getUserMedia(func);
    }, getMovementX: function(event) {
      return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0;
    }, getMovementY: function(event) {
      return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0;
    }, getMouseWheelDelta: function(event) {
      var delta = 0;
      switch (event.type) {
        case "DOMMouseScroll":
          delta = event.detail / 3;
          break;
        case "mousewheel":
          delta = event.wheelDelta / 120;
          break;
        case "wheel":
          delta = event.deltaY;
          switch (event.deltaMode) {
            case 0:
              delta /= 100;
              break;
            case 1:
              delta /= 3;
              break;
            case 2:
              delta *= 80;
              break;
            default:
              throw "unrecognized mouse wheel delta mode: " + event.deltaMode;
          }
          break;
        default:
          throw "unrecognized mouse wheel event: " + event.type;
      }
      return delta;
    }, mouseX: 0, mouseY: 0, mouseMovementX: 0, mouseMovementY: 0, touches: {}, lastTouches: {}, calculateMouseEvent: function(event) {
      if (Browser.pointerLock) {
        if (event.type != "mousemove" && "mozMovementX" in event) {
          Browser.mouseMovementX = Browser.mouseMovementY = 0;
        } else {
          Browser.mouseMovementX = Browser.getMovementX(event);
          Browser.mouseMovementY = Browser.getMovementY(event);
        }
        if (typeof SDL != "undefined") {
          Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
        } else {
          Browser.mouseX += Browser.mouseMovementX;
          Browser.mouseY += Browser.mouseMovementY;
        }
      } else {
        var rect = Module2["canvas"].getBoundingClientRect();
        var cw = Module2["canvas"].width;
        var ch = Module2["canvas"].height;
        var scrollX = typeof window.scrollX !== "undefined" ? window.scrollX : window.pageXOffset;
        var scrollY = typeof window.scrollY !== "undefined" ? window.scrollY : window.pageYOffset;
        if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
          var touch = event.touch;
          if (touch === void 0) {
            return;
          }
          var adjustedX = touch.pageX - (scrollX + rect.left);
          var adjustedY = touch.pageY - (scrollY + rect.top);
          adjustedX = adjustedX * (cw / rect.width);
          adjustedY = adjustedY * (ch / rect.height);
          var coords = { x: adjustedX, y: adjustedY };
          if (event.type === "touchstart") {
            Browser.lastTouches[touch.identifier] = coords;
            Browser.touches[touch.identifier] = coords;
          } else if (event.type === "touchend" || event.type === "touchmove") {
            var last = Browser.touches[touch.identifier];
            if (!last)
              last = coords;
            Browser.lastTouches[touch.identifier] = last;
            Browser.touches[touch.identifier] = coords;
          }
          return;
        }
        var x = event.pageX - (scrollX + rect.left);
        var y = event.pageY - (scrollY + rect.top);
        x = x * (cw / rect.width);
        y = y * (ch / rect.height);
        Browser.mouseMovementX = x - Browser.mouseX;
        Browser.mouseMovementY = y - Browser.mouseY;
        Browser.mouseX = x;
        Browser.mouseY = y;
      }
    }, resizeListeners: [], updateResizeListeners: function() {
      var canvas = Module2["canvas"];
      Browser.resizeListeners.forEach(function(listener) {
        listener(canvas.width, canvas.height);
      });
    }, setCanvasSize: function(width, height, noUpdates) {
      var canvas = Module2["canvas"];
      Browser.updateCanvasDimensions(canvas, width, height);
      if (!noUpdates)
        Browser.updateResizeListeners();
    }, windowedWidth: 0, windowedHeight: 0, setFullscreenCanvasSize: function() {
      if (typeof SDL != "undefined") {
        var flags = HEAPU32[SDL.screen >> 2];
        flags = flags | 8388608;
        HEAP32[SDL.screen >> 2] = flags;
      }
      Browser.updateCanvasDimensions(Module2["canvas"]);
      Browser.updateResizeListeners();
    }, setWindowedCanvasSize: function() {
      if (typeof SDL != "undefined") {
        var flags = HEAPU32[SDL.screen >> 2];
        flags = flags & ~8388608;
        HEAP32[SDL.screen >> 2] = flags;
      }
      Browser.updateCanvasDimensions(Module2["canvas"]);
      Browser.updateResizeListeners();
    }, updateCanvasDimensions: function(canvas, wNative, hNative) {
      if (wNative && hNative) {
        canvas.widthNative = wNative;
        canvas.heightNative = hNative;
      } else {
        wNative = canvas.widthNative;
        hNative = canvas.heightNative;
      }
      var w = wNative;
      var h = hNative;
      if (Module2["forcedAspectRatio"] && Module2["forcedAspectRatio"] > 0) {
        if (w / h < Module2["forcedAspectRatio"]) {
          w = Math.round(h * Module2["forcedAspectRatio"]);
        } else {
          h = Math.round(w / Module2["forcedAspectRatio"]);
        }
      }
      if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode && typeof screen != "undefined") {
        var factor = Math.min(screen.width / w, screen.height / h);
        w = Math.round(w * factor);
        h = Math.round(h * factor);
      }
      if (Browser.resizeCanvas) {
        if (canvas.width != w)
          canvas.width = w;
        if (canvas.height != h)
          canvas.height = h;
        if (typeof canvas.style != "undefined") {
          canvas.style.removeProperty("width");
          canvas.style.removeProperty("height");
        }
      } else {
        if (canvas.width != wNative)
          canvas.width = wNative;
        if (canvas.height != hNative)
          canvas.height = hNative;
        if (typeof canvas.style != "undefined") {
          if (w != wNative || h != hNative) {
            canvas.style.setProperty("width", w + "px", "important");
            canvas.style.setProperty("height", h + "px", "important");
          } else {
            canvas.style.removeProperty("width");
            canvas.style.removeProperty("height");
          }
        }
      }
    } };
    var AL = { QUEUE_INTERVAL: 25, QUEUE_LOOKAHEAD: 0.1, DEVICE_NAME: "Emscripten OpenAL", CAPTURE_DEVICE_NAME: "Emscripten OpenAL capture", ALC_EXTENSIONS: { ALC_SOFT_pause_device: true, ALC_SOFT_HRTF: true }, AL_EXTENSIONS: { AL_EXT_float32: true, AL_SOFT_loop_points: true, AL_SOFT_source_length: true, AL_EXT_source_distance_model: true, AL_SOFT_source_spatialize: true }, _alcErr: 0, alcErr: 0, deviceRefCounts: {}, alcStringCache: {}, paused: false, stringCache: {}, contexts: {}, currentCtx: null, buffers: { 0: { id: 0, refCount: 0, audioBuf: null, frequency: 0, bytesPerSample: 2, channels: 1, length: 0 } }, paramArray: [], _nextId: 1, newId: function() {
      return AL.freeIds.length > 0 ? AL.freeIds.pop() : AL._nextId++;
    }, freeIds: [], scheduleContextAudio: function(ctx) {
      if (Browser.mainLoop.timingMode === 1 && document["visibilityState"] != "visible") {
        return;
      }
      for (var i2 in ctx.sources) {
        AL.scheduleSourceAudio(ctx.sources[i2]);
      }
    }, scheduleSourceAudio: function(src, lookahead) {
      if (Browser.mainLoop.timingMode === 1 && document["visibilityState"] != "visible") {
        return;
      }
      if (src.state !== 4114) {
        return;
      }
      var currentTime = AL.updateSourceTime(src);
      var startTime = src.bufStartTime;
      var startOffset = src.bufOffset;
      var bufCursor = src.bufsProcessed;
      for (var i2 = 0; i2 < src.audioQueue.length; i2++) {
        var audioSrc = src.audioQueue[i2];
        startTime = audioSrc._startTime + audioSrc._duration;
        startOffset = 0;
        bufCursor += audioSrc._skipCount + 1;
      }
      if (!lookahead) {
        lookahead = AL.QUEUE_LOOKAHEAD;
      }
      var lookaheadTime = currentTime + lookahead;
      var skipCount = 0;
      while (startTime < lookaheadTime) {
        if (bufCursor >= src.bufQueue.length) {
          if (src.looping) {
            bufCursor %= src.bufQueue.length;
          } else {
            break;
          }
        }
        var buf = src.bufQueue[bufCursor % src.bufQueue.length];
        if (buf.length === 0) {
          skipCount++;
          if (skipCount === src.bufQueue.length) {
            break;
          }
        } else {
          var audioSrc = src.context.audioCtx.createBufferSource();
          audioSrc.buffer = buf.audioBuf;
          audioSrc.playbackRate.value = src.playbackRate;
          if (buf.audioBuf._loopStart || buf.audioBuf._loopEnd) {
            audioSrc.loopStart = buf.audioBuf._loopStart;
            audioSrc.loopEnd = buf.audioBuf._loopEnd;
          }
          var duration = 0;
          if (src.type === 4136 && src.looping) {
            duration = Number.POSITIVE_INFINITY;
            audioSrc.loop = true;
            if (buf.audioBuf._loopStart) {
              audioSrc.loopStart = buf.audioBuf._loopStart;
            }
            if (buf.audioBuf._loopEnd) {
              audioSrc.loopEnd = buf.audioBuf._loopEnd;
            }
          } else {
            duration = (buf.audioBuf.duration - startOffset) / src.playbackRate;
          }
          audioSrc._startOffset = startOffset;
          audioSrc._duration = duration;
          audioSrc._skipCount = skipCount;
          skipCount = 0;
          audioSrc.connect(src.gain);
          if (typeof audioSrc.start !== "undefined") {
            startTime = Math.max(startTime, src.context.audioCtx.currentTime);
            audioSrc.start(startTime, startOffset);
          } else if (typeof audioSrc.noteOn !== "undefined") {
            startTime = Math.max(startTime, src.context.audioCtx.currentTime);
            audioSrc.noteOn(startTime);
          }
          audioSrc._startTime = startTime;
          src.audioQueue.push(audioSrc);
          startTime += duration;
        }
        startOffset = 0;
        bufCursor++;
      }
    }, updateSourceTime: function(src) {
      var currentTime = src.context.audioCtx.currentTime;
      if (src.state !== 4114) {
        return currentTime;
      }
      if (!isFinite(src.bufStartTime)) {
        src.bufStartTime = currentTime - src.bufOffset / src.playbackRate;
        src.bufOffset = 0;
      }
      var nextStartTime = 0;
      while (src.audioQueue.length) {
        var audioSrc = src.audioQueue[0];
        src.bufsProcessed += audioSrc._skipCount;
        nextStartTime = audioSrc._startTime + audioSrc._duration;
        if (currentTime < nextStartTime) {
          break;
        }
        src.audioQueue.shift();
        src.bufStartTime = nextStartTime;
        src.bufOffset = 0;
        src.bufsProcessed++;
      }
      if (src.bufsProcessed >= src.bufQueue.length && !src.looping) {
        AL.setSourceState(src, 4116);
      } else if (src.type === 4136 && src.looping) {
        var buf = src.bufQueue[0];
        if (buf.length === 0) {
          src.bufOffset = 0;
        } else {
          var delta = (currentTime - src.bufStartTime) * src.playbackRate;
          var loopStart = buf.audioBuf._loopStart || 0;
          var loopEnd = buf.audioBuf._loopEnd || buf.audioBuf.duration;
          if (loopEnd <= loopStart) {
            loopEnd = buf.audioBuf.duration;
          }
          if (delta < loopEnd) {
            src.bufOffset = delta;
          } else {
            src.bufOffset = loopStart + (delta - loopStart) % (loopEnd - loopStart);
          }
        }
      } else if (src.audioQueue[0]) {
        src.bufOffset = (currentTime - src.audioQueue[0]._startTime) * src.playbackRate;
      } else {
        if (src.type !== 4136 && src.looping) {
          var srcDuration = AL.sourceDuration(src) / src.playbackRate;
          if (srcDuration > 0) {
            src.bufStartTime += Math.floor((currentTime - src.bufStartTime) / srcDuration) * srcDuration;
          }
        }
        for (var i2 = 0; i2 < src.bufQueue.length; i2++) {
          if (src.bufsProcessed >= src.bufQueue.length) {
            if (src.looping) {
              src.bufsProcessed %= src.bufQueue.length;
            } else {
              AL.setSourceState(src, 4116);
              break;
            }
          }
          var buf = src.bufQueue[src.bufsProcessed];
          if (buf.length > 0) {
            nextStartTime = src.bufStartTime + buf.audioBuf.duration / src.playbackRate;
            if (currentTime < nextStartTime) {
              src.bufOffset = (currentTime - src.bufStartTime) * src.playbackRate;
              break;
            }
            src.bufStartTime = nextStartTime;
          }
          src.bufOffset = 0;
          src.bufsProcessed++;
        }
      }
      return currentTime;
    }, cancelPendingSourceAudio: function(src) {
      AL.updateSourceTime(src);
      for (var i2 = 1; i2 < src.audioQueue.length; i2++) {
        var audioSrc = src.audioQueue[i2];
        audioSrc.stop();
      }
      if (src.audioQueue.length > 1) {
        src.audioQueue.length = 1;
      }
    }, stopSourceAudio: function(src) {
      for (var i2 = 0; i2 < src.audioQueue.length; i2++) {
        src.audioQueue[i2].stop();
      }
      src.audioQueue.length = 0;
    }, setSourceState: function(src, state) {
      if (state === 4114) {
        if (src.state === 4114 || src.state == 4116) {
          src.bufsProcessed = 0;
          src.bufOffset = 0;
        }
        AL.stopSourceAudio(src);
        src.state = 4114;
        src.bufStartTime = Number.NEGATIVE_INFINITY;
        AL.scheduleSourceAudio(src);
      } else if (state === 4115) {
        if (src.state === 4114) {
          AL.updateSourceTime(src);
          AL.stopSourceAudio(src);
          src.state = 4115;
        }
      } else if (state === 4116) {
        if (src.state !== 4113) {
          src.state = 4116;
          src.bufsProcessed = src.bufQueue.length;
          src.bufStartTime = Number.NEGATIVE_INFINITY;
          src.bufOffset = 0;
          AL.stopSourceAudio(src);
        }
      } else if (state === 4113) {
        if (src.state !== 4113) {
          src.state = 4113;
          src.bufsProcessed = 0;
          src.bufStartTime = Number.NEGATIVE_INFINITY;
          src.bufOffset = 0;
          AL.stopSourceAudio(src);
        }
      }
    }, initSourcePanner: function(src) {
      if (src.type === 4144) {
        return;
      }
      var templateBuf = AL.buffers[0];
      for (var i2 = 0; i2 < src.bufQueue.length; i2++) {
        if (src.bufQueue[i2].id !== 0) {
          templateBuf = src.bufQueue[i2];
          break;
        }
      }
      if (src.spatialize === 1 || src.spatialize === 2 && templateBuf.channels === 1) {
        if (src.panner) {
          return;
        }
        src.panner = src.context.audioCtx.createPanner();
        AL.updateSourceGlobal(src);
        AL.updateSourceSpace(src);
        src.panner.connect(src.context.gain);
        src.gain.disconnect();
        src.gain.connect(src.panner);
      } else {
        if (!src.panner) {
          return;
        }
        src.panner.disconnect();
        src.gain.disconnect();
        src.gain.connect(src.context.gain);
        src.panner = null;
      }
    }, updateContextGlobal: function(ctx) {
      for (var i2 in ctx.sources) {
        AL.updateSourceGlobal(ctx.sources[i2]);
      }
    }, updateSourceGlobal: function(src) {
      var panner = src.panner;
      if (!panner) {
        return;
      }
      panner.refDistance = src.refDistance;
      panner.maxDistance = src.maxDistance;
      panner.rolloffFactor = src.rolloffFactor;
      panner.panningModel = src.context.hrtf ? "HRTF" : "equalpower";
      var distanceModel = src.context.sourceDistanceModel ? src.distanceModel : src.context.distanceModel;
      switch (distanceModel) {
        case 0:
          panner.distanceModel = "inverse";
          panner.refDistance = 340282e33;
          break;
        case 53249:
        case 53250:
          panner.distanceModel = "inverse";
          break;
        case 53251:
        case 53252:
          panner.distanceModel = "linear";
          break;
        case 53253:
        case 53254:
          panner.distanceModel = "exponential";
          break;
      }
    }, updateListenerSpace: function(ctx) {
      var listener = ctx.audioCtx.listener;
      if (listener.positionX) {
        listener.positionX.value = ctx.listener.position[0];
        listener.positionY.value = ctx.listener.position[1];
        listener.positionZ.value = ctx.listener.position[2];
      } else {
        listener.setPosition(ctx.listener.position[0], ctx.listener.position[1], ctx.listener.position[2]);
      }
      if (listener.forwardX) {
        listener.forwardX.value = ctx.listener.direction[0];
        listener.forwardY.value = ctx.listener.direction[1];
        listener.forwardZ.value = ctx.listener.direction[2];
        listener.upX.value = ctx.listener.up[0];
        listener.upY.value = ctx.listener.up[1];
        listener.upZ.value = ctx.listener.up[2];
      } else {
        listener.setOrientation(ctx.listener.direction[0], ctx.listener.direction[1], ctx.listener.direction[2], ctx.listener.up[0], ctx.listener.up[1], ctx.listener.up[2]);
      }
      for (var i2 in ctx.sources) {
        AL.updateSourceSpace(ctx.sources[i2]);
      }
    }, updateSourceSpace: function(src) {
      if (!src.panner) {
        return;
      }
      var panner = src.panner;
      var posX = src.position[0];
      var posY = src.position[1];
      var posZ = src.position[2];
      var dirX = src.direction[0];
      var dirY = src.direction[1];
      var dirZ = src.direction[2];
      var listener = src.context.listener;
      var lPosX = listener.position[0];
      var lPosY = listener.position[1];
      var lPosZ = listener.position[2];
      if (src.relative) {
        var lBackX = -listener.direction[0];
        var lBackY = -listener.direction[1];
        var lBackZ = -listener.direction[2];
        var lUpX = listener.up[0];
        var lUpY = listener.up[1];
        var lUpZ = listener.up[2];
        var inverseMagnitude = function(x, y, z) {
          var length = Math.sqrt(x * x + y * y + z * z);
          if (length < Number.EPSILON) {
            return 0;
          }
          return 1 / length;
        };
        var invMag = inverseMagnitude(lBackX, lBackY, lBackZ);
        lBackX *= invMag;
        lBackY *= invMag;
        lBackZ *= invMag;
        invMag = inverseMagnitude(lUpX, lUpY, lUpZ);
        lUpX *= invMag;
        lUpY *= invMag;
        lUpZ *= invMag;
        var lRightX = lUpY * lBackZ - lUpZ * lBackY;
        var lRightY = lUpZ * lBackX - lUpX * lBackZ;
        var lRightZ = lUpX * lBackY - lUpY * lBackX;
        invMag = inverseMagnitude(lRightX, lRightY, lRightZ);
        lRightX *= invMag;
        lRightY *= invMag;
        lRightZ *= invMag;
        lUpX = lBackY * lRightZ - lBackZ * lRightY;
        lUpY = lBackZ * lRightX - lBackX * lRightZ;
        lUpZ = lBackX * lRightY - lBackY * lRightX;
        var oldX = dirX;
        var oldY = dirY;
        var oldZ = dirZ;
        dirX = oldX * lRightX + oldY * lUpX + oldZ * lBackX;
        dirY = oldX * lRightY + oldY * lUpY + oldZ * lBackY;
        dirZ = oldX * lRightZ + oldY * lUpZ + oldZ * lBackZ;
        oldX = posX;
        oldY = posY;
        oldZ = posZ;
        posX = oldX * lRightX + oldY * lUpX + oldZ * lBackX;
        posY = oldX * lRightY + oldY * lUpY + oldZ * lBackY;
        posZ = oldX * lRightZ + oldY * lUpZ + oldZ * lBackZ;
        posX += lPosX;
        posY += lPosY;
        posZ += lPosZ;
      }
      if (panner.positionX) {
        panner.positionX.value = posX;
        panner.positionY.value = posY;
        panner.positionZ.value = posZ;
      } else {
        panner.setPosition(posX, posY, posZ);
      }
      if (panner.orientationX) {
        panner.orientationX.value = dirX;
        panner.orientationY.value = dirY;
        panner.orientationZ.value = dirZ;
      } else {
        panner.setOrientation(dirX, dirY, dirZ);
      }
      var oldShift = src.dopplerShift;
      var velX = src.velocity[0];
      var velY = src.velocity[1];
      var velZ = src.velocity[2];
      var lVelX = listener.velocity[0];
      var lVelY = listener.velocity[1];
      var lVelZ = listener.velocity[2];
      if (posX === lPosX && posY === lPosY && posZ === lPosZ || velX === lVelX && velY === lVelY && velZ === lVelZ) {
        src.dopplerShift = 1;
      } else {
        var speedOfSound = src.context.speedOfSound;
        var dopplerFactor = src.context.dopplerFactor;
        var slX = lPosX - posX;
        var slY = lPosY - posY;
        var slZ = lPosZ - posZ;
        var magSl = Math.sqrt(slX * slX + slY * slY + slZ * slZ);
        var vls = (slX * lVelX + slY * lVelY + slZ * lVelZ) / magSl;
        var vss = (slX * velX + slY * velY + slZ * velZ) / magSl;
        vls = Math.min(vls, speedOfSound / dopplerFactor);
        vss = Math.min(vss, speedOfSound / dopplerFactor);
        src.dopplerShift = (speedOfSound - dopplerFactor * vls) / (speedOfSound - dopplerFactor * vss);
      }
      if (src.dopplerShift !== oldShift) {
        AL.updateSourceRate(src);
      }
    }, updateSourceRate: function(src) {
      if (src.state === 4114) {
        AL.cancelPendingSourceAudio(src);
        var audioSrc = src.audioQueue[0];
        if (!audioSrc) {
          return;
        }
        var duration;
        if (src.type === 4136 && src.looping) {
          duration = Number.POSITIVE_INFINITY;
        } else {
          duration = (audioSrc.buffer.duration - audioSrc._startOffset) / src.playbackRate;
        }
        audioSrc._duration = duration;
        audioSrc.playbackRate.value = src.playbackRate;
        AL.scheduleSourceAudio(src);
      }
    }, sourceDuration: function(src) {
      var length = 0;
      for (var i2 = 0; i2 < src.bufQueue.length; i2++) {
        var audioBuf = src.bufQueue[i2].audioBuf;
        length += audioBuf ? audioBuf.duration : 0;
      }
      return length;
    }, sourceTell: function(src) {
      AL.updateSourceTime(src);
      var offset = 0;
      for (var i2 = 0; i2 < src.bufsProcessed; i2++) {
        if (src.bufQueue[i2].audioBuf) {
          offset += src.bufQueue[i2].audioBuf.duration;
        }
      }
      offset += src.bufOffset;
      return offset;
    }, sourceSeek: function(src, offset) {
      var playing = src.state == 4114;
      if (playing) {
        AL.setSourceState(src, 4113);
      }
      if (src.bufQueue[src.bufsProcessed].audioBuf !== null) {
        src.bufsProcessed = 0;
        while (offset > src.bufQueue[src.bufsProcessed].audioBuf.duration) {
          offset -= src.bufQueue[src.bufsProcessed].audiobuf.duration;
          src.bufsProcessed++;
        }
        src.bufOffset = offset;
      }
      if (playing) {
        AL.setSourceState(src, 4114);
      }
    }, getGlobalParam: function(funcname, param) {
      if (!AL.currentCtx) {
        return null;
      }
      switch (param) {
        case 49152:
          return AL.currentCtx.dopplerFactor;
        case 49155:
          return AL.currentCtx.speedOfSound;
        case 53248:
          return AL.currentCtx.distanceModel;
        default:
          AL.currentCtx.err = 40962;
          return null;
      }
    }, setGlobalParam: function(funcname, param, value) {
      if (!AL.currentCtx) {
        return;
      }
      switch (param) {
        case 49152:
          if (!Number.isFinite(value) || value < 0) {
            AL.currentCtx.err = 40963;
            return;
          }
          AL.currentCtx.dopplerFactor = value;
          AL.updateListenerSpace(AL.currentCtx);
          break;
        case 49155:
          if (!Number.isFinite(value) || value <= 0) {
            AL.currentCtx.err = 40963;
            return;
          }
          AL.currentCtx.speedOfSound = value;
          AL.updateListenerSpace(AL.currentCtx);
          break;
        case 53248:
          switch (value) {
            case 0:
            case 53249:
            case 53250:
            case 53251:
            case 53252:
            case 53253:
            case 53254:
              AL.currentCtx.distanceModel = value;
              AL.updateContextGlobal(AL.currentCtx);
              break;
            default:
              AL.currentCtx.err = 40963;
              return;
          }
          break;
        default:
          AL.currentCtx.err = 40962;
          return;
      }
    }, getListenerParam: function(funcname, param) {
      if (!AL.currentCtx) {
        return null;
      }
      switch (param) {
        case 4100:
          return AL.currentCtx.listener.position;
        case 4102:
          return AL.currentCtx.listener.velocity;
        case 4111:
          return AL.currentCtx.listener.direction.concat(AL.currentCtx.listener.up);
        case 4106:
          return AL.currentCtx.gain.gain.value;
        default:
          AL.currentCtx.err = 40962;
          return null;
      }
    }, setListenerParam: function(funcname, param, value) {
      if (!AL.currentCtx) {
        return;
      }
      if (value === null) {
        AL.currentCtx.err = 40962;
        return;
      }
      var listener = AL.currentCtx.listener;
      switch (param) {
        case 4100:
          if (!Number.isFinite(value[0]) || !Number.isFinite(value[1]) || !Number.isFinite(value[2])) {
            AL.currentCtx.err = 40963;
            return;
          }
          listener.position[0] = value[0];
          listener.position[1] = value[1];
          listener.position[2] = value[2];
          AL.updateListenerSpace(AL.currentCtx);
          break;
        case 4102:
          if (!Number.isFinite(value[0]) || !Number.isFinite(value[1]) || !Number.isFinite(value[2])) {
            AL.currentCtx.err = 40963;
            return;
          }
          listener.velocity[0] = value[0];
          listener.velocity[1] = value[1];
          listener.velocity[2] = value[2];
          AL.updateListenerSpace(AL.currentCtx);
          break;
        case 4106:
          if (!Number.isFinite(value) || value < 0) {
            AL.currentCtx.err = 40963;
            return;
          }
          AL.currentCtx.gain.gain.value = value;
          break;
        case 4111:
          if (!Number.isFinite(value[0]) || !Number.isFinite(value[1]) || !Number.isFinite(value[2]) || !Number.isFinite(value[3]) || !Number.isFinite(value[4]) || !Number.isFinite(value[5])) {
            AL.currentCtx.err = 40963;
            return;
          }
          listener.direction[0] = value[0];
          listener.direction[1] = value[1];
          listener.direction[2] = value[2];
          listener.up[0] = value[3];
          listener.up[1] = value[4];
          listener.up[2] = value[5];
          AL.updateListenerSpace(AL.currentCtx);
          break;
        default:
          AL.currentCtx.err = 40962;
          return;
      }
    }, getBufferParam: function(funcname, bufferId, param) {
      if (!AL.currentCtx) {
        return;
      }
      var buf = AL.buffers[bufferId];
      if (!buf || bufferId === 0) {
        AL.currentCtx.err = 40961;
        return;
      }
      switch (param) {
        case 8193:
          return buf.frequency;
        case 8194:
          return buf.bytesPerSample * 8;
        case 8195:
          return buf.channels;
        case 8196:
          return buf.length * buf.bytesPerSample * buf.channels;
        case 8213:
          if (buf.length === 0) {
            return [0, 0];
          } else {
            return [(buf.audioBuf._loopStart || 0) * buf.frequency, (buf.audioBuf._loopEnd || buf.length) * buf.frequency];
          }
        default:
          AL.currentCtx.err = 40962;
          return null;
      }
    }, setBufferParam: function(funcname, bufferId, param, value) {
      if (!AL.currentCtx) {
        return;
      }
      var buf = AL.buffers[bufferId];
      if (!buf || bufferId === 0) {
        AL.currentCtx.err = 40961;
        return;
      }
      if (value === null) {
        AL.currentCtx.err = 40962;
        return;
      }
      switch (param) {
        case 8196:
          if (value !== 0) {
            AL.currentCtx.err = 40963;
            return;
          }
          break;
        case 8213:
          if (value[0] < 0 || value[0] > buf.length || value[1] < 0 || value[1] > buf.Length || value[0] >= value[1]) {
            AL.currentCtx.err = 40963;
            return;
          }
          if (buf.refCount > 0) {
            AL.currentCtx.err = 40964;
            return;
          }
          if (buf.audioBuf) {
            buf.audioBuf._loopStart = value[0] / buf.frequency;
            buf.audioBuf._loopEnd = value[1] / buf.frequency;
          }
          break;
        default:
          AL.currentCtx.err = 40962;
          return;
      }
    }, getSourceParam: function(funcname, sourceId, param) {
      if (!AL.currentCtx) {
        return null;
      }
      var src = AL.currentCtx.sources[sourceId];
      if (!src) {
        AL.currentCtx.err = 40961;
        return null;
      }
      switch (param) {
        case 514:
          return src.relative;
        case 4097:
          return src.coneInnerAngle;
        case 4098:
          return src.coneOuterAngle;
        case 4099:
          return src.pitch;
        case 4100:
          return src.position;
        case 4101:
          return src.direction;
        case 4102:
          return src.velocity;
        case 4103:
          return src.looping;
        case 4105:
          if (src.type === 4136) {
            return src.bufQueue[0].id;
          } else {
            return 0;
          }
        case 4106:
          return src.gain.gain.value;
        case 4109:
          return src.minGain;
        case 4110:
          return src.maxGain;
        case 4112:
          return src.state;
        case 4117:
          if (src.bufQueue.length === 1 && src.bufQueue[0].id === 0) {
            return 0;
          } else {
            return src.bufQueue.length;
          }
        case 4118:
          if (src.bufQueue.length === 1 && src.bufQueue[0].id === 0 || src.looping) {
            return 0;
          } else {
            return src.bufsProcessed;
          }
        case 4128:
          return src.refDistance;
        case 4129:
          return src.rolloffFactor;
        case 4130:
          return src.coneOuterGain;
        case 4131:
          return src.maxDistance;
        case 4132:
          return AL.sourceTell(src);
        case 4133:
          var offset = AL.sourceTell(src);
          if (offset > 0) {
            offset *= src.bufQueue[0].frequency;
          }
          return offset;
        case 4134:
          var offset = AL.sourceTell(src);
          if (offset > 0) {
            offset *= src.bufQueue[0].frequency * src.bufQueue[0].bytesPerSample;
          }
          return offset;
        case 4135:
          return src.type;
        case 4628:
          return src.spatialize;
        case 8201:
          var length = 0;
          var bytesPerFrame = 0;
          for (var i2 = 0; i2 < src.bufQueue.length; i2++) {
            length += src.bufQueue[i2].length;
            if (src.bufQueue[i2].id !== 0) {
              bytesPerFrame = src.bufQueue[i2].bytesPerSample * src.bufQueue[i2].channels;
            }
          }
          return length * bytesPerFrame;
        case 8202:
          var length = 0;
          for (var i2 = 0; i2 < src.bufQueue.length; i2++) {
            length += src.bufQueue[i2].length;
          }
          return length;
        case 8203:
          return AL.sourceDuration(src);
        case 53248:
          return src.distanceModel;
        default:
          AL.currentCtx.err = 40962;
          return null;
      }
    }, setSourceParam: function(funcname, sourceId, param, value) {
      if (!AL.currentCtx) {
        return;
      }
      var src = AL.currentCtx.sources[sourceId];
      if (!src) {
        AL.currentCtx.err = 40961;
        return;
      }
      if (value === null) {
        AL.currentCtx.err = 40962;
        return;
      }
      switch (param) {
        case 514:
          if (value === 1) {
            src.relative = true;
            AL.updateSourceSpace(src);
          } else if (value === 0) {
            src.relative = false;
            AL.updateSourceSpace(src);
          } else {
            AL.currentCtx.err = 40963;
            return;
          }
          break;
        case 4097:
          if (!Number.isFinite(value)) {
            AL.currentCtx.err = 40963;
            return;
          }
          src.coneInnerAngle = value;
          if (src.panner) {
            src.panner.coneInnerAngle = value % 360;
          }
          break;
        case 4098:
          if (!Number.isFinite(value)) {
            AL.currentCtx.err = 40963;
            return;
          }
          src.coneOuterAngle = value;
          if (src.panner) {
            src.panner.coneOuterAngle = value % 360;
          }
          break;
        case 4099:
          if (!Number.isFinite(value) || value <= 0) {
            AL.currentCtx.err = 40963;
            return;
          }
          if (src.pitch === value) {
            break;
          }
          src.pitch = value;
          AL.updateSourceRate(src);
          break;
        case 4100:
          if (!Number.isFinite(value[0]) || !Number.isFinite(value[1]) || !Number.isFinite(value[2])) {
            AL.currentCtx.err = 40963;
            return;
          }
          src.position[0] = value[0];
          src.position[1] = value[1];
          src.position[2] = value[2];
          AL.updateSourceSpace(src);
          break;
        case 4101:
          if (!Number.isFinite(value[0]) || !Number.isFinite(value[1]) || !Number.isFinite(value[2])) {
            AL.currentCtx.err = 40963;
            return;
          }
          src.direction[0] = value[0];
          src.direction[1] = value[1];
          src.direction[2] = value[2];
          AL.updateSourceSpace(src);
          break;
        case 4102:
          if (!Number.isFinite(value[0]) || !Number.isFinite(value[1]) || !Number.isFinite(value[2])) {
            AL.currentCtx.err = 40963;
            return;
          }
          src.velocity[0] = value[0];
          src.velocity[1] = value[1];
          src.velocity[2] = value[2];
          AL.updateSourceSpace(src);
          break;
        case 4103:
          if (value === 1) {
            src.looping = true;
            AL.updateSourceTime(src);
            if (src.type === 4136 && src.audioQueue.length > 0) {
              var audioSrc = src.audioQueue[0];
              audioSrc.loop = true;
              audioSrc._duration = Number.POSITIVE_INFINITY;
            }
          } else if (value === 0) {
            src.looping = false;
            var currentTime = AL.updateSourceTime(src);
            if (src.type === 4136 && src.audioQueue.length > 0) {
              var audioSrc = src.audioQueue[0];
              audioSrc.loop = false;
              audioSrc._duration = src.bufQueue[0].audioBuf.duration / src.playbackRate;
              audioSrc._startTime = currentTime - src.bufOffset / src.playbackRate;
            }
          } else {
            AL.currentCtx.err = 40963;
            return;
          }
          break;
        case 4105:
          if (src.state === 4114 || src.state === 4115) {
            AL.currentCtx.err = 40964;
            return;
          }
          if (value === 0) {
            for (var i2 in src.bufQueue) {
              src.bufQueue[i2].refCount--;
            }
            src.bufQueue.length = 1;
            src.bufQueue[0] = AL.buffers[0];
            src.bufsProcessed = 0;
            src.type = 4144;
          } else {
            var buf = AL.buffers[value];
            if (!buf) {
              AL.currentCtx.err = 40963;
              return;
            }
            for (var i2 in src.bufQueue) {
              src.bufQueue[i2].refCount--;
            }
            src.bufQueue.length = 0;
            buf.refCount++;
            src.bufQueue = [buf];
            src.bufsProcessed = 0;
            src.type = 4136;
          }
          AL.initSourcePanner(src);
          AL.scheduleSourceAudio(src);
          break;
        case 4106:
          if (!Number.isFinite(value) || value < 0) {
            AL.currentCtx.err = 40963;
            return;
          }
          src.gain.gain.value = value;
          break;
        case 4109:
          if (!Number.isFinite(value) || value < 0 || value > Math.min(src.maxGain, 1)) {
            AL.currentCtx.err = 40963;
            return;
          }
          src.minGain = value;
          break;
        case 4110:
          if (!Number.isFinite(value) || value < Math.max(0, src.minGain) || value > 1) {
            AL.currentCtx.err = 40963;
            return;
          }
          src.maxGain = value;
          break;
        case 4128:
          if (!Number.isFinite(value) || value < 0) {
            AL.currentCtx.err = 40963;
            return;
          }
          src.refDistance = value;
          if (src.panner) {
            src.panner.refDistance = value;
          }
          break;
        case 4129:
          if (!Number.isFinite(value) || value < 0) {
            AL.currentCtx.err = 40963;
            return;
          }
          src.rolloffFactor = value;
          if (src.panner) {
            src.panner.rolloffFactor = value;
          }
          break;
        case 4130:
          if (!Number.isFinite(value) || value < 0 || value > 1) {
            AL.currentCtx.err = 40963;
            return;
          }
          src.coneOuterGain = value;
          if (src.panner) {
            src.panner.coneOuterGain = value;
          }
          break;
        case 4131:
          if (!Number.isFinite(value) || value < 0) {
            AL.currentCtx.err = 40963;
            return;
          }
          src.maxDistance = value;
          if (src.panner) {
            src.panner.maxDistance = value;
          }
          break;
        case 4132:
          if (value < 0 || value > AL.sourceDuration(src)) {
            AL.currentCtx.err = 40963;
            return;
          }
          AL.sourceSeek(src, value);
          break;
        case 4133:
          var srcLen = AL.sourceDuration(src);
          if (srcLen > 0) {
            var frequency;
            for (var bufId in src.bufQueue) {
              if (bufId) {
                frequency = src.bufQueue[bufId].frequency;
                break;
              }
            }
            value /= frequency;
          }
          if (value < 0 || value > srcLen) {
            AL.currentCtx.err = 40963;
            return;
          }
          AL.sourceSeek(src, value);
          break;
        case 4134:
          var srcLen = AL.sourceDuration(src);
          if (srcLen > 0) {
            var bytesPerSec;
            for (var bufId in src.bufQueue) {
              if (bufId) {
                var buf = src.bufQueue[bufId];
                bytesPerSec = buf.frequency * buf.bytesPerSample * buf.channels;
                break;
              }
            }
            value /= bytesPerSec;
          }
          if (value < 0 || value > srcLen) {
            AL.currentCtx.err = 40963;
            return;
          }
          AL.sourceSeek(src, value);
          break;
        case 4628:
          if (value !== 0 && value !== 1 && value !== 2) {
            AL.currentCtx.err = 40963;
            return;
          }
          src.spatialize = value;
          AL.initSourcePanner(src);
          break;
        case 8201:
        case 8202:
        case 8203:
          AL.currentCtx.err = 40964;
          break;
        case 53248:
          switch (value) {
            case 0:
            case 53249:
            case 53250:
            case 53251:
            case 53252:
            case 53253:
            case 53254:
              src.distanceModel = value;
              if (AL.currentCtx.sourceDistanceModel) {
                AL.updateContextGlobal(AL.currentCtx);
              }
              break;
            default:
              AL.currentCtx.err = 40963;
              return;
          }
          break;
        default:
          AL.currentCtx.err = 40962;
          return;
      }
    }, captures: {}, sharedCaptureAudioCtx: null, requireValidCaptureDevice: function(deviceId, funcname) {
      if (deviceId === 0) {
        AL.alcErr = 40961;
        return null;
      }
      var c = AL.captures[deviceId];
      if (!c) {
        AL.alcErr = 40961;
        return null;
      }
      var err2 = c.mediaStreamError;
      if (err2) {
        AL.alcErr = 40961;
        return null;
      }
      return c;
    } };
    function _alBufferData(bufferId, format, pData, size, freq) {
      if (!AL.currentCtx) {
        return;
      }
      var buf = AL.buffers[bufferId];
      if (!buf) {
        AL.currentCtx.err = 40963;
        return;
      }
      if (freq <= 0) {
        AL.currentCtx.err = 40963;
        return;
      }
      var audioBuf = null;
      try {
        switch (format) {
          case 4352:
            if (size > 0) {
              audioBuf = AL.currentCtx.audioCtx.createBuffer(1, size, freq);
              var channel0 = audioBuf.getChannelData(0);
              for (var i2 = 0; i2 < size; ++i2) {
                channel0[i2] = HEAPU8[pData++] * 78125e-7 - 1;
              }
            }
            buf.bytesPerSample = 1;
            buf.channels = 1;
            buf.length = size;
            break;
          case 4353:
            if (size > 0) {
              audioBuf = AL.currentCtx.audioCtx.createBuffer(1, size >> 1, freq);
              var channel0 = audioBuf.getChannelData(0);
              pData >>= 1;
              for (var i2 = 0; i2 < size >> 1; ++i2) {
                channel0[i2] = HEAP16[pData++] * 30517578125e-15;
              }
            }
            buf.bytesPerSample = 2;
            buf.channels = 1;
            buf.length = size >> 1;
            break;
          case 4354:
            if (size > 0) {
              audioBuf = AL.currentCtx.audioCtx.createBuffer(2, size >> 1, freq);
              var channel0 = audioBuf.getChannelData(0);
              var channel1 = audioBuf.getChannelData(1);
              for (var i2 = 0; i2 < size >> 1; ++i2) {
                channel0[i2] = HEAPU8[pData++] * 78125e-7 - 1;
                channel1[i2] = HEAPU8[pData++] * 78125e-7 - 1;
              }
            }
            buf.bytesPerSample = 1;
            buf.channels = 2;
            buf.length = size >> 1;
            break;
          case 4355:
            if (size > 0) {
              audioBuf = AL.currentCtx.audioCtx.createBuffer(2, size >> 2, freq);
              var channel0 = audioBuf.getChannelData(0);
              var channel1 = audioBuf.getChannelData(1);
              pData >>= 1;
              for (var i2 = 0; i2 < size >> 2; ++i2) {
                channel0[i2] = HEAP16[pData++] * 30517578125e-15;
                channel1[i2] = HEAP16[pData++] * 30517578125e-15;
              }
            }
            buf.bytesPerSample = 2;
            buf.channels = 2;
            buf.length = size >> 2;
            break;
          case 65552:
            if (size > 0) {
              audioBuf = AL.currentCtx.audioCtx.createBuffer(1, size >> 2, freq);
              var channel0 = audioBuf.getChannelData(0);
              pData >>= 2;
              for (var i2 = 0; i2 < size >> 2; ++i2) {
                channel0[i2] = HEAPF32[pData++];
              }
            }
            buf.bytesPerSample = 4;
            buf.channels = 1;
            buf.length = size >> 2;
            break;
          case 65553:
            if (size > 0) {
              audioBuf = AL.currentCtx.audioCtx.createBuffer(2, size >> 3, freq);
              var channel0 = audioBuf.getChannelData(0);
              var channel1 = audioBuf.getChannelData(1);
              pData >>= 2;
              for (var i2 = 0; i2 < size >> 3; ++i2) {
                channel0[i2] = HEAPF32[pData++];
                channel1[i2] = HEAPF32[pData++];
              }
            }
            buf.bytesPerSample = 4;
            buf.channels = 2;
            buf.length = size >> 3;
            break;
          default:
            AL.currentCtx.err = 40963;
            return;
        }
        buf.frequency = freq;
        buf.audioBuf = audioBuf;
      } catch (e) {
        AL.currentCtx.err = 40963;
        return;
      }
    }
    function _alDeleteBuffers(count, pBufferIds) {
      if (!AL.currentCtx) {
        return;
      }
      for (var i2 = 0; i2 < count; ++i2) {
        var bufId = HEAP32[pBufferIds + i2 * 4 >> 2];
        if (bufId === 0) {
          continue;
        }
        if (!AL.buffers[bufId]) {
          AL.currentCtx.err = 40961;
          return;
        }
        if (AL.buffers[bufId].refCount) {
          AL.currentCtx.err = 40964;
          return;
        }
      }
      for (var i2 = 0; i2 < count; ++i2) {
        var bufId = HEAP32[pBufferIds + i2 * 4 >> 2];
        if (bufId === 0) {
          continue;
        }
        AL.deviceRefCounts[AL.buffers[bufId].deviceId]--;
        delete AL.buffers[bufId];
        AL.freeIds.push(bufId);
      }
    }
    function _alSourcei(sourceId, param, value) {
      switch (param) {
        case 514:
        case 4097:
        case 4098:
        case 4103:
        case 4105:
        case 4128:
        case 4129:
        case 4131:
        case 4132:
        case 4133:
        case 4134:
        case 4628:
        case 8201:
        case 8202:
        case 53248:
          AL.setSourceParam("alSourcei", sourceId, param, value);
          break;
        default:
          AL.setSourceParam("alSourcei", sourceId, param, null);
          break;
      }
    }
    function _alDeleteSources(count, pSourceIds) {
      if (!AL.currentCtx) {
        return;
      }
      for (var i2 = 0; i2 < count; ++i2) {
        var srcId = HEAP32[pSourceIds + i2 * 4 >> 2];
        if (!AL.currentCtx.sources[srcId]) {
          AL.currentCtx.err = 40961;
          return;
        }
      }
      for (var i2 = 0; i2 < count; ++i2) {
        var srcId = HEAP32[pSourceIds + i2 * 4 >> 2];
        AL.setSourceState(AL.currentCtx.sources[srcId], 4116);
        _alSourcei(srcId, 4105, 0);
        delete AL.currentCtx.sources[srcId];
        AL.freeIds.push(srcId);
      }
    }
    function _alGenBuffers(count, pBufferIds) {
      if (!AL.currentCtx) {
        return;
      }
      for (var i2 = 0; i2 < count; ++i2) {
        var buf = { deviceId: AL.currentCtx.deviceId, id: AL.newId(), refCount: 0, audioBuf: null, frequency: 0, bytesPerSample: 2, channels: 1, length: 0 };
        AL.deviceRefCounts[buf.deviceId]++;
        AL.buffers[buf.id] = buf;
        HEAP32[pBufferIds + i2 * 4 >> 2] = buf.id;
      }
    }
    function _alGenSources(count, pSourceIds) {
      if (!AL.currentCtx) {
        return;
      }
      for (var i2 = 0; i2 < count; ++i2) {
        var gain = AL.currentCtx.audioCtx.createGain();
        gain.connect(AL.currentCtx.gain);
        var src = { context: AL.currentCtx, id: AL.newId(), type: 4144, state: 4113, bufQueue: [AL.buffers[0]], audioQueue: [], looping: false, pitch: 1, dopplerShift: 1, gain, minGain: 0, maxGain: 1, panner: null, bufsProcessed: 0, bufStartTime: Number.NEGATIVE_INFINITY, bufOffset: 0, relative: false, refDistance: 1, maxDistance: 340282e33, rolloffFactor: 1, position: [0, 0, 0], velocity: [0, 0, 0], direction: [0, 0, 0], coneOuterGain: 0, coneInnerAngle: 360, coneOuterAngle: 360, distanceModel: 53250, spatialize: 2, get playbackRate() {
          return this.pitch * this.dopplerShift;
        } };
        AL.currentCtx.sources[src.id] = src;
        HEAP32[pSourceIds + i2 * 4 >> 2] = src.id;
      }
    }
    function _alGetError() {
      if (!AL.currentCtx) {
        return 40964;
      } else {
        var err2 = AL.currentCtx.err;
        AL.currentCtx.err = 0;
        return err2;
      }
    }
    function _alGetSourcei(sourceId, param, pValue) {
      var val = AL.getSourceParam("alGetSourcei", sourceId, param);
      if (val === null) {
        return;
      }
      if (!pValue) {
        AL.currentCtx.err = 40963;
        return;
      }
      switch (param) {
        case 514:
        case 4097:
        case 4098:
        case 4103:
        case 4105:
        case 4112:
        case 4117:
        case 4118:
        case 4128:
        case 4129:
        case 4131:
        case 4132:
        case 4133:
        case 4134:
        case 4135:
        case 4628:
        case 8201:
        case 8202:
        case 53248:
          HEAP32[pValue >> 2] = val;
          break;
        default:
          AL.currentCtx.err = 40962;
          return;
      }
    }
    function _alGetString(param) {
      if (!AL.currentCtx) {
        return 0;
      }
      if (AL.stringCache[param]) {
        return AL.stringCache[param];
      }
      var ret;
      switch (param) {
        case 0:
          ret = "No Error";
          break;
        case 40961:
          ret = "Invalid Name";
          break;
        case 40962:
          ret = "Invalid Enum";
          break;
        case 40963:
          ret = "Invalid Value";
          break;
        case 40964:
          ret = "Invalid Operation";
          break;
        case 40965:
          ret = "Out of Memory";
          break;
        case 45057:
          ret = "Emscripten";
          break;
        case 45058:
          ret = "1.1";
          break;
        case 45059:
          ret = "WebAudio";
          break;
        case 45060:
          ret = "";
          for (var ext in AL.AL_EXTENSIONS) {
            ret = ret.concat(ext);
            ret = ret.concat(" ");
          }
          ret = ret.trim();
          break;
        default:
          AL.currentCtx.err = 40962;
          return 0;
      }
      ret = allocate(intArrayFromString(ret), ALLOC_NORMAL);
      AL.stringCache[param] = ret;
      return ret;
    }
    function _alSourcePause(sourceId) {
      if (!AL.currentCtx) {
        return;
      }
      var src = AL.currentCtx.sources[sourceId];
      if (!src) {
        AL.currentCtx.err = 40961;
        return;
      }
      AL.setSourceState(src, 4115);
    }
    function _alSourcePlay(sourceId) {
      if (!AL.currentCtx) {
        return;
      }
      var src = AL.currentCtx.sources[sourceId];
      if (!src) {
        AL.currentCtx.err = 40961;
        return;
      }
      AL.setSourceState(src, 4114);
    }
    function _alSourceStop(sourceId) {
      if (!AL.currentCtx) {
        return;
      }
      var src = AL.currentCtx.sources[sourceId];
      if (!src) {
        AL.currentCtx.err = 40961;
        return;
      }
      AL.setSourceState(src, 4116);
    }
    function _alSourcef(sourceId, param, value) {
      switch (param) {
        case 4097:
        case 4098:
        case 4099:
        case 4106:
        case 4109:
        case 4110:
        case 4128:
        case 4129:
        case 4130:
        case 4131:
        case 4132:
        case 4133:
        case 4134:
        case 8203:
          AL.setSourceParam("alSourcef", sourceId, param, value);
          break;
        default:
          AL.setSourceParam("alSourcef", sourceId, param, null);
          break;
      }
    }
    function _alcCloseDevice(deviceId) {
      if (!(deviceId in AL.deviceRefCounts) || AL.deviceRefCounts[deviceId] > 0) {
        return 0;
      }
      delete AL.deviceRefCounts[deviceId];
      AL.freeIds.push(deviceId);
      return 1;
    }
    function listenOnce(object, event, func) {
      object.addEventListener(event, func, { "once": true });
    }
    function autoResumeAudioContext(ctx, elements) {
      if (!elements) {
        elements = [document, document.getElementById("canvas")];
      }
      ["keydown", "mousedown", "touchstart"].forEach(function(event) {
        elements.forEach(function(element) {
          if (element) {
            listenOnce(element, event, function() {
              if (ctx.state === "suspended")
                ctx.resume();
            });
          }
        });
      });
    }
    function _alcCreateContext(deviceId, pAttrList) {
      if (!(deviceId in AL.deviceRefCounts)) {
        AL.alcErr = 40961;
        return 0;
      }
      var options = null;
      var attrs = [];
      var hrtf = null;
      pAttrList >>= 2;
      if (pAttrList) {
        var attr = 0;
        var val = 0;
        while (true) {
          attr = HEAP32[pAttrList++];
          attrs.push(attr);
          if (attr === 0) {
            break;
          }
          val = HEAP32[pAttrList++];
          attrs.push(val);
          switch (attr) {
            case 4103:
              if (!options) {
                options = {};
              }
              options.sampleRate = val;
              break;
            case 4112:
            case 4113:
              break;
            case 6546:
              switch (val) {
                case 0:
                  hrtf = false;
                  break;
                case 1:
                  hrtf = true;
                  break;
                case 2:
                  break;
                default:
                  AL.alcErr = 40964;
                  return 0;
              }
              break;
            case 6550:
              if (val !== 0) {
                AL.alcErr = 40964;
                return 0;
              }
              break;
            default:
              AL.alcErr = 40964;
              return 0;
          }
        }
      }
      var AudioContext2 = window.AudioContext || window.webkitAudioContext;
      var ac = null;
      try {
        if (options) {
          ac = new AudioContext2(options);
        } else {
          ac = new AudioContext2();
        }
      } catch (e) {
        if (e.name === "NotSupportedError") {
          AL.alcErr = 40964;
        } else {
          AL.alcErr = 40961;
        }
        return 0;
      }
      autoResumeAudioContext(ac);
      if (typeof ac.createGain === "undefined") {
        ac.createGain = ac.createGainNode;
      }
      var gain = ac.createGain();
      gain.connect(ac.destination);
      var ctx = { deviceId, id: AL.newId(), attrs, audioCtx: ac, listener: { position: [0, 0, 0], velocity: [0, 0, 0], direction: [0, 0, 0], up: [0, 0, 0] }, sources: [], interval: setInterval(function() {
        AL.scheduleContextAudio(ctx);
      }, AL.QUEUE_INTERVAL), gain, distanceModel: 53250, speedOfSound: 343.3, dopplerFactor: 1, sourceDistanceModel: false, hrtf: hrtf || false, _err: 0, get err() {
        return this._err;
      }, set err(val2) {
        if (this._err === 0 || val2 === 0) {
          this._err = val2;
        }
      } };
      AL.deviceRefCounts[deviceId]++;
      AL.contexts[ctx.id] = ctx;
      if (hrtf !== null) {
        for (var ctxId in AL.contexts) {
          var c = AL.contexts[ctxId];
          if (c.deviceId === deviceId) {
            c.hrtf = hrtf;
            AL.updateContextGlobal(c);
          }
        }
      }
      return ctx.id;
    }
    function _alcDestroyContext(contextId) {
      var ctx = AL.contexts[contextId];
      if (AL.currentCtx === ctx) {
        AL.alcErr = 40962;
        return;
      }
      if (AL.contexts[contextId].interval) {
        clearInterval(AL.contexts[contextId].interval);
      }
      AL.deviceRefCounts[ctx.deviceId]--;
      delete AL.contexts[contextId];
      AL.freeIds.push(contextId);
    }
    function _alcGetError(deviceId) {
      var err2 = AL.alcErr;
      AL.alcErr = 0;
      return err2;
    }
    function _alcGetString(deviceId, param) {
      if (AL.alcStringCache[param]) {
        return AL.alcStringCache[param];
      }
      var ret;
      switch (param) {
        case 0:
          ret = "No Error";
          break;
        case 40961:
          ret = "Invalid Device";
          break;
        case 40962:
          ret = "Invalid Context";
          break;
        case 40963:
          ret = "Invalid Enum";
          break;
        case 40964:
          ret = "Invalid Value";
          break;
        case 40965:
          ret = "Out of Memory";
          break;
        case 4100:
          if (typeof AudioContext !== "undefined" || typeof webkitAudioContext !== "undefined") {
            ret = AL.DEVICE_NAME;
          } else {
            return 0;
          }
          break;
        case 4101:
          if (typeof AudioContext !== "undefined" || typeof webkitAudioContext !== "undefined") {
            ret = AL.DEVICE_NAME.concat("\0");
          } else {
            ret = "\0";
          }
          break;
        case 785:
          ret = AL.CAPTURE_DEVICE_NAME;
          break;
        case 784:
          if (deviceId === 0)
            ret = AL.CAPTURE_DEVICE_NAME.concat("\0");
          else {
            var c = AL.requireValidCaptureDevice(deviceId, "alcGetString");
            if (!c) {
              return 0;
            }
            ret = c.deviceName;
          }
          break;
        case 4102:
          if (!deviceId) {
            AL.alcErr = 40961;
            return 0;
          }
          ret = "";
          for (var ext in AL.ALC_EXTENSIONS) {
            ret = ret.concat(ext);
            ret = ret.concat(" ");
          }
          ret = ret.trim();
          break;
        default:
          AL.alcErr = 40963;
          return 0;
      }
      ret = allocate(intArrayFromString(ret), ALLOC_NORMAL);
      AL.alcStringCache[param] = ret;
      return ret;
    }
    function _alcMakeContextCurrent(contextId) {
      if (contextId === 0) {
        AL.currentCtx = null;
        return 0;
      } else {
        AL.currentCtx = AL.contexts[contextId];
        return 1;
      }
    }
    function _alcOpenDevice(pDeviceName) {
      if (pDeviceName) {
        var name = UTF8ToString(pDeviceName);
        if (name !== AL.DEVICE_NAME) {
          return 0;
        }
      }
      if (typeof AudioContext !== "undefined" || typeof webkitAudioContext !== "undefined") {
        var deviceId = AL.newId();
        AL.deviceRefCounts[deviceId] = 0;
        return deviceId;
      } else {
        return 0;
      }
    }
    function _emscripten_get_heap_max() {
      return 2147483648;
    }
    function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.copyWithin(dest, src, src + num);
    }
    function emscripten_realloc_buffer(size) {
      try {
        wasmMemory.grow(size - buffer.byteLength + 65535 >>> 16);
        updateGlobalBufferAndViews(wasmMemory.buffer);
        return 1;
      } catch (e) {
      }
    }
    function _emscripten_resize_heap(requestedSize) {
      var oldSize = HEAPU8.length;
      requestedSize = requestedSize >>> 0;
      var maxHeapSize = 2147483648;
      if (requestedSize > maxHeapSize) {
        return false;
      }
      for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown);
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
        var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
        var replacement = emscripten_realloc_buffer(newSize);
        if (replacement) {
          return true;
        }
      }
      return false;
    }
    var ENV = {};
    function getExecutableName() {
      return thisProgram || "./this.program";
    }
    function getEnvStrings() {
      if (!getEnvStrings.strings) {
        var lang = (typeof navigator === "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8";
        var env = { "USER": "web_user", "LOGNAME": "web_user", "PATH": "/", "PWD": "/", "HOME": "/home/web_user", "LANG": lang, "_": getExecutableName() };
        for (var x in ENV) {
          if (ENV[x] === void 0)
            delete env[x];
          else
            env[x] = ENV[x];
        }
        var strings = [];
        for (var x in env) {
          strings.push(x + "=" + env[x]);
        }
        getEnvStrings.strings = strings;
      }
      return getEnvStrings.strings;
    }
    function _environ_get(__environ, environ_buf) {
      var bufSize = 0;
      getEnvStrings().forEach(function(string, i2) {
        var ptr = environ_buf + bufSize;
        HEAP32[__environ + i2 * 4 >> 2] = ptr;
        writeAsciiToMemory(string, ptr);
        bufSize += string.length + 1;
      });
      return 0;
    }
    function _environ_sizes_get(penviron_count, penviron_buf_size) {
      var strings = getEnvStrings();
      HEAP32[penviron_count >> 2] = strings.length;
      var bufSize = 0;
      strings.forEach(function(string) {
        bufSize += string.length + 1;
      });
      HEAP32[penviron_buf_size >> 2] = bufSize;
      return 0;
    }
    function _fd_close(fd) {
      try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        FS.close(stream);
        return 0;
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          throw e;
        return e.errno;
      }
    }
    function _fd_read(fd, iov, iovcnt, pnum) {
      try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = SYSCALLS.doReadv(stream, iov, iovcnt);
        HEAP32[pnum >> 2] = num;
        return 0;
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          throw e;
        return e.errno;
      }
    }
    function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
      try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var HIGH_OFFSET = 4294967296;
        var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
        var DOUBLE_LIMIT = 9007199254740992;
        if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
          return -61;
        }
        FS.llseek(stream, offset, whence);
        tempI64 = [stream.position >>> 0, (tempDouble = stream.position, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[newOffset >> 2] = tempI64[0], HEAP32[newOffset + 4 >> 2] = tempI64[1];
        if (stream.getdents && offset === 0 && whence === 0)
          stream.getdents = null;
        return 0;
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          throw e;
        return e.errno;
      }
    }
    function _fd_write(fd, iov, iovcnt, pnum) {
      try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = SYSCALLS.doWritev(stream, iov, iovcnt);
        HEAP32[pnum >> 2] = num;
        return 0;
      } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError))
          throw e;
        return e.errno;
      }
    }
    function _getentropy(buffer2, size) {
      if (!_getentropy.randomDevice) {
        _getentropy.randomDevice = getRandomDevice();
      }
      for (var i2 = 0; i2 < size; i2++) {
        HEAP8[buffer2 + i2 >> 0] = _getentropy.randomDevice();
      }
      return 0;
    }
    function _gettimeofday(ptr) {
      var now = Date.now();
      HEAP32[ptr >> 2] = now / 1e3 | 0;
      HEAP32[ptr + 4 >> 2] = now % 1e3 * 1e3 | 0;
      return 0;
    }
    function __webgl_enable_ANGLE_instanced_arrays(ctx) {
      var ext = ctx.getExtension("ANGLE_instanced_arrays");
      if (ext) {
        ctx["vertexAttribDivisor"] = function(index, divisor) {
          ext["vertexAttribDivisorANGLE"](index, divisor);
        };
        ctx["drawArraysInstanced"] = function(mode, first, count, primcount) {
          ext["drawArraysInstancedANGLE"](mode, first, count, primcount);
        };
        ctx["drawElementsInstanced"] = function(mode, count, type, indices, primcount) {
          ext["drawElementsInstancedANGLE"](mode, count, type, indices, primcount);
        };
        return 1;
      }
    }
    function __webgl_enable_OES_vertex_array_object(ctx) {
      var ext = ctx.getExtension("OES_vertex_array_object");
      if (ext) {
        ctx["createVertexArray"] = function() {
          return ext["createVertexArrayOES"]();
        };
        ctx["deleteVertexArray"] = function(vao) {
          ext["deleteVertexArrayOES"](vao);
        };
        ctx["bindVertexArray"] = function(vao) {
          ext["bindVertexArrayOES"](vao);
        };
        ctx["isVertexArray"] = function(vao) {
          return ext["isVertexArrayOES"](vao);
        };
        return 1;
      }
    }
    function __webgl_enable_WEBGL_draw_buffers(ctx) {
      var ext = ctx.getExtension("WEBGL_draw_buffers");
      if (ext) {
        ctx["drawBuffers"] = function(n, bufs) {
          ext["drawBuffersWEBGL"](n, bufs);
        };
        return 1;
      }
    }
    function __webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance(ctx) {
      return !!(ctx.dibvbi = ctx.getExtension("WEBGL_draw_instanced_base_vertex_base_instance"));
    }
    function __webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance(ctx) {
      return !!(ctx.mdibvbi = ctx.getExtension("WEBGL_multi_draw_instanced_base_vertex_base_instance"));
    }
    function __webgl_enable_WEBGL_multi_draw(ctx) {
      return !!(ctx.multiDrawWebgl = ctx.getExtension("WEBGL_multi_draw"));
    }
    var GL = { counter: 1, buffers: [], programs: [], framebuffers: [], renderbuffers: [], textures: [], shaders: [], vaos: [], contexts: [], offscreenCanvases: {}, queries: [], samplers: [], transformFeedbacks: [], syncs: [], stringCache: {}, stringiCache: {}, unpackAlignment: 4, recordError: function recordError(errorCode) {
      if (!GL.lastError) {
        GL.lastError = errorCode;
      }
    }, getNewId: function(table) {
      var ret = GL.counter++;
      for (var i2 = table.length; i2 < ret; i2++) {
        table[i2] = null;
      }
      return ret;
    }, getSource: function(shader, count, string, length) {
      var source = "";
      for (var i2 = 0; i2 < count; ++i2) {
        var len = length ? HEAP32[length + i2 * 4 >> 2] : -1;
        source += UTF8ToString(HEAP32[string + i2 * 4 >> 2], len < 0 ? void 0 : len);
      }
      return source;
    }, createContext: function(canvas, webGLContextAttributes) {
      if (!canvas.getContextSafariWebGL2Fixed) {
        canvas.getContextSafariWebGL2Fixed = canvas.getContext;
        canvas.getContext = function(ver, attrs) {
          var gl = canvas.getContextSafariWebGL2Fixed(ver, attrs);
          return ver == "webgl" == gl instanceof WebGLRenderingContext ? gl : null;
        };
      }
      var ctx = webGLContextAttributes.majorVersion > 1 ? canvas.getContext("webgl2", webGLContextAttributes) : canvas.getContext("webgl", webGLContextAttributes);
      if (!ctx)
        return 0;
      var handle = GL.registerContext(ctx, webGLContextAttributes);
      return handle;
    }, registerContext: function(ctx, webGLContextAttributes) {
      var handle = GL.getNewId(GL.contexts);
      var context = { handle, attributes: webGLContextAttributes, version: webGLContextAttributes.majorVersion, GLctx: ctx };
      if (ctx.canvas)
        ctx.canvas.GLctxObject = context;
      GL.contexts[handle] = context;
      if (typeof webGLContextAttributes.enableExtensionsByDefault === "undefined" || webGLContextAttributes.enableExtensionsByDefault) {
        GL.initExtensions(context);
      }
      return handle;
    }, makeContextCurrent: function(contextHandle) {
      GL.currentContext = GL.contexts[contextHandle];
      Module2.ctx = GLctx = GL.currentContext && GL.currentContext.GLctx;
      return !(contextHandle && !GLctx);
    }, getContext: function(contextHandle) {
      return GL.contexts[contextHandle];
    }, deleteContext: function(contextHandle) {
      if (GL.currentContext === GL.contexts[contextHandle])
        GL.currentContext = null;
      if (typeof JSEvents === "object")
        JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
      if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas)
        GL.contexts[contextHandle].GLctx.canvas.GLctxObject = void 0;
      GL.contexts[contextHandle] = null;
    }, initExtensions: function(context) {
      if (!context)
        context = GL.currentContext;
      if (context.initExtensionsDone)
        return;
      context.initExtensionsDone = true;
      var GLctx2 = context.GLctx;
      __webgl_enable_ANGLE_instanced_arrays(GLctx2);
      __webgl_enable_OES_vertex_array_object(GLctx2);
      __webgl_enable_WEBGL_draw_buffers(GLctx2);
      __webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance(GLctx2);
      __webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance(GLctx2);
      if (context.version >= 2) {
        GLctx2.disjointTimerQueryExt = GLctx2.getExtension("EXT_disjoint_timer_query_webgl2");
      }
      if (context.version < 2 || !GLctx2.disjointTimerQueryExt) {
        GLctx2.disjointTimerQueryExt = GLctx2.getExtension("EXT_disjoint_timer_query");
      }
      __webgl_enable_WEBGL_multi_draw(GLctx2);
      var exts = GLctx2.getSupportedExtensions() || [];
      exts.forEach(function(ext) {
        if (!ext.includes("lose_context") && !ext.includes("debug")) {
          GLctx2.getExtension(ext);
        }
      });
    } };
    function _glActiveTexture(x0) {
      GLctx["activeTexture"](x0);
    }
    function _glAttachShader(program, shader) {
      GLctx.attachShader(GL.programs[program], GL.shaders[shader]);
    }
    function _glBindAttribLocation(program, index, name) {
      GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name));
    }
    function _glBindBuffer(target, buffer2) {
      if (target == 35051) {
        GLctx.currentPixelPackBufferBinding = buffer2;
      } else if (target == 35052) {
        GLctx.currentPixelUnpackBufferBinding = buffer2;
      }
      GLctx.bindBuffer(target, GL.buffers[buffer2]);
    }
    function _glBindBufferRange(target, index, buffer2, offset, ptrsize) {
      GLctx["bindBufferRange"](target, index, GL.buffers[buffer2], offset, ptrsize);
    }
    function _glBindFramebuffer(target, framebuffer) {
      GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer]);
    }
    function _glBindRenderbuffer(target, renderbuffer) {
      GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer]);
    }
    function _glBindTexture(target, texture) {
      GLctx.bindTexture(target, GL.textures[texture]);
    }
    function _glBindVertexArray(vao) {
      GLctx["bindVertexArray"](GL.vaos[vao]);
    }
    function _glBlendEquation(x0) {
      GLctx["blendEquation"](x0);
    }
    function _glBlendFunc(x0, x1) {
      GLctx["blendFunc"](x0, x1);
    }
    function _glBlendFuncSeparate(x0, x1, x2, x3) {
      GLctx["blendFuncSeparate"](x0, x1, x2, x3);
    }
    function _glBlitFramebuffer(x0, x1, x2, x3, x4, x5, x6, x7, x8, x9) {
      GLctx["blitFramebuffer"](x0, x1, x2, x3, x4, x5, x6, x7, x8, x9);
    }
    function _glBufferData(target, size, data, usage) {
      if (GL.currentContext.version >= 2) {
        if (data) {
          GLctx.bufferData(target, HEAPU8, usage, data, size);
        } else {
          GLctx.bufferData(target, size, usage);
        }
      } else {
        GLctx.bufferData(target, data ? HEAPU8.subarray(data, data + size) : size, usage);
      }
    }
    function _glBufferSubData(target, offset, size, data) {
      if (GL.currentContext.version >= 2) {
        GLctx.bufferSubData(target, offset, HEAPU8, data, size);
        return;
      }
      GLctx.bufferSubData(target, offset, HEAPU8.subarray(data, data + size));
    }
    function _glClear(x0) {
      GLctx["clear"](x0);
    }
    function _glClearBufferfv(buffer2, drawbuffer, value) {
      GLctx["clearBufferfv"](buffer2, drawbuffer, HEAPF32, value >> 2);
    }
    function _glClearColor(x0, x1, x2, x3) {
      GLctx["clearColor"](x0, x1, x2, x3);
    }
    function _glClearDepthf(x0) {
      GLctx["clearDepth"](x0);
    }
    function _glColorMask(red, green, blue, alpha) {
      GLctx.colorMask(!!red, !!green, !!blue, !!alpha);
    }
    function _glCompileShader(shader) {
      GLctx.compileShader(GL.shaders[shader]);
    }
    function _glCompressedTexImage2D(target, level, internalFormat, width, height, border, imageSize, data) {
      if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding) {
          GLctx["compressedTexImage2D"](target, level, internalFormat, width, height, border, imageSize, data);
        } else {
          GLctx["compressedTexImage2D"](target, level, internalFormat, width, height, border, HEAPU8, data, imageSize);
        }
        return;
      }
      GLctx["compressedTexImage2D"](target, level, internalFormat, width, height, border, data ? HEAPU8.subarray(data, data + imageSize) : null);
    }
    function _glCompressedTexImage3D(target, level, internalFormat, width, height, depth, border, imageSize, data) {
      if (GLctx.currentPixelUnpackBufferBinding) {
        GLctx["compressedTexImage3D"](target, level, internalFormat, width, height, depth, border, imageSize, data);
      } else {
        GLctx["compressedTexImage3D"](target, level, internalFormat, width, height, depth, border, HEAPU8, data, imageSize);
      }
    }
    function _glCopyTexSubImage2D(x0, x1, x2, x3, x4, x5, x6, x7) {
      GLctx["copyTexSubImage2D"](x0, x1, x2, x3, x4, x5, x6, x7);
    }
    function _glCreateProgram() {
      var id2 = GL.getNewId(GL.programs);
      var program = GLctx.createProgram();
      program.name = id2;
      program.maxUniformLength = program.maxAttributeLength = program.maxUniformBlockNameLength = 0;
      program.uniformIdCounter = 1;
      GL.programs[id2] = program;
      return id2;
    }
    function _glCreateShader(shaderType) {
      var id2 = GL.getNewId(GL.shaders);
      GL.shaders[id2] = GLctx.createShader(shaderType);
      return id2;
    }
    function _glDeleteBuffers(n, buffers) {
      for (var i2 = 0; i2 < n; i2++) {
        var id2 = HEAP32[buffers + i2 * 4 >> 2];
        var buffer2 = GL.buffers[id2];
        if (!buffer2)
          continue;
        GLctx.deleteBuffer(buffer2);
        buffer2.name = 0;
        GL.buffers[id2] = null;
        if (id2 == GLctx.currentPixelPackBufferBinding)
          GLctx.currentPixelPackBufferBinding = 0;
        if (id2 == GLctx.currentPixelUnpackBufferBinding)
          GLctx.currentPixelUnpackBufferBinding = 0;
      }
    }
    function _glDeleteFramebuffers(n, framebuffers) {
      for (var i2 = 0; i2 < n; ++i2) {
        var id2 = HEAP32[framebuffers + i2 * 4 >> 2];
        var framebuffer = GL.framebuffers[id2];
        if (!framebuffer)
          continue;
        GLctx.deleteFramebuffer(framebuffer);
        framebuffer.name = 0;
        GL.framebuffers[id2] = null;
      }
    }
    function _glDeleteProgram(id2) {
      if (!id2)
        return;
      var program = GL.programs[id2];
      if (!program) {
        GL.recordError(1281);
        return;
      }
      GLctx.deleteProgram(program);
      program.name = 0;
      GL.programs[id2] = null;
    }
    function _glDeleteRenderbuffers(n, renderbuffers) {
      for (var i2 = 0; i2 < n; i2++) {
        var id2 = HEAP32[renderbuffers + i2 * 4 >> 2];
        var renderbuffer = GL.renderbuffers[id2];
        if (!renderbuffer)
          continue;
        GLctx.deleteRenderbuffer(renderbuffer);
        renderbuffer.name = 0;
        GL.renderbuffers[id2] = null;
      }
    }
    function _glDeleteShader(id2) {
      if (!id2)
        return;
      var shader = GL.shaders[id2];
      if (!shader) {
        GL.recordError(1281);
        return;
      }
      GLctx.deleteShader(shader);
      GL.shaders[id2] = null;
    }
    function _glDeleteTextures(n, textures) {
      for (var i2 = 0; i2 < n; i2++) {
        var id2 = HEAP32[textures + i2 * 4 >> 2];
        var texture = GL.textures[id2];
        if (!texture)
          continue;
        GLctx.deleteTexture(texture);
        texture.name = 0;
        GL.textures[id2] = null;
      }
    }
    function _glDeleteVertexArrays(n, vaos) {
      for (var i2 = 0; i2 < n; i2++) {
        var id2 = HEAP32[vaos + i2 * 4 >> 2];
        GLctx["deleteVertexArray"](GL.vaos[id2]);
        GL.vaos[id2] = null;
      }
    }
    function _glDepthFunc(x0) {
      GLctx["depthFunc"](x0);
    }
    function _glDepthMask(flag) {
      GLctx.depthMask(!!flag);
    }
    function _glDisable(x0) {
      GLctx["disable"](x0);
    }
    function _glDrawArrays(mode, first, count) {
      GLctx.drawArrays(mode, first, count);
    }
    function _glDrawArraysInstanced(mode, first, count, primcount) {
      GLctx["drawArraysInstanced"](mode, first, count, primcount);
    }
    var tempFixedLengthArray = [];
    function _glDrawBuffers(n, bufs) {
      var bufArray = tempFixedLengthArray[n];
      for (var i2 = 0; i2 < n; i2++) {
        bufArray[i2] = HEAP32[bufs + i2 * 4 >> 2];
      }
      GLctx["drawBuffers"](bufArray);
    }
    function _glDrawElements(mode, count, type, indices) {
      GLctx.drawElements(mode, count, type, indices);
    }
    function _glDrawElementsInstanced(mode, count, type, indices, primcount) {
      GLctx["drawElementsInstanced"](mode, count, type, indices, primcount);
    }
    function _glEnable(x0) {
      GLctx["enable"](x0);
    }
    function _glEnableVertexAttribArray(index) {
      GLctx.enableVertexAttribArray(index);
    }
    function _glFramebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer) {
      GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget, GL.renderbuffers[renderbuffer]);
    }
    function _glFramebufferTexture2D(target, attachment, textarget, texture, level) {
      GLctx.framebufferTexture2D(target, attachment, textarget, GL.textures[texture], level);
    }
    function _glFrontFace(x0) {
      GLctx["frontFace"](x0);
    }
    function __glGenObject(n, buffers, createFunction, objectTable) {
      for (var i2 = 0; i2 < n; i2++) {
        var buffer2 = GLctx[createFunction]();
        var id2 = buffer2 && GL.getNewId(objectTable);
        if (buffer2) {
          buffer2.name = id2;
          objectTable[id2] = buffer2;
        } else {
          GL.recordError(1282);
        }
        HEAP32[buffers + i2 * 4 >> 2] = id2;
      }
    }
    function _glGenBuffers(n, buffers) {
      __glGenObject(n, buffers, "createBuffer", GL.buffers);
    }
    function _glGenFramebuffers(n, ids) {
      __glGenObject(n, ids, "createFramebuffer", GL.framebuffers);
    }
    function _glGenRenderbuffers(n, renderbuffers) {
      __glGenObject(n, renderbuffers, "createRenderbuffer", GL.renderbuffers);
    }
    function _glGenTextures(n, textures) {
      __glGenObject(n, textures, "createTexture", GL.textures);
    }
    function _glGenVertexArrays(n, arrays) {
      __glGenObject(n, arrays, "createVertexArray", GL.vaos);
    }
    function _glGenerateMipmap(x0) {
      GLctx["generateMipmap"](x0);
    }
    function _glGetError() {
      var error = GLctx.getError() || GL.lastError;
      GL.lastError = 0;
      return error;
    }
    function writeI53ToI64(ptr, num) {
      HEAPU32[ptr >> 2] = num;
      HEAPU32[ptr + 4 >> 2] = (num - HEAPU32[ptr >> 2]) / 4294967296;
    }
    function emscriptenWebGLGet(name_, p, type) {
      if (!p) {
        GL.recordError(1281);
        return;
      }
      var ret = void 0;
      switch (name_) {
        case 36346:
          ret = 1;
          break;
        case 36344:
          if (type != 0 && type != 1) {
            GL.recordError(1280);
          }
          return;
        case 34814:
        case 36345:
          ret = 0;
          break;
        case 34466:
          var formats = GLctx.getParameter(34467);
          ret = formats ? formats.length : 0;
          break;
        case 33309:
          if (GL.currentContext.version < 2) {
            GL.recordError(1282);
            return;
          }
          var exts = GLctx.getSupportedExtensions() || [];
          ret = 2 * exts.length;
          break;
        case 33307:
        case 33308:
          if (GL.currentContext.version < 2) {
            GL.recordError(1280);
            return;
          }
          ret = name_ == 33307 ? 3 : 0;
          break;
      }
      if (ret === void 0) {
        var result = GLctx.getParameter(name_);
        switch (typeof result) {
          case "number":
            ret = result;
            break;
          case "boolean":
            ret = result ? 1 : 0;
            break;
          case "string":
            GL.recordError(1280);
            return;
          case "object":
            if (result === null) {
              switch (name_) {
                case 34964:
                case 35725:
                case 34965:
                case 36006:
                case 36007:
                case 32873:
                case 34229:
                case 36662:
                case 36663:
                case 35053:
                case 35055:
                case 36010:
                case 35097:
                case 35869:
                case 32874:
                case 36389:
                case 35983:
                case 35368:
                case 34068: {
                  ret = 0;
                  break;
                }
                default: {
                  GL.recordError(1280);
                  return;
                }
              }
            } else if (result instanceof Float32Array || result instanceof Uint32Array || result instanceof Int32Array || result instanceof Array) {
              for (var i2 = 0; i2 < result.length; ++i2) {
                switch (type) {
                  case 0:
                    HEAP32[p + i2 * 4 >> 2] = result[i2];
                    break;
                  case 2:
                    HEAPF32[p + i2 * 4 >> 2] = result[i2];
                    break;
                  case 4:
                    HEAP8[p + i2 >> 0] = result[i2] ? 1 : 0;
                    break;
                }
              }
              return;
            } else {
              try {
                ret = result.name | 0;
              } catch (e) {
                GL.recordError(1280);
                err("GL_INVALID_ENUM in glGet" + type + "v: Unknown object returned from WebGL getParameter(" + name_ + ")! (error: " + e + ")");
                return;
              }
            }
            break;
          default:
            GL.recordError(1280);
            err("GL_INVALID_ENUM in glGet" + type + "v: Native code calling glGet" + type + "v(" + name_ + ") and it returns " + result + " of type " + typeof result + "!");
            return;
        }
      }
      switch (type) {
        case 1:
          writeI53ToI64(p, ret);
          break;
        case 0:
          HEAP32[p >> 2] = ret;
          break;
        case 2:
          HEAPF32[p >> 2] = ret;
          break;
        case 4:
          HEAP8[p >> 0] = ret ? 1 : 0;
          break;
      }
    }
    function _glGetIntegerv(name_, p) {
      emscriptenWebGLGet(name_, p, 0);
    }
    function _glGetProgramInfoLog(program, maxLength, length, infoLog) {
      var log = GLctx.getProgramInfoLog(GL.programs[program]);
      if (log === null)
        log = "(unknown error)";
      var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
      if (length)
        HEAP32[length >> 2] = numBytesWrittenExclNull;
    }
    function _glGetProgramiv(program, pname, p) {
      if (!p) {
        GL.recordError(1281);
        return;
      }
      if (program >= GL.counter) {
        GL.recordError(1281);
        return;
      }
      program = GL.programs[program];
      if (pname == 35716) {
        var log = GLctx.getProgramInfoLog(program);
        if (log === null)
          log = "(unknown error)";
        HEAP32[p >> 2] = log.length + 1;
      } else if (pname == 35719) {
        if (!program.maxUniformLength) {
          for (var i2 = 0; i2 < GLctx.getProgramParameter(program, 35718); ++i2) {
            program.maxUniformLength = Math.max(program.maxUniformLength, GLctx.getActiveUniform(program, i2).name.length + 1);
          }
        }
        HEAP32[p >> 2] = program.maxUniformLength;
      } else if (pname == 35722) {
        if (!program.maxAttributeLength) {
          for (var i2 = 0; i2 < GLctx.getProgramParameter(program, 35721); ++i2) {
            program.maxAttributeLength = Math.max(program.maxAttributeLength, GLctx.getActiveAttrib(program, i2).name.length + 1);
          }
        }
        HEAP32[p >> 2] = program.maxAttributeLength;
      } else if (pname == 35381) {
        if (!program.maxUniformBlockNameLength) {
          for (var i2 = 0; i2 < GLctx.getProgramParameter(program, 35382); ++i2) {
            program.maxUniformBlockNameLength = Math.max(program.maxUniformBlockNameLength, GLctx.getActiveUniformBlockName(program, i2).length + 1);
          }
        }
        HEAP32[p >> 2] = program.maxUniformBlockNameLength;
      } else {
        HEAP32[p >> 2] = GLctx.getProgramParameter(program, pname);
      }
    }
    function _glGetShaderInfoLog(shader, maxLength, length, infoLog) {
      var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
      if (log === null)
        log = "(unknown error)";
      var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
      if (length)
        HEAP32[length >> 2] = numBytesWrittenExclNull;
    }
    function _glGetShaderiv(shader, pname, p) {
      if (!p) {
        GL.recordError(1281);
        return;
      }
      if (pname == 35716) {
        var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
        if (log === null)
          log = "(unknown error)";
        var logLength = log ? log.length + 1 : 0;
        HEAP32[p >> 2] = logLength;
      } else if (pname == 35720) {
        var source = GLctx.getShaderSource(GL.shaders[shader]);
        var sourceLength = source ? source.length + 1 : 0;
        HEAP32[p >> 2] = sourceLength;
      } else {
        HEAP32[p >> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname);
      }
    }
    function stringToNewUTF8(jsString) {
      var length = lengthBytesUTF8(jsString) + 1;
      var cString = _malloc(length);
      stringToUTF8(jsString, cString, length);
      return cString;
    }
    function _glGetString(name_) {
      var ret = GL.stringCache[name_];
      if (!ret) {
        switch (name_) {
          case 7939:
            var exts = GLctx.getSupportedExtensions() || [];
            exts = exts.concat(exts.map(function(e) {
              return "GL_" + e;
            }));
            ret = stringToNewUTF8(exts.join(" "));
            break;
          case 7936:
          case 7937:
          case 37445:
          case 37446:
            var s = GLctx.getParameter(name_);
            if (!s) {
              GL.recordError(1280);
            }
            ret = s && stringToNewUTF8(s);
            break;
          case 7938:
            var glVersion = GLctx.getParameter(7938);
            if (GL.currentContext.version >= 2)
              glVersion = "OpenGL ES 3.0 (" + glVersion + ")";
            else {
              glVersion = "OpenGL ES 2.0 (" + glVersion + ")";
            }
            ret = stringToNewUTF8(glVersion);
            break;
          case 35724:
            var glslVersion = GLctx.getParameter(35724);
            var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
            var ver_num = glslVersion.match(ver_re);
            if (ver_num !== null) {
              if (ver_num[1].length == 3)
                ver_num[1] = ver_num[1] + "0";
              glslVersion = "OpenGL ES GLSL ES " + ver_num[1] + " (" + glslVersion + ")";
            }
            ret = stringToNewUTF8(glslVersion);
            break;
          default:
            GL.recordError(1280);
        }
        GL.stringCache[name_] = ret;
      }
      return ret;
    }
    function jstoi_q(str) {
      return parseInt(str);
    }
    function webglGetLeftBracePos(name) {
      return name.slice(-1) == "]" && name.lastIndexOf("[");
    }
    function webglPrepareUniformLocationsBeforeFirstUse(program) {
      var uniformLocsById = program.uniformLocsById, uniformSizeAndIdsByName = program.uniformSizeAndIdsByName, i2, j;
      if (!uniformLocsById) {
        program.uniformLocsById = uniformLocsById = {};
        program.uniformArrayNamesById = {};
        for (i2 = 0; i2 < GLctx.getProgramParameter(program, 35718); ++i2) {
          var u = GLctx.getActiveUniform(program, i2);
          var nm = u.name;
          var sz = u.size;
          var lb = webglGetLeftBracePos(nm);
          var arrayName = lb > 0 ? nm.slice(0, lb) : nm;
          var id2 = program.uniformIdCounter;
          program.uniformIdCounter += sz;
          uniformSizeAndIdsByName[arrayName] = [sz, id2];
          for (j = 0; j < sz; ++j) {
            uniformLocsById[id2] = j;
            program.uniformArrayNamesById[id2++] = arrayName;
          }
        }
      }
    }
    function _glGetUniformLocation(program, name) {
      name = UTF8ToString(name);
      if (program = GL.programs[program]) {
        webglPrepareUniformLocationsBeforeFirstUse(program);
        var uniformLocsById = program.uniformLocsById;
        var arrayIndex = 0;
        var uniformBaseName = name;
        var leftBrace = webglGetLeftBracePos(name);
        if (leftBrace > 0) {
          arrayIndex = jstoi_q(name.slice(leftBrace + 1)) >>> 0;
          uniformBaseName = name.slice(0, leftBrace);
        }
        var sizeAndId = program.uniformSizeAndIdsByName[uniformBaseName];
        if (sizeAndId && arrayIndex < sizeAndId[0]) {
          arrayIndex += sizeAndId[1];
          if (uniformLocsById[arrayIndex] = uniformLocsById[arrayIndex] || GLctx.getUniformLocation(program, name)) {
            return arrayIndex;
          }
        }
      } else {
        GL.recordError(1281);
      }
      return -1;
    }
    function _glInvalidateFramebuffer(target, numAttachments, attachments) {
      var list = tempFixedLengthArray[numAttachments];
      for (var i2 = 0; i2 < numAttachments; i2++) {
        list[i2] = HEAP32[attachments + i2 * 4 >> 2];
      }
      GLctx["invalidateFramebuffer"](target, list);
    }
    function _glLinkProgram(program) {
      program = GL.programs[program];
      GLctx.linkProgram(program);
      program.uniformLocsById = 0;
      program.uniformSizeAndIdsByName = {};
    }
    function _glPixelStorei(pname, param) {
      if (pname == 3317) {
        GL.unpackAlignment = param;
      }
      GLctx.pixelStorei(pname, param);
    }
    function computeUnpackAlignedImageSize(width, height, sizePerPixel, alignment) {
      function roundedToNextMultipleOf(x, y) {
        return x + y - 1 & -y;
      }
      var plainRowSize = width * sizePerPixel;
      var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
      return height * alignedRowSize;
    }
    function __colorChannelsInGlTextureFormat(format) {
      var colorChannels = { 5: 3, 6: 4, 8: 2, 29502: 3, 29504: 4, 26917: 2, 26918: 2, 29846: 3, 29847: 4 };
      return colorChannels[format - 6402] || 1;
    }
    function heapObjectForWebGLType(type) {
      type -= 5120;
      if (type == 0)
        return HEAP8;
      if (type == 1)
        return HEAPU8;
      if (type == 2)
        return HEAP16;
      if (type == 4)
        return HEAP32;
      if (type == 6)
        return HEAPF32;
      if (type == 5 || type == 28922 || type == 28520 || type == 30779 || type == 30782)
        return HEAPU32;
      return HEAPU16;
    }
    function heapAccessShiftForWebGLHeap(heap) {
      return 31 - Math.clz32(heap.BYTES_PER_ELEMENT);
    }
    function emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) {
      var heap = heapObjectForWebGLType(type);
      var shift = heapAccessShiftForWebGLHeap(heap);
      var byteSize = 1 << shift;
      var sizePerPixel = __colorChannelsInGlTextureFormat(format) * byteSize;
      var bytes = computeUnpackAlignedImageSize(width, height, sizePerPixel, GL.unpackAlignment);
      return heap.subarray(pixels >> shift, pixels + bytes >> shift);
    }
    function _glReadPixels(x, y, width, height, format, type, pixels) {
      if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelPackBufferBinding) {
          GLctx.readPixels(x, y, width, height, format, type, pixels);
        } else {
          var heap = heapObjectForWebGLType(type);
          GLctx.readPixels(x, y, width, height, format, type, heap, pixels >> heapAccessShiftForWebGLHeap(heap));
        }
        return;
      }
      var pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels);
      if (!pixelData) {
        GL.recordError(1280);
        return;
      }
      GLctx.readPixels(x, y, width, height, format, type, pixelData);
    }
    function _glRenderbufferStorage(x0, x1, x2, x3) {
      GLctx["renderbufferStorage"](x0, x1, x2, x3);
    }
    function _glRenderbufferStorageMultisample(x0, x1, x2, x3, x4) {
      GLctx["renderbufferStorageMultisample"](x0, x1, x2, x3, x4);
    }
    function _glShaderSource(shader, count, string, length) {
      var source = GL.getSource(shader, count, string, length);
      GLctx.shaderSource(GL.shaders[shader], source);
    }
    function _glTexImage2D(target, level, internalFormat, width, height, border, format, type, pixels) {
      if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding) {
          GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels);
        } else if (pixels) {
          var heap = heapObjectForWebGLType(type);
          GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, heap, pixels >> heapAccessShiftForWebGLHeap(heap));
        } else {
          GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, null);
        }
        return;
      }
      GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels) : null);
    }
    function _glTexImage3D(target, level, internalFormat, width, height, depth, border, format, type, pixels) {
      if (GLctx.currentPixelUnpackBufferBinding) {
        GLctx["texImage3D"](target, level, internalFormat, width, height, depth, border, format, type, pixels);
      } else if (pixels) {
        var heap = heapObjectForWebGLType(type);
        GLctx["texImage3D"](target, level, internalFormat, width, height, depth, border, format, type, heap, pixels >> heapAccessShiftForWebGLHeap(heap));
      } else {
        GLctx["texImage3D"](target, level, internalFormat, width, height, depth, border, format, type, null);
      }
    }
    function _glTexParameteri(x0, x1, x2) {
      GLctx["texParameteri"](x0, x1, x2);
    }
    function _glTexStorage2D(x0, x1, x2, x3, x4) {
      GLctx["texStorage2D"](x0, x1, x2, x3, x4);
    }
    function _glTexStorage3D(x0, x1, x2, x3, x4, x5) {
      GLctx["texStorage3D"](x0, x1, x2, x3, x4, x5);
    }
    function _glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels) {
      if (GL.currentContext.version >= 2) {
        if (GLctx.currentPixelUnpackBufferBinding) {
          GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels);
        } else if (pixels) {
          var heap = heapObjectForWebGLType(type);
          GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, heap, pixels >> heapAccessShiftForWebGLHeap(heap));
        } else {
          GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, null);
        }
        return;
      }
      var pixelData = null;
      if (pixels)
        pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels);
      GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData);
    }
    function _glTexSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, pixels) {
      if (GLctx.currentPixelUnpackBufferBinding) {
        GLctx["texSubImage3D"](target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, pixels);
      } else if (pixels) {
        var heap = heapObjectForWebGLType(type);
        GLctx["texSubImage3D"](target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, heap, pixels >> heapAccessShiftForWebGLHeap(heap));
      } else {
        GLctx["texSubImage3D"](target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, null);
      }
    }
    function webglGetUniformLocation(location2) {
      var p = GLctx.currentProgram;
      if (p) {
        var webglLoc = p.uniformLocsById[location2];
        if (typeof webglLoc === "number") {
          p.uniformLocsById[location2] = webglLoc = GLctx.getUniformLocation(p, p.uniformArrayNamesById[location2] + (webglLoc > 0 ? "[" + webglLoc + "]" : ""));
        }
        return webglLoc;
      } else {
        GL.recordError(1282);
      }
    }
    function _glUniform1f(location2, v0) {
      GLctx.uniform1f(webglGetUniformLocation(location2), v0);
    }
    function _glUniform1i(location2, v0) {
      GLctx.uniform1i(webglGetUniformLocation(location2), v0);
    }
    function _glUniform1ui(location2, v0) {
      GLctx.uniform1ui(webglGetUniformLocation(location2), v0);
    }
    function _glUniform2f(location2, v0, v1) {
      GLctx.uniform2f(webglGetUniformLocation(location2), v0, v1);
    }
    var miniTempWebGLFloatBuffers = [];
    function _glUniform2fv(location2, count, value) {
      if (GL.currentContext.version >= 2) {
        GLctx.uniform2fv(webglGetUniformLocation(location2), HEAPF32, value >> 2, count * 2);
        return;
      }
      if (count <= 144) {
        var view = miniTempWebGLFloatBuffers[2 * count - 1];
        for (var i2 = 0; i2 < 2 * count; i2 += 2) {
          view[i2] = HEAPF32[value + 4 * i2 >> 2];
          view[i2 + 1] = HEAPF32[value + (4 * i2 + 4) >> 2];
        }
      } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 8 >> 2);
      }
      GLctx.uniform2fv(webglGetUniformLocation(location2), view);
    }
    function _glUniform4fv(location2, count, value) {
      if (GL.currentContext.version >= 2) {
        GLctx.uniform4fv(webglGetUniformLocation(location2), HEAPF32, value >> 2, count * 4);
        return;
      }
      if (count <= 72) {
        var view = miniTempWebGLFloatBuffers[4 * count - 1];
        var heap = HEAPF32;
        value >>= 2;
        for (var i2 = 0; i2 < 4 * count; i2 += 4) {
          var dst = value + i2;
          view[i2] = heap[dst];
          view[i2 + 1] = heap[dst + 1];
          view[i2 + 2] = heap[dst + 2];
          view[i2 + 3] = heap[dst + 3];
        }
      } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 16 >> 2);
      }
      GLctx.uniform4fv(webglGetUniformLocation(location2), view);
    }
    function _glUniformMatrix4fv(location2, count, transpose, value) {
      if (GL.currentContext.version >= 2) {
        GLctx.uniformMatrix4fv(webglGetUniformLocation(location2), !!transpose, HEAPF32, value >> 2, count * 16);
        return;
      }
      if (count <= 18) {
        var view = miniTempWebGLFloatBuffers[16 * count - 1];
        var heap = HEAPF32;
        value >>= 2;
        for (var i2 = 0; i2 < 16 * count; i2 += 16) {
          var dst = value + i2;
          view[i2] = heap[dst];
          view[i2 + 1] = heap[dst + 1];
          view[i2 + 2] = heap[dst + 2];
          view[i2 + 3] = heap[dst + 3];
          view[i2 + 4] = heap[dst + 4];
          view[i2 + 5] = heap[dst + 5];
          view[i2 + 6] = heap[dst + 6];
          view[i2 + 7] = heap[dst + 7];
          view[i2 + 8] = heap[dst + 8];
          view[i2 + 9] = heap[dst + 9];
          view[i2 + 10] = heap[dst + 10];
          view[i2 + 11] = heap[dst + 11];
          view[i2 + 12] = heap[dst + 12];
          view[i2 + 13] = heap[dst + 13];
          view[i2 + 14] = heap[dst + 14];
          view[i2 + 15] = heap[dst + 15];
        }
      } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 64 >> 2);
      }
      GLctx.uniformMatrix4fv(webglGetUniformLocation(location2), !!transpose, view);
    }
    function _glUseProgram(program) {
      program = GL.programs[program];
      GLctx.useProgram(program);
      GLctx.currentProgram = program;
    }
    function _glVertexAttribIPointer(index, size, type, stride, ptr) {
      GLctx["vertexAttribIPointer"](index, size, type, stride, ptr);
    }
    function _glVertexAttribPointer(index, size, type, normalized, stride, ptr) {
      GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr);
    }
    function _glViewport(x0, x1, x2, x3) {
      GLctx["viewport"](x0, x1, x2, x3);
    }
    function _tzset_impl() {
      var currentYear = new Date().getFullYear();
      var winter = new Date(currentYear, 0, 1);
      var summer = new Date(currentYear, 6, 1);
      var winterOffset = winter.getTimezoneOffset();
      var summerOffset = summer.getTimezoneOffset();
      var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
      HEAP32[__get_timezone() >> 2] = stdTimezoneOffset * 60;
      HEAP32[__get_daylight() >> 2] = Number(winterOffset != summerOffset);
      function extractZone(date) {
        var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
        return match ? match[1] : "GMT";
      }
      var winterName = extractZone(winter);
      var summerName = extractZone(summer);
      var winterNamePtr = allocateUTF8(winterName);
      var summerNamePtr = allocateUTF8(summerName);
      if (summerOffset < winterOffset) {
        HEAP32[__get_tzname() >> 2] = winterNamePtr;
        HEAP32[__get_tzname() + 4 >> 2] = summerNamePtr;
      } else {
        HEAP32[__get_tzname() >> 2] = summerNamePtr;
        HEAP32[__get_tzname() + 4 >> 2] = winterNamePtr;
      }
    }
    function _tzset() {
      if (_tzset.called)
        return;
      _tzset.called = true;
      _tzset_impl();
    }
    function _localtime_r(time, tmPtr) {
      _tzset();
      var date = new Date(HEAP32[time >> 2] * 1e3);
      HEAP32[tmPtr >> 2] = date.getSeconds();
      HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
      HEAP32[tmPtr + 8 >> 2] = date.getHours();
      HEAP32[tmPtr + 12 >> 2] = date.getDate();
      HEAP32[tmPtr + 16 >> 2] = date.getMonth();
      HEAP32[tmPtr + 20 >> 2] = date.getFullYear() - 1900;
      HEAP32[tmPtr + 24 >> 2] = date.getDay();
      var start = new Date(date.getFullYear(), 0, 1);
      var yday = (date.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24) | 0;
      HEAP32[tmPtr + 28 >> 2] = yday;
      HEAP32[tmPtr + 36 >> 2] = -(date.getTimezoneOffset() * 60);
      var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
      var winterOffset = start.getTimezoneOffset();
      var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
      HEAP32[tmPtr + 32 >> 2] = dst;
      var zonePtr = HEAP32[__get_tzname() + (dst ? 4 : 0) >> 2];
      HEAP32[tmPtr + 40 >> 2] = zonePtr;
      return tmPtr;
    }
    function _mktime(tmPtr) {
      _tzset();
      var date = new Date(HEAP32[tmPtr + 20 >> 2] + 1900, HEAP32[tmPtr + 16 >> 2], HEAP32[tmPtr + 12 >> 2], HEAP32[tmPtr + 8 >> 2], HEAP32[tmPtr + 4 >> 2], HEAP32[tmPtr >> 2], 0);
      var dst = HEAP32[tmPtr + 32 >> 2];
      var guessedOffset = date.getTimezoneOffset();
      var start = new Date(date.getFullYear(), 0, 1);
      var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
      var winterOffset = start.getTimezoneOffset();
      var dstOffset = Math.min(winterOffset, summerOffset);
      if (dst < 0) {
        HEAP32[tmPtr + 32 >> 2] = Number(summerOffset != winterOffset && dstOffset == guessedOffset);
      } else if (dst > 0 != (dstOffset == guessedOffset)) {
        var nonDstOffset = Math.max(winterOffset, summerOffset);
        var trueOffset = dst > 0 ? dstOffset : nonDstOffset;
        date.setTime(date.getTime() + (trueOffset - guessedOffset) * 6e4);
      }
      HEAP32[tmPtr + 24 >> 2] = date.getDay();
      var yday = (date.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24) | 0;
      HEAP32[tmPtr + 28 >> 2] = yday;
      HEAP32[tmPtr >> 2] = date.getSeconds();
      HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
      HEAP32[tmPtr + 8 >> 2] = date.getHours();
      HEAP32[tmPtr + 12 >> 2] = date.getDate();
      HEAP32[tmPtr + 16 >> 2] = date.getMonth();
      return date.getTime() / 1e3 | 0;
    }
    function _setTempRet0(val) {
    }
    function __isLeapYear(year) {
      return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }
    function __arraySum(array, index) {
      var sum = 0;
      for (var i2 = 0; i2 <= index; sum += array[i2++]) {
      }
      return sum;
    }
    var __MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var __MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function __addDays(date, days) {
      var newDate = new Date(date.getTime());
      while (days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
        if (days > daysInCurrentMonth - newDate.getDate()) {
          days -= daysInCurrentMonth - newDate.getDate() + 1;
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth + 1);
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear() + 1);
          }
        } else {
          newDate.setDate(newDate.getDate() + days);
          return newDate;
        }
      }
      return newDate;
    }
    function _strftime(s, maxsize, format, tm) {
      var tm_zone = HEAP32[tm + 40 >> 2];
      var date = { tm_sec: HEAP32[tm >> 2], tm_min: HEAP32[tm + 4 >> 2], tm_hour: HEAP32[tm + 8 >> 2], tm_mday: HEAP32[tm + 12 >> 2], tm_mon: HEAP32[tm + 16 >> 2], tm_year: HEAP32[tm + 20 >> 2], tm_wday: HEAP32[tm + 24 >> 2], tm_yday: HEAP32[tm + 28 >> 2], tm_isdst: HEAP32[tm + 32 >> 2], tm_gmtoff: HEAP32[tm + 36 >> 2], tm_zone: tm_zone ? UTF8ToString(tm_zone) : "" };
      var pattern = UTF8ToString(format);
      var EXPANSION_RULES_1 = { "%c": "%a %b %d %H:%M:%S %Y", "%D": "%m/%d/%y", "%F": "%Y-%m-%d", "%h": "%b", "%r": "%I:%M:%S %p", "%R": "%H:%M", "%T": "%H:%M:%S", "%x": "%m/%d/%y", "%X": "%H:%M:%S", "%Ec": "%c", "%EC": "%C", "%Ex": "%m/%d/%y", "%EX": "%H:%M:%S", "%Ey": "%y", "%EY": "%Y", "%Od": "%d", "%Oe": "%e", "%OH": "%H", "%OI": "%I", "%Om": "%m", "%OM": "%M", "%OS": "%S", "%Ou": "%u", "%OU": "%U", "%OV": "%V", "%Ow": "%w", "%OW": "%W", "%Oy": "%y" };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_1[rule]);
      }
      var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      function leadingSomething(value, digits, character) {
        var str = typeof value === "number" ? value.toString() : value || "";
        while (str.length < digits) {
          str = character[0] + str;
        }
        return str;
      }
      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, "0");
      }
      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : value > 0 ? 1 : 0;
        }
        var compare;
        if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
            compare = sgn(date1.getDate() - date2.getDate());
          }
        }
        return compare;
      }
      function getFirstWeekStartDate(janFourth) {
        switch (janFourth.getDay()) {
          case 0:
            return new Date(janFourth.getFullYear() - 1, 11, 29);
          case 1:
            return janFourth;
          case 2:
            return new Date(janFourth.getFullYear(), 0, 3);
          case 3:
            return new Date(janFourth.getFullYear(), 0, 2);
          case 4:
            return new Date(janFourth.getFullYear(), 0, 1);
          case 5:
            return new Date(janFourth.getFullYear() - 1, 11, 31);
          case 6:
            return new Date(janFourth.getFullYear() - 1, 11, 30);
        }
      }
      function getWeekBasedYear(date2) {
        var thisDate = __addDays(new Date(date2.tm_year + 1900, 0, 1), date2.tm_yday);
        var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
        var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
        var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
        var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
        if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
          if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
            return thisDate.getFullYear() + 1;
          } else {
            return thisDate.getFullYear();
          }
        } else {
          return thisDate.getFullYear() - 1;
        }
      }
      var EXPANSION_RULES_2 = { "%a": function(date2) {
        return WEEKDAYS[date2.tm_wday].substring(0, 3);
      }, "%A": function(date2) {
        return WEEKDAYS[date2.tm_wday];
      }, "%b": function(date2) {
        return MONTHS[date2.tm_mon].substring(0, 3);
      }, "%B": function(date2) {
        return MONTHS[date2.tm_mon];
      }, "%C": function(date2) {
        var year = date2.tm_year + 1900;
        return leadingNulls(year / 100 | 0, 2);
      }, "%d": function(date2) {
        return leadingNulls(date2.tm_mday, 2);
      }, "%e": function(date2) {
        return leadingSomething(date2.tm_mday, 2, " ");
      }, "%g": function(date2) {
        return getWeekBasedYear(date2).toString().substring(2);
      }, "%G": function(date2) {
        return getWeekBasedYear(date2);
      }, "%H": function(date2) {
        return leadingNulls(date2.tm_hour, 2);
      }, "%I": function(date2) {
        var twelveHour = date2.tm_hour;
        if (twelveHour == 0)
          twelveHour = 12;
        else if (twelveHour > 12)
          twelveHour -= 12;
        return leadingNulls(twelveHour, 2);
      }, "%j": function(date2) {
        return leadingNulls(date2.tm_mday + __arraySum(__isLeapYear(date2.tm_year + 1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date2.tm_mon - 1), 3);
      }, "%m": function(date2) {
        return leadingNulls(date2.tm_mon + 1, 2);
      }, "%M": function(date2) {
        return leadingNulls(date2.tm_min, 2);
      }, "%n": function() {
        return "\n";
      }, "%p": function(date2) {
        if (date2.tm_hour >= 0 && date2.tm_hour < 12) {
          return "AM";
        } else {
          return "PM";
        }
      }, "%S": function(date2) {
        return leadingNulls(date2.tm_sec, 2);
      }, "%t": function() {
        return "	";
      }, "%u": function(date2) {
        return date2.tm_wday || 7;
      }, "%U": function(date2) {
        var janFirst = new Date(date2.tm_year + 1900, 0, 1);
        var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7 - janFirst.getDay());
        var endDate = new Date(date2.tm_year + 1900, date2.tm_mon, date2.tm_mday);
        if (compareByDay(firstSunday, endDate) < 0) {
          var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
          var firstSundayUntilEndJanuary = 31 - firstSunday.getDate();
          var days = firstSundayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
          return leadingNulls(Math.ceil(days / 7), 2);
        }
        return compareByDay(firstSunday, janFirst) === 0 ? "01" : "00";
      }, "%V": function(date2) {
        var janFourthThisYear = new Date(date2.tm_year + 1900, 0, 4);
        var janFourthNextYear = new Date(date2.tm_year + 1901, 0, 4);
        var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
        var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
        var endDate = __addDays(new Date(date2.tm_year + 1900, 0, 1), date2.tm_yday);
        if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
          return "53";
        }
        if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
          return "01";
        }
        var daysDifference;
        if (firstWeekStartThisYear.getFullYear() < date2.tm_year + 1900) {
          daysDifference = date2.tm_yday + 32 - firstWeekStartThisYear.getDate();
        } else {
          daysDifference = date2.tm_yday + 1 - firstWeekStartThisYear.getDate();
        }
        return leadingNulls(Math.ceil(daysDifference / 7), 2);
      }, "%w": function(date2) {
        return date2.tm_wday;
      }, "%W": function(date2) {
        var janFirst = new Date(date2.tm_year, 0, 1);
        var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7 - janFirst.getDay() + 1);
        var endDate = new Date(date2.tm_year + 1900, date2.tm_mon, date2.tm_mday);
        if (compareByDay(firstMonday, endDate) < 0) {
          var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
          var firstMondayUntilEndJanuary = 31 - firstMonday.getDate();
          var days = firstMondayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
          return leadingNulls(Math.ceil(days / 7), 2);
        }
        return compareByDay(firstMonday, janFirst) === 0 ? "01" : "00";
      }, "%y": function(date2) {
        return (date2.tm_year + 1900).toString().substring(2);
      }, "%Y": function(date2) {
        return date2.tm_year + 1900;
      }, "%z": function(date2) {
        var off = date2.tm_gmtoff;
        var ahead = off >= 0;
        off = Math.abs(off) / 60;
        off = off / 60 * 100 + off % 60;
        return (ahead ? "+" : "-") + String("0000" + off).slice(-4);
      }, "%Z": function(date2) {
        return date2.tm_zone;
      }, "%%": function() {
        return "%";
      } };
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.includes(rule)) {
          pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_2[rule](date));
        }
      }
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      }
      writeArrayToMemory(bytes, s);
      return bytes.length - 1;
    }
    function _strftime_l(s, maxsize, format, tm) {
      return _strftime(s, maxsize, format, tm);
    }
    function _time(ptr) {
      var ret = Date.now() / 1e3 | 0;
      if (ptr) {
        HEAP32[ptr >> 2] = ret;
      }
      return ret;
    }
    var FSNode = function(parent, name, mode, rdev) {
      if (!parent) {
        parent = this;
      }
      this.parent = parent;
      this.mount = parent.mount;
      this.mounted = null;
      this.id = FS.nextInode++;
      this.name = name;
      this.mode = mode;
      this.node_ops = {};
      this.stream_ops = {};
      this.rdev = rdev;
    };
    var readMode = 292 | 73;
    var writeMode = 146;
    Object.defineProperties(FSNode.prototype, { read: { get: function() {
      return (this.mode & readMode) === readMode;
    }, set: function(val) {
      val ? this.mode |= readMode : this.mode &= ~readMode;
    } }, write: { get: function() {
      return (this.mode & writeMode) === writeMode;
    }, set: function(val) {
      val ? this.mode |= writeMode : this.mode &= ~writeMode;
    } }, isFolder: { get: function() {
      return FS.isDir(this.mode);
    } }, isDevice: { get: function() {
      return FS.isChrdev(this.mode);
    } } });
    FS.FSNode = FSNode;
    FS.staticInit();
    Module2["FS_createPath"] = FS.createPath;
    Module2["FS_createDataFile"] = FS.createDataFile;
    Module2["FS_createPreloadedFile"] = FS.createPreloadedFile;
    Module2["FS_createLazyFile"] = FS.createLazyFile;
    Module2["FS_createDevice"] = FS.createDevice;
    Module2["FS_unlink"] = FS.unlink;
    embind_init_charCodes();
    BindingError = Module2["BindingError"] = extendError(Error, "BindingError");
    InternalError = Module2["InternalError"] = extendError(Error, "InternalError");
    init_ClassHandle();
    init_RegisteredPointer();
    init_embind();
    UnboundTypeError = Module2["UnboundTypeError"] = extendError(Error, "UnboundTypeError");
    init_emval();
    Module2["requestFullscreen"] = function Module_requestFullscreen(lockPointer, resizeCanvas) {
      Browser.requestFullscreen(lockPointer, resizeCanvas);
    };
    Module2["requestAnimationFrame"] = function Module_requestAnimationFrame(func) {
      Browser.requestAnimationFrame(func);
    };
    Module2["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) {
      Browser.setCanvasSize(width, height, noUpdates);
    };
    Module2["pauseMainLoop"] = function Module_pauseMainLoop() {
      Browser.mainLoop.pause();
    };
    Module2["resumeMainLoop"] = function Module_resumeMainLoop() {
      Browser.mainLoop.resume();
    };
    Module2["getUserMedia"] = function Module_getUserMedia() {
      Browser.getUserMedia();
    };
    Module2["createContext"] = function Module_createContext(canvas, useWebGL, setInModule, webGLContextAttributes) {
      return Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes);
    };
    var GLctx;
    for (var i = 0; i < 32; ++i)
      tempFixedLengthArray.push(new Array(i));
    var miniTempWebGLFloatBuffersStorage = new Float32Array(288);
    for (var i = 0; i < 288; ++i) {
      miniTempWebGLFloatBuffers[i] = miniTempWebGLFloatBuffersStorage.subarray(0, i + 1);
    }
    function intArrayFromString(stringy, dontAddNull, length) {
      var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
      var u8array = new Array(len);
      var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
      if (dontAddNull)
        u8array.length = numBytesWritten;
      return u8array;
    }
    var asmLibraryArg = { "__clock_gettime": ___clock_gettime, "__cxa_allocate_exception": ___cxa_allocate_exception, "__cxa_rethrow": ___cxa_rethrow, "__cxa_throw": ___cxa_throw, "__gmtime_r": ___gmtime_r, "__syscall_fcntl64": ___syscall_fcntl64, "__syscall_fstatat64": ___syscall_fstatat64, "__syscall_ftruncate64": ___syscall_ftruncate64, "__syscall_getcwd": ___syscall_getcwd, "__syscall_getdents64": ___syscall_getdents64, "__syscall_ioctl": ___syscall_ioctl, "__syscall_lstat64": ___syscall_lstat64, "__syscall_mkdir": ___syscall_mkdir, "__syscall_mmap2": ___syscall_mmap2, "__syscall_munmap": ___syscall_munmap, "__syscall_open": ___syscall_open, "__syscall_readlink": ___syscall_readlink, "__syscall_stat64": ___syscall_stat64, "__syscall_unlink": ___syscall_unlink, "_dlopen_js": __dlopen_js, "_dlsym_js": __dlsym_js, "_embind_register_bigint": __embind_register_bigint, "_embind_register_bool": __embind_register_bool, "_embind_register_class": __embind_register_class, "_embind_register_class_class_function": __embind_register_class_class_function, "_embind_register_class_constructor": __embind_register_class_constructor, "_embind_register_class_function": __embind_register_class_function, "_embind_register_class_property": __embind_register_class_property, "_embind_register_emval": __embind_register_emval, "_embind_register_enum": __embind_register_enum, "_embind_register_enum_value": __embind_register_enum_value, "_embind_register_float": __embind_register_float, "_embind_register_function": __embind_register_function, "_embind_register_integer": __embind_register_integer, "_embind_register_memory_view": __embind_register_memory_view, "_embind_register_smart_ptr": __embind_register_smart_ptr, "_embind_register_std_string": __embind_register_std_string, "_embind_register_std_wstring": __embind_register_std_wstring, "_embind_register_void": __embind_register_void, "_emval_as": __emval_as, "_emval_call": __emval_call, "_emval_call_void_method": __emval_call_void_method, "_emval_decref": __emval_decref, "_emval_get_method_caller": __emval_get_method_caller, "_emval_get_module_property": __emval_get_module_property, "_emval_get_property": __emval_get_property, "_emval_incref": __emval_incref, "_emval_is_number": __emval_is_number, "_emval_new_cstring": __emval_new_cstring, "_emval_run_destructors": __emval_run_destructors, "_emval_set_property": __emval_set_property, "_emval_take_value": __emval_take_value, "abort": _abort, "alBufferData": _alBufferData, "alDeleteBuffers": _alDeleteBuffers, "alDeleteSources": _alDeleteSources, "alGenBuffers": _alGenBuffers, "alGenSources": _alGenSources, "alGetError": _alGetError, "alGetSourcei": _alGetSourcei, "alGetString": _alGetString, "alSourcePause": _alSourcePause, "alSourcePlay": _alSourcePlay, "alSourceStop": _alSourceStop, "alSourcef": _alSourcef, "alSourcei": _alSourcei, "alcCloseDevice": _alcCloseDevice, "alcCreateContext": _alcCreateContext, "alcDestroyContext": _alcDestroyContext, "alcGetError": _alcGetError, "alcGetString": _alcGetString, "alcMakeContextCurrent": _alcMakeContextCurrent, "alcOpenDevice": _alcOpenDevice, "clock_gettime": _clock_gettime, "create_video": create_video, "delete_video": delete_video, "emscripten_get_heap_max": _emscripten_get_heap_max, "emscripten_get_now": _emscripten_get_now, "emscripten_memcpy_big": _emscripten_memcpy_big, "emscripten_resize_heap": _emscripten_resize_heap, "environ_get": _environ_get, "environ_sizes_get": _environ_sizes_get, "exit": _exit, "fd_close": _fd_close, "fd_read": _fd_read, "fd_seek": _fd_seek, "fd_write": _fd_write, "get_camera_texture": get_camera_texture, "get_current_hostname": get_current_hostname, "getentropy": _getentropy, "gettimeofday": _gettimeofday, "glActiveTexture": _glActiveTexture, "glAttachShader": _glAttachShader, "glBindAttribLocation": _glBindAttribLocation, "glBindBuffer": _glBindBuffer, "glBindBufferRange": _glBindBufferRange, "glBindFramebuffer": _glBindFramebuffer, "glBindRenderbuffer": _glBindRenderbuffer, "glBindTexture": _glBindTexture, "glBindVertexArray": _glBindVertexArray, "glBlendEquation": _glBlendEquation, "glBlendFunc": _glBlendFunc, "glBlendFuncSeparate": _glBlendFuncSeparate, "glBlitFramebuffer": _glBlitFramebuffer, "glBufferData": _glBufferData, "glBufferSubData": _glBufferSubData, "glClear": _glClear, "glClearBufferfv": _glClearBufferfv, "glClearColor": _glClearColor, "glClearDepthf": _glClearDepthf, "glColorMask": _glColorMask, "glCompileShader": _glCompileShader, "glCompressedTexImage2D": _glCompressedTexImage2D, "glCompressedTexImage3D": _glCompressedTexImage3D, "glCopyTexSubImage2D": _glCopyTexSubImage2D, "glCreateProgram": _glCreateProgram, "glCreateShader": _glCreateShader, "glDeleteBuffers": _glDeleteBuffers, "glDeleteFramebuffers": _glDeleteFramebuffers, "glDeleteProgram": _glDeleteProgram, "glDeleteRenderbuffers": _glDeleteRenderbuffers, "glDeleteShader": _glDeleteShader, "glDeleteTextures": _glDeleteTextures, "glDeleteVertexArrays": _glDeleteVertexArrays, "glDepthFunc": _glDepthFunc, "glDepthMask": _glDepthMask, "glDisable": _glDisable, "glDrawArrays": _glDrawArrays, "glDrawArraysInstanced": _glDrawArraysInstanced, "glDrawBuffers": _glDrawBuffers, "glDrawElements": _glDrawElements, "glDrawElementsInstanced": _glDrawElementsInstanced, "glEnable": _glEnable, "glEnableVertexAttribArray": _glEnableVertexAttribArray, "glFramebufferRenderbuffer": _glFramebufferRenderbuffer, "glFramebufferTexture2D": _glFramebufferTexture2D, "glFrontFace": _glFrontFace, "glGenBuffers": _glGenBuffers, "glGenFramebuffers": _glGenFramebuffers, "glGenRenderbuffers": _glGenRenderbuffers, "glGenTextures": _glGenTextures, "glGenVertexArrays": _glGenVertexArrays, "glGenerateMipmap": _glGenerateMipmap, "glGetError": _glGetError, "glGetIntegerv": _glGetIntegerv, "glGetProgramInfoLog": _glGetProgramInfoLog, "glGetProgramiv": _glGetProgramiv, "glGetShaderInfoLog": _glGetShaderInfoLog, "glGetShaderiv": _glGetShaderiv, "glGetString": _glGetString, "glGetUniformLocation": _glGetUniformLocation, "glInvalidateFramebuffer": _glInvalidateFramebuffer, "glLinkProgram": _glLinkProgram, "glPixelStorei": _glPixelStorei, "glReadPixels": _glReadPixels, "glRenderbufferStorage": _glRenderbufferStorage, "glRenderbufferStorageMultisample": _glRenderbufferStorageMultisample, "glShaderSource": _glShaderSource, "glTexImage2D": _glTexImage2D, "glTexImage3D": _glTexImage3D, "glTexParameteri": _glTexParameteri, "glTexStorage2D": _glTexStorage2D, "glTexStorage3D": _glTexStorage3D, "glTexSubImage2D": _glTexSubImage2D, "glTexSubImage3D": _glTexSubImage3D, "glUniform1f": _glUniform1f, "glUniform1i": _glUniform1i, "glUniform1ui": _glUniform1ui, "glUniform2f": _glUniform2f, "glUniform2fv": _glUniform2fv, "glUniform4fv": _glUniform4fv, "glUniformMatrix4fv": _glUniformMatrix4fv, "glUseProgram": _glUseProgram, "glVertexAttribIPointer": _glVertexAttribIPointer, "glVertexAttribPointer": _glVertexAttribPointer, "glViewport": _glViewport, "gmtime_r": _gmtime_r, "is_electron": is_electron, "localtime_r": _localtime_r, "mktime": _mktime, "setTempRet0": _setTempRet0, "strftime_l": _strftime_l, "time": _time };
    createWasm();
    Module2["___wasm_call_ctors"] = function() {
      return (Module2["___wasm_call_ctors"] = Module2["asm"]["__wasm_call_ctors"]).apply(null, arguments);
    };
    var _malloc = Module2["_malloc"] = function() {
      return (_malloc = Module2["_malloc"] = Module2["asm"]["malloc"]).apply(null, arguments);
    };
    var ___errno_location = Module2["___errno_location"] = function() {
      return (___errno_location = Module2["___errno_location"] = Module2["asm"]["__errno_location"]).apply(null, arguments);
    };
    var _free = Module2["_free"] = function() {
      return (_free = Module2["_free"] = Module2["asm"]["free"]).apply(null, arguments);
    };
    var ___getTypeName = Module2["___getTypeName"] = function() {
      return (___getTypeName = Module2["___getTypeName"] = Module2["asm"]["__getTypeName"]).apply(null, arguments);
    };
    Module2["___embind_register_native_and_builtin_types"] = function() {
      return (Module2["___embind_register_native_and_builtin_types"] = Module2["asm"]["__embind_register_native_and_builtin_types"]).apply(null, arguments);
    };
    var __get_tzname = Module2["__get_tzname"] = function() {
      return (__get_tzname = Module2["__get_tzname"] = Module2["asm"]["_get_tzname"]).apply(null, arguments);
    };
    var __get_daylight = Module2["__get_daylight"] = function() {
      return (__get_daylight = Module2["__get_daylight"] = Module2["asm"]["_get_daylight"]).apply(null, arguments);
    };
    var __get_timezone = Module2["__get_timezone"] = function() {
      return (__get_timezone = Module2["__get_timezone"] = Module2["asm"]["_get_timezone"]).apply(null, arguments);
    };
    var stackAlloc = Module2["stackAlloc"] = function() {
      return (stackAlloc = Module2["stackAlloc"] = Module2["asm"]["stackAlloc"]).apply(null, arguments);
    };
    var _memalign = Module2["_memalign"] = function() {
      return (_memalign = Module2["_memalign"] = Module2["asm"]["memalign"]).apply(null, arguments);
    };
    Module2["dynCall_ji"] = function() {
      return (Module2["dynCall_ji"] = Module2["asm"]["dynCall_ji"]).apply(null, arguments);
    };
    Module2["dynCall_jjj"] = function() {
      return (Module2["dynCall_jjj"] = Module2["asm"]["dynCall_jjj"]).apply(null, arguments);
    };
    Module2["dynCall_viij"] = function() {
      return (Module2["dynCall_viij"] = Module2["asm"]["dynCall_viij"]).apply(null, arguments);
    };
    Module2["dynCall_jii"] = function() {
      return (Module2["dynCall_jii"] = Module2["asm"]["dynCall_jii"]).apply(null, arguments);
    };
    Module2["dynCall_jiii"] = function() {
      return (Module2["dynCall_jiii"] = Module2["asm"]["dynCall_jiii"]).apply(null, arguments);
    };
    Module2["dynCall_viiij"] = function() {
      return (Module2["dynCall_viiij"] = Module2["asm"]["dynCall_viiij"]).apply(null, arguments);
    };
    Module2["dynCall_viijjiii"] = function() {
      return (Module2["dynCall_viijjiii"] = Module2["asm"]["dynCall_viijjiii"]).apply(null, arguments);
    };
    Module2["dynCall_iiiiji"] = function() {
      return (Module2["dynCall_iiiiji"] = Module2["asm"]["dynCall_iiiiji"]).apply(null, arguments);
    };
    Module2["dynCall_iiiijii"] = function() {
      return (Module2["dynCall_iiiijii"] = Module2["asm"]["dynCall_iiiijii"]).apply(null, arguments);
    };
    Module2["dynCall_iiffj"] = function() {
      return (Module2["dynCall_iiffj"] = Module2["asm"]["dynCall_iiffj"]).apply(null, arguments);
    };
    Module2["dynCall_jijjiii"] = function() {
      return (Module2["dynCall_jijjiii"] = Module2["asm"]["dynCall_jijjiii"]).apply(null, arguments);
    };
    Module2["dynCall_vij"] = function() {
      return (Module2["dynCall_vij"] = Module2["asm"]["dynCall_vij"]).apply(null, arguments);
    };
    Module2["dynCall_jiji"] = function() {
      return (Module2["dynCall_jiji"] = Module2["asm"]["dynCall_jiji"]).apply(null, arguments);
    };
    Module2["dynCall_iiiijj"] = function() {
      return (Module2["dynCall_iiiijj"] = Module2["asm"]["dynCall_iiiijj"]).apply(null, arguments);
    };
    Module2["dynCall_viijj"] = function() {
      return (Module2["dynCall_viijj"] = Module2["asm"]["dynCall_viijj"]).apply(null, arguments);
    };
    Module2["dynCall_viiijjjj"] = function() {
      return (Module2["dynCall_viiijjjj"] = Module2["asm"]["dynCall_viiijjjj"]).apply(null, arguments);
    };
    Module2["dynCall_vijjiii"] = function() {
      return (Module2["dynCall_vijjiii"] = Module2["asm"]["dynCall_vijjiii"]).apply(null, arguments);
    };
    Module2["dynCall_viiiji"] = function() {
      return (Module2["dynCall_viiiji"] = Module2["asm"]["dynCall_viiiji"]).apply(null, arguments);
    };
    Module2["dynCall_viiijii"] = function() {
      return (Module2["dynCall_viiijii"] = Module2["asm"]["dynCall_viiijii"]).apply(null, arguments);
    };
    Module2["dynCall_iiiiiij"] = function() {
      return (Module2["dynCall_iiiiiij"] = Module2["asm"]["dynCall_iiiiiij"]).apply(null, arguments);
    };
    Module2["dynCall_viji"] = function() {
      return (Module2["dynCall_viji"] = Module2["asm"]["dynCall_viji"]).apply(null, arguments);
    };
    Module2["dynCall_vijii"] = function() {
      return (Module2["dynCall_vijii"] = Module2["asm"]["dynCall_vijii"]).apply(null, arguments);
    };
    Module2["dynCall_vijij"] = function() {
      return (Module2["dynCall_vijij"] = Module2["asm"]["dynCall_vijij"]).apply(null, arguments);
    };
    Module2["dynCall_vijiii"] = function() {
      return (Module2["dynCall_vijiii"] = Module2["asm"]["dynCall_vijiii"]).apply(null, arguments);
    };
    Module2["dynCall_vijiiif"] = function() {
      return (Module2["dynCall_vijiiif"] = Module2["asm"]["dynCall_vijiiif"]).apply(null, arguments);
    };
    Module2["dynCall_viiiij"] = function() {
      return (Module2["dynCall_viiiij"] = Module2["asm"]["dynCall_viiiij"]).apply(null, arguments);
    };
    Module2["dynCall_viiiiji"] = function() {
      return (Module2["dynCall_viiiiji"] = Module2["asm"]["dynCall_viiiiji"]).apply(null, arguments);
    };
    Module2["dynCall_iiiji"] = function() {
      return (Module2["dynCall_iiiji"] = Module2["asm"]["dynCall_iiiji"]).apply(null, arguments);
    };
    Module2["dynCall_viiijj"] = function() {
      return (Module2["dynCall_viiijj"] = Module2["asm"]["dynCall_viiijj"]).apply(null, arguments);
    };
    Module2["dynCall_viijii"] = function() {
      return (Module2["dynCall_viijii"] = Module2["asm"]["dynCall_viijii"]).apply(null, arguments);
    };
    Module2["dynCall_iiiiij"] = function() {
      return (Module2["dynCall_iiiiij"] = Module2["asm"]["dynCall_iiiiij"]).apply(null, arguments);
    };
    Module2["dynCall_iiiiijj"] = function() {
      return (Module2["dynCall_iiiiijj"] = Module2["asm"]["dynCall_iiiiijj"]).apply(null, arguments);
    };
    Module2["dynCall_iiiiiijj"] = function() {
      return (Module2["dynCall_iiiiiijj"] = Module2["asm"]["dynCall_iiiiiijj"]).apply(null, arguments);
    };
    Module2["dynCall_jijiii"] = function() {
      return (Module2["dynCall_jijiii"] = Module2["asm"]["dynCall_jijiii"]).apply(null, arguments);
    };
    Module2["dynCall_jijiiii"] = function() {
      return (Module2["dynCall_jijiiii"] = Module2["asm"]["dynCall_jijiiii"]).apply(null, arguments);
    };
    Module2["dynCall_jijii"] = function() {
      return (Module2["dynCall_jijii"] = Module2["asm"]["dynCall_jijii"]).apply(null, arguments);
    };
    Module2["dynCall_jijiiiiii"] = function() {
      return (Module2["dynCall_jijiiiiii"] = Module2["asm"]["dynCall_jijiiiiii"]).apply(null, arguments);
    };
    Module2["dynCall_jijj"] = function() {
      return (Module2["dynCall_jijj"] = Module2["asm"]["dynCall_jijj"]).apply(null, arguments);
    };
    Module2["dynCall_iijijjji"] = function() {
      return (Module2["dynCall_iijijjji"] = Module2["asm"]["dynCall_iijijjji"]).apply(null, arguments);
    };
    Module2["dynCall_iiiij"] = function() {
      return (Module2["dynCall_iiiij"] = Module2["asm"]["dynCall_iiiij"]).apply(null, arguments);
    };
    Module2["dynCall_iiji"] = function() {
      return (Module2["dynCall_iiji"] = Module2["asm"]["dynCall_iiji"]).apply(null, arguments);
    };
    Module2["dynCall_jijij"] = function() {
      return (Module2["dynCall_jijij"] = Module2["asm"]["dynCall_jijij"]).apply(null, arguments);
    };
    Module2["dynCall_iijijji"] = function() {
      return (Module2["dynCall_iijijji"] = Module2["asm"]["dynCall_iijijji"]).apply(null, arguments);
    };
    Module2["dynCall_jij"] = function() {
      return (Module2["dynCall_jij"] = Module2["asm"]["dynCall_jij"]).apply(null, arguments);
    };
    Module2["addRunDependency"] = addRunDependency;
    Module2["removeRunDependency"] = removeRunDependency;
    Module2["FS_createPath"] = FS.createPath;
    Module2["FS_createDataFile"] = FS.createDataFile;
    Module2["FS_createPreloadedFile"] = FS.createPreloadedFile;
    Module2["FS_createLazyFile"] = FS.createLazyFile;
    Module2["FS_createDevice"] = FS.createDevice;
    Module2["FS_unlink"] = FS.unlink;
    Module2["FS"] = FS;
    Module2["GL"] = GL;
    var calledRun;
    function ExitStatus(status) {
      this.name = "ExitStatus";
      this.message = "Program terminated with exit(" + status + ")";
      this.status = status;
    }
    dependenciesFulfilled = function runCaller() {
      if (!calledRun)
        run();
      if (!calledRun)
        dependenciesFulfilled = runCaller;
    };
    function run(args) {
      if (runDependencies > 0) {
        return;
      }
      preRun();
      if (runDependencies > 0) {
        return;
      }
      function doRun() {
        if (calledRun)
          return;
        calledRun = true;
        Module2["calledRun"] = true;
        if (ABORT)
          return;
        initRuntime();
        readyPromiseResolve(Module2);
        if (Module2["onRuntimeInitialized"])
          Module2["onRuntimeInitialized"]();
        postRun();
      }
      if (Module2["setStatus"]) {
        Module2["setStatus"]("Running...");
        setTimeout(function() {
          setTimeout(function() {
            Module2["setStatus"]("");
          }, 1);
          doRun();
        }, 1);
      } else {
        doRun();
      }
    }
    Module2["run"] = run;
    function exit(status, implicit) {
      EXITSTATUS = status;
      if (keepRuntimeAlive())
        ;
      else {
        exitRuntime();
      }
      procExit(status);
    }
    function procExit(code) {
      EXITSTATUS = code;
      if (!keepRuntimeAlive()) {
        if (Module2["onExit"])
          Module2["onExit"](code);
        ABORT = true;
      }
      quit_(code, new ExitStatus(code));
    }
    if (Module2["preInit"]) {
      if (typeof Module2["preInit"] == "function")
        Module2["preInit"] = [Module2["preInit"]];
      while (Module2["preInit"].length > 0) {
        Module2["preInit"].pop()();
      }
    }
    run();
    autoResumeAudioContext = function() {
    };
    return Module2.ready;
  };
})();
const simd = async () => WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]));
const fromFolder = (folder) => {
  if (folder !== "" && !folder.endsWith("/"))
    folder += "/";
  return (fileName) => folder + fileName;
};
const fromMapper = (map) => (fileName) => map[fileName];
const withSimd = async (originalLocateFile, logger = {}) => {
  var _a2, _b2, _c2, _d2;
  const isSupported = await simd();
  if (!isSupported) {
    (_a2 = logger.info) === null || _a2 === void 0 ? void 0 : _a2.call(logger, `The platform does not support SIMD. Using "BanubaSDK.wasm"`);
    return originalLocateFile;
  } else {
    (_b2 = logger.info) === null || _b2 === void 0 ? void 0 : _b2.call(logger, `The platform supports SIMD. Going to use "BanubaSDK.simd.wasm"`);
  }
  const simdFileLocation = originalLocateFile("BanubaSDK.simd.wasm");
  if (!simdFileLocation) {
    (_c2 = logger.warn) === null || _c2 === void 0 ? void 0 : _c2.call(logger, `"BanubaSDK.simd.wasm" is missing in the "locateFile" option. Using "BanubaSDK.wasm" as a fallback`);
    return originalLocateFile;
  }
  const exists = await fetch(simdFileLocation, { method: "HEAD" }).then((r) => r.ok);
  if (!exists) {
    (_d2 = logger.warn) === null || _d2 === void 0 ? void 0 : _d2.call(logger, `Unable to fetch "BanubaSDK.simd.wasm" from the "${simdFileLocation}". Using "BanubaSDK.wasm" as a fallback`);
    return originalLocateFile;
  }
  return (fileName) => {
    const [name, ext] = fileName.split(".");
    if (ext !== "wasm")
      return originalLocateFile(fileName);
    const simdFileName = [name, "simd", ext].join(".");
    return originalLocateFile(simdFileName);
  };
};
const createLocateFile = async (locateFile, logger) => {
  if (typeof locateFile === "string")
    locateFile = fromFolder(locateFile);
  if (typeof locateFile === "object")
    locateFile = fromMapper(locateFile);
  locateFile = await withSimd(locateFile, logger);
  return locateFile;
};
const TidyScope = (() => {
  const stack = [];
  return {
    start() {
      stack.push([]);
    },
    add(obj) {
      const objects = stack[stack.length - 1];
      if (objects)
        objects.push(obj);
    },
    remove(obj) {
      const objects = stack[stack.length - 1];
      if (!objects)
        return;
      const idx = objects.findIndex((x) => x === obj);
      if (idx === -1)
        return;
      objects.splice(idx, 1);
    },
    end() {
      const objects = stack.pop();
      if (objects)
        for (const obj of objects)
          obj.isDeleted() || obj.delete();
    }
  };
})();
class FinalizationGroup {
  register(target) {
    TidyScope.add(target);
  }
  unregister() {
  }
}
const keep = (obj) => {
  TidyScope.remove(obj);
  return obj;
};
const tidy = (fn) => {
  try {
    TidyScope.start();
    const ret = fn();
    if (isEmscriptenObject(ret))
      return keep(ret);
    return ret;
  } finally {
    TidyScope.end();
  }
};
function isEmscriptenObject(obj) {
  if (obj == null)
    return false;
  if (typeof obj !== "object")
    return false;
  return ["isAliasOf", "clone", "delete", "isDeleted", "deleteLater"].every((prop) => prop in obj);
}
var LogLevel;
(function(LogLevel2) {
  LogLevel2["ERROR"] = "error";
  LogLevel2["WARNING"] = "warn";
  LogLevel2["INFO"] = "info";
  LogLevel2["DEBUG"] = "debug";
})(LogLevel || (LogLevel = {}));
function getLoggingOptions(logger) {
  var _a2;
  const logLevel = (_a2 = Object.keys(LogLevel).reverse().find((level) => typeof logger[LogLevel[level]] === "function")) !== null && _a2 !== void 0 ? _a2 : "ERROR";
  const print = (msg) => {
    for (const level in LogLevel) {
      if (msg.includes(level)) {
        const method = logger[LogLevel[level]];
        if (typeof method === "function") {
          method.call(logger, msg);
          return;
        }
      }
    }
    const debug = logger[LogLevel.DEBUG];
    if (typeof debug === "function")
      debug.call(logger, msg);
  };
  return {
    logLevel,
    print,
    printErr: print
  };
}
async function createSDK({ clientToken, locateFile: fileLocator = "", canvas = createCanvas$1(), logger = { warn: console.warn, error: console.error }, ...rest }) {
  var _a2;
  const locateFile = await createLocateFile(fileLocator, logger);
  const { logLevel, print, printErr } = getLoggingOptions(logger);
  const Module$1 = await new Promise((resolve, reject) => Module({
    locateFile,
    FinalizationGroup,
    print,
    printErr,
    onAbort: (error) => {
      if (error instanceof WebAssembly.CompileError)
        reject(new Error(`Failed to compile "BanubaSDK.wasm": the file "${locateFile("BanubaSDK.wasm")}" is invalid. This error is usually caused by misconfigured "locateFile" option, see https://docs.banuba.com/face-ar-sdk-v1/generated/typedoc/modules.html#SDKOptions. Original Error: ` + error));
    },
    ...rest
  }).then(resolve, reject));
  try {
    tidy(() => {
      Module$1.UtilityManager.initialize(new Module$1.VectorString(), clientToken);
      Module$1.UtilityManager.setLogLevel(Module$1.SeverityLevel[logLevel]);
    });
  } catch (error) {
    if (typeof error === "number")
      error = new Error(Module$1.getExceptionMessage(error));
    throw error;
  }
  Module$1.createContext(canvas, true, true, {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
    stencil: false
  });
  Module$1.canvas = canvas;
  if (typeof WebGL2RenderingContext === "undefined") {
    const areDepthTexturesSupported = [
      "WEBGL_depth_texture",
      "ANGLE_depth_texture",
      "GL_ANGLE_depth_texture",
      "OES_texture_half_float"
    ].every((ext) => {
      var _a3;
      return (_a3 = Module$1.canvas.getContext("webgl")) === null || _a3 === void 0 ? void 0 : _a3.getExtension(ext);
    });
    if (!areDepthTexturesSupported)
      (_a2 = logger.warn) === null || _a2 === void 0 ? void 0 : _a2.call(logger, "Depth textures are not supported on the current device.");
  }
  return Module$1;
}
function createCanvas$1() {
  const canvas = document.createElement("canvas");
  canvas.style.maxWidth = "100%";
  canvas.style.objectFit = "cover";
  return canvas;
}
const _fetch = (input, init, addons) => fetch(input, init).then((response) => {
  if (!response.body)
    return response;
  let transferred = 0;
  const total = Number(response.headers.get("content-length") || 0);
  const reader = response.body.getReader();
  return new Response(new ReadableStream({
    async start(controller) {
      var _a2;
      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done)
          transferred = total;
        else
          transferred += chunk.byteLength;
        (_a2 = addons === null || addons === void 0 ? void 0 : addons.onProgress) === null || _a2 === void 0 ? void 0 : _a2.call(addons, { total, transferred });
        if (done)
          break;
        else
          controller.enqueue(chunk);
      }
      controller.close();
    }
  }), response);
});
var Unzip = `(function () {
   'use strict';

   // DEFLATE is a complex format; to read this code, you should probably check the RFC first:

   // aliases for shorter compressed code (most minifers don't do this)
   var u8 = Uint8Array, u16 = Uint16Array, u32 = Uint32Array;
   // fixed length extra bits
   var fleb = new u8([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, /* unused */ 0, 0, /* impossible */ 0]);
   // fixed distance extra bits
   // see fleb note
   var fdeb = new u8([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, /* unused */ 0, 0]);
   // code length index map
   var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
   // get base, reverse index map from extra bits
   var freb = function (eb, start) {
       var b = new u16(31);
       for (var i = 0; i < 31; ++i) {
           b[i] = start += 1 << eb[i - 1];
       }
       // numbers here are at max 18 bits
       var r = new u32(b[30]);
       for (var i = 1; i < 30; ++i) {
           for (var j = b[i]; j < b[i + 1]; ++j) {
               r[j] = ((j - b[i]) << 5) | i;
           }
       }
       return [b, r];
   };
   var _a = freb(fleb, 2), fl = _a[0], revfl = _a[1];
   // we can ignore the fact that the other numbers are wrong; they never happen anyway
   fl[28] = 258, revfl[258] = 28;
   var _b = freb(fdeb, 0), fd = _b[0];
   // map of value to reverse (assuming 16 bits)
   var rev = new u16(32768);
   for (var i = 0; i < 32768; ++i) {
       // reverse table algorithm from SO
       var x = ((i & 0xAAAA) >>> 1) | ((i & 0x5555) << 1);
       x = ((x & 0xCCCC) >>> 2) | ((x & 0x3333) << 2);
       x = ((x & 0xF0F0) >>> 4) | ((x & 0x0F0F) << 4);
       rev[i] = (((x & 0xFF00) >>> 8) | ((x & 0x00FF) << 8)) >>> 1;
   }
   // create huffman tree from u8 "map": index -> code length for code index
   // mb (max bits) must be at most 15
   // TODO: optimize/split up?
   var hMap = (function (cd, mb, r) {
       var s = cd.length;
       // index
       var i = 0;
       // u16 "map": index -> # of codes with bit length = index
       var l = new u16(mb);
       // length of cd must be 288 (total # of codes)
       for (; i < s; ++i) {
           if (cd[i])
               ++l[cd[i] - 1];
       }
       // u16 "map": index -> minimum code for bit length = index
       var le = new u16(mb);
       for (i = 0; i < mb; ++i) {
           le[i] = (le[i - 1] + l[i - 1]) << 1;
       }
       var co;
       if (r) {
           // u16 "map": index -> number of actual bits, symbol for code
           co = new u16(1 << mb);
           // bits to remove for reverser
           var rvb = 15 - mb;
           for (i = 0; i < s; ++i) {
               // ignore 0 lengths
               if (cd[i]) {
                   // num encoding both symbol and bits read
                   var sv = (i << 4) | cd[i];
                   // free bits
                   var r_1 = mb - cd[i];
                   // start value
                   var v = le[cd[i] - 1]++ << r_1;
                   // m is end value
                   for (var m = v | ((1 << r_1) - 1); v <= m; ++v) {
                       // every 16 bit value starting with the code yields the same result
                       co[rev[v] >>> rvb] = sv;
                   }
               }
           }
       }
       else {
           co = new u16(s);
           for (i = 0; i < s; ++i) {
               if (cd[i]) {
                   co[i] = rev[le[cd[i] - 1]++] >>> (15 - cd[i]);
               }
           }
       }
       return co;
   });
   // fixed length tree
   var flt = new u8(288);
   for (var i = 0; i < 144; ++i)
       flt[i] = 8;
   for (var i = 144; i < 256; ++i)
       flt[i] = 9;
   for (var i = 256; i < 280; ++i)
       flt[i] = 7;
   for (var i = 280; i < 288; ++i)
       flt[i] = 8;
   // fixed distance tree
   var fdt = new u8(32);
   for (var i = 0; i < 32; ++i)
       fdt[i] = 5;
   // fixed length map
   var flrm = /*#__PURE__*/ hMap(flt, 9, 1);
   // fixed distance map
   var fdrm = /*#__PURE__*/ hMap(fdt, 5, 1);
   // find max of array
   var max = function (a) {
       var m = a[0];
       for (var i = 1; i < a.length; ++i) {
           if (a[i] > m)
               m = a[i];
       }
       return m;
   };
   // read d, starting at bit p and mask with m
   var bits = function (d, p, m) {
       var o = (p / 8) | 0;
       return ((d[o] | (d[o + 1] << 8)) >> (p & 7)) & m;
   };
   // read d, starting at bit p continuing for at least 16 bits
   var bits16 = function (d, p) {
       var o = (p / 8) | 0;
       return ((d[o] | (d[o + 1] << 8) | (d[o + 2] << 16)) >> (p & 7));
   };
   // get end of byte
   var shft = function (p) { return ((p + 7) / 8) | 0; };
   // typed array slice - allows garbage collector to free original reference,
   // while being more compatible than .slice
   var slc = function (v, s, e) {
       if (s == null || s < 0)
           s = 0;
       if (e == null || e > v.length)
           e = v.length;
       // can't use .constructor in case user-supplied
       var n = new (v.BYTES_PER_ELEMENT == 2 ? u16 : v.BYTES_PER_ELEMENT == 4 ? u32 : u8)(e - s);
       n.set(v.subarray(s, e));
       return n;
   };
   // error codes
   var ec = [
       'unexpected EOF',
       'invalid block type',
       'invalid length/literal',
       'invalid distance',
       'stream finished',
       'no stream handler',
       ,
       'no callback',
       'invalid UTF-8 data',
       'extra field too long',
       'date not in range 1980-2099',
       'filename too long',
       'stream finishing',
       'invalid zip data'
       // determined by unknown compression method
   ];
   var err = function (ind, msg, nt) {
       var e = new Error(msg || ec[ind]);
       e.code = ind;
       if (Error.captureStackTrace)
           Error.captureStackTrace(e, err);
       if (!nt)
           throw e;
       return e;
   };
   // expands raw DEFLATE data
   var inflt = function (dat, buf, st) {
       // source length
       var sl = dat.length;
       if (!sl || (st && st.f && !st.l))
           return buf || new u8(0);
       // have to estimate size
       var noBuf = !buf || st;
       // no state
       var noSt = !st || st.i;
       if (!st)
           st = {};
       // Assumes roughly 33% compression ratio average
       if (!buf)
           buf = new u8(sl * 3);
       // ensure buffer can fit at least l elements
       var cbuf = function (l) {
           var bl = buf.length;
           // need to increase size to fit
           if (l > bl) {
               // Double or set to necessary, whichever is greater
               var nbuf = new u8(Math.max(bl * 2, l));
               nbuf.set(buf);
               buf = nbuf;
           }
       };
       //  last chunk         bitpos           bytes
       var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
       // total bits
       var tbts = sl * 8;
       do {
           if (!lm) {
               // BFINAL - this is only 1 when last chunk is next
               final = bits(dat, pos, 1);
               // type: 0 = no compression, 1 = fixed huffman, 2 = dynamic huffman
               var type = bits(dat, pos + 1, 3);
               pos += 3;
               if (!type) {
                   // go to end of byte boundary
                   var s = shft(pos) + 4, l = dat[s - 4] | (dat[s - 3] << 8), t = s + l;
                   if (t > sl) {
                       if (noSt)
                           err(0);
                       break;
                   }
                   // ensure size
                   if (noBuf)
                       cbuf(bt + l);
                   // Copy over uncompressed data
                   buf.set(dat.subarray(s, t), bt);
                   // Get new bitpos, update byte count
                   st.b = bt += l, st.p = pos = t * 8, st.f = final;
                   continue;
               }
               else if (type == 1)
                   lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
               else if (type == 2) {
                   //  literal                            lengths
                   var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
                   var tl = hLit + bits(dat, pos + 5, 31) + 1;
                   pos += 14;
                   // length+distance tree
                   var ldt = new u8(tl);
                   // code length tree
                   var clt = new u8(19);
                   for (var i = 0; i < hcLen; ++i) {
                       // use index map to get real code
                       clt[clim[i]] = bits(dat, pos + i * 3, 7);
                   }
                   pos += hcLen * 3;
                   // code lengths bits
                   var clb = max(clt), clbmsk = (1 << clb) - 1;
                   // code lengths map
                   var clm = hMap(clt, clb, 1);
                   for (var i = 0; i < tl;) {
                       var r = clm[bits(dat, pos, clbmsk)];
                       // bits read
                       pos += r & 15;
                       // symbol
                       var s = r >>> 4;
                       // code length to copy
                       if (s < 16) {
                           ldt[i++] = s;
                       }
                       else {
                           //  copy   count
                           var c = 0, n = 0;
                           if (s == 16)
                               n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
                           else if (s == 17)
                               n = 3 + bits(dat, pos, 7), pos += 3;
                           else if (s == 18)
                               n = 11 + bits(dat, pos, 127), pos += 7;
                           while (n--)
                               ldt[i++] = c;
                       }
                   }
                   //    length tree                 distance tree
                   var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
                   // max length bits
                   lbt = max(lt);
                   // max dist bits
                   dbt = max(dt);
                   lm = hMap(lt, lbt, 1);
                   dm = hMap(dt, dbt, 1);
               }
               else
                   err(1);
               if (pos > tbts) {
                   if (noSt)
                       err(0);
                   break;
               }
           }
           // Make sure the buffer can hold this + the largest possible addition
           // Maximum chunk size (practically, theoretically infinite) is 2^17;
           if (noBuf)
               cbuf(bt + 131072);
           var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
           var lpos = pos;
           for (;; lpos = pos) {
               // bits read, code
               var c = lm[bits16(dat, pos) & lms], sym = c >>> 4;
               pos += c & 15;
               if (pos > tbts) {
                   if (noSt)
                       err(0);
                   break;
               }
               if (!c)
                   err(2);
               if (sym < 256)
                   buf[bt++] = sym;
               else if (sym == 256) {
                   lpos = pos, lm = null;
                   break;
               }
               else {
                   var add = sym - 254;
                   // no extra bits needed if less
                   if (sym > 264) {
                       // index
                       var i = sym - 257, b = fleb[i];
                       add = bits(dat, pos, (1 << b) - 1) + fl[i];
                       pos += b;
                   }
                   // dist
                   var d = dm[bits16(dat, pos) & dms], dsym = d >>> 4;
                   if (!d)
                       err(3);
                   pos += d & 15;
                   var dt = fd[dsym];
                   if (dsym > 3) {
                       var b = fdeb[dsym];
                       dt += bits16(dat, pos) & ((1 << b) - 1), pos += b;
                   }
                   if (pos > tbts) {
                       if (noSt)
                           err(0);
                       break;
                   }
                   if (noBuf)
                       cbuf(bt + 131072);
                   var end = bt + add;
                   for (; bt < end; bt += 4) {
                       buf[bt] = buf[bt - dt];
                       buf[bt + 1] = buf[bt + 1 - dt];
                       buf[bt + 2] = buf[bt + 2 - dt];
                       buf[bt + 3] = buf[bt + 3 - dt];
                   }
                   bt = end;
               }
           }
           st.l = lm, st.p = lpos, st.b = bt, st.f = final;
           if (lm)
               final = 1, st.m = lbt, st.d = dm, st.n = dbt;
       } while (!final);
       return bt == buf.length ? buf : slc(buf, 0, bt);
   };
   // empty
   var et = /*#__PURE__*/ new u8(0);
   // read 2 bytes
   var b2 = function (d, b) { return d[b] | (d[b + 1] << 8); };
   // read 4 bytes
   var b4 = function (d, b) { return (d[b] | (d[b + 1] << 8) | (d[b + 2] << 16) | (d[b + 3] << 24)) >>> 0; };
   var b8 = function (d, b) { return b4(d, b) + (b4(d, b + 4) * 4294967296); };
   /**
    * Expands DEFLATE data with no wrapper
    * @param data The data to decompress
    * @param out Where to write the data. Saves memory if you know the decompressed size and provide an output buffer of that length.
    * @returns The decompressed version of the data
    */
   function inflateSync(data, out) {
       return inflt(data, out);
   }
   // text decoder
   var td = typeof TextDecoder != 'undefined' && /*#__PURE__*/ new TextDecoder();
   // text decoder stream
   var tds = 0;
   try {
       td.decode(et, { stream: true });
       tds = 1;
   }
   catch (e) { }
   // decode UTF8
   var dutf8 = function (d) {
       for (var r = '', i = 0;;) {
           var c = d[i++];
           var eb = (c > 127) + (c > 223) + (c > 239);
           if (i + eb > d.length)
               return [r, slc(d, i - 1)];
           if (!eb)
               r += String.fromCharCode(c);
           else if (eb == 3) {
               c = ((c & 15) << 18 | (d[i++] & 63) << 12 | (d[i++] & 63) << 6 | (d[i++] & 63)) - 65536,
                   r += String.fromCharCode(55296 | (c >> 10), 56320 | (c & 1023));
           }
           else if (eb & 1)
               r += String.fromCharCode((c & 31) << 6 | (d[i++] & 63));
           else
               r += String.fromCharCode((c & 15) << 12 | (d[i++] & 63) << 6 | (d[i++] & 63));
       }
   };
   /**
    * Converts a Uint8Array to a string
    * @param dat The data to decode to string
    * @param latin1 Whether or not to interpret the data as Latin-1. This should
    *               not need to be true unless encoding to binary string.
    * @returns The original UTF-8/Latin-1 string
    */
   function strFromU8(dat, latin1) {
       if (latin1) {
           var r = '';
           for (var i = 0; i < dat.length; i += 16384)
               r += String.fromCharCode.apply(null, dat.subarray(i, i + 16384));
           return r;
       }
       else if (td)
           return td.decode(dat);
       else {
           var _a = dutf8(dat), out = _a[0], ext = _a[1];
           if (ext.length)
               err(8);
           return out;
       }
   }
   // skip local zip header
   var slzh = function (d, b) { return b + 30 + b2(d, b + 26) + b2(d, b + 28); };
   // read zip header
   var zh = function (d, b, z) {
       var fnl = b2(d, b + 28), fn = strFromU8(d.subarray(b + 46, b + 46 + fnl), !(b2(d, b + 8) & 2048)), es = b + 46 + fnl, bs = b4(d, b + 20);
       var _a = z && bs == 4294967295 ? z64e(d, es) : [bs, b4(d, b + 24), b4(d, b + 42)], sc = _a[0], su = _a[1], off = _a[2];
       return [b2(d, b + 10), sc, su, fn, es + b2(d, b + 30) + b2(d, b + 32), off];
   };
   // read zip64 extra field
   var z64e = function (d, b) {
       for (; b2(d, b) != 1; b += 4 + b2(d, b + 2))
           ;
       return [b8(d, b + 12), b8(d, b + 4), b8(d, b + 20)];
   };
   /**
    * Synchronously decompresses a ZIP archive. Prefer using \`unzip\` for better
    * performance with more than one file.
    * @param data The raw compressed ZIP file
    * @param opts The ZIP extraction options
    * @returns The decompressed files
    */
   function unzipSync(data, opts) {
       var files = {};
       var e = data.length - 22;
       for (; b4(data, e) != 0x6054B50; --e) {
           if (!e || data.length - e > 65558)
               err(13);
       }
       var c = b2(data, e + 8);
       if (!c)
           return {};
       var o = b4(data, e + 16);
       var z = o == 4294967295;
       if (z) {
           e = b4(data, e - 12);
           if (b4(data, e) != 0x6064B50)
               err(13);
           c = b4(data, e + 32);
           o = b4(data, e + 48);
       }
       var fltr = opts && opts.filter;
       for (var i = 0; i < c; ++i) {
           var _a = zh(data, o, z), c_2 = _a[0], sc = _a[1], su = _a[2], fn = _a[3], no = _a[4], off = _a[5], b = slzh(data, off);
           o = no;
           if (!fltr || fltr({
               name: fn,
               size: sc,
               originalSize: su,
               compression: c_2
           })) {
               if (!c_2)
                   files[fn] = slc(data, b, b + sc);
               else if (c_2 == 8)
                   files[fn] = inflateSync(data.subarray(b, b + sc), new u8(su));
               else
                   err(14, 'unknown compression type ' + c_2);
           }
       }
       return files;
   }

   // prettier-ignore
   const unzip = (data) => unzipSync(data, {
       filter: ({ name, size }) => !( // skip:
       size === 0 // empty files and folders
           || name.startsWith("__MACOSX/") // __MACOSX archive-specific folder
       )
   });
   onmessage = ({ data: request }) => {
       let response;
       try {
           response = {
               id: request.id,
               data: unzip(request.data),
           };
       }
       catch (error) {
           response = {
               id: request.id,
               error: error.message,
           };
       }
       postMessage(response);
   };

})();
`;
const worker = new Worker(Unzip);
const unzip = async (buffer) => new Promise((resolve, reject) => {
  const id2 = uid$1();
  const data = new Uint8Array(buffer);
  const request = { id: id2, data };
  const onMessage = ({ data: response }) => {
    if (response.id !== request.id)
      return;
    worker.removeEventListener("message", onMessage);
    if ("error" in response)
      reject(new Error(response.error));
    if ("data" in response)
      resolve(response.data);
  };
  worker.addEventListener("message", onMessage);
  worker.postMessage(request, [buffer]);
});
const DEFAULT_MOUNT_POINT = "/";
class Bundle {
  constructor(source) {
    Object.defineProperty(this, "_source", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: null
    });
    Object.defineProperty(this, "_fs", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: null
    });
    Object.defineProperty(this, "_mountpoint", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: DEFAULT_MOUNT_POINT
    });
    Object.defineProperty(this, "_data", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: {}
    });
    this._source = source;
  }
  static async preload(source, options) {
    if (Array.isArray(source)) {
      const onProgress = options === null || options === void 0 ? void 0 : options.onProgress;
      return await Promise.all(source.map((source2, index) => {
        const options2 = onProgress ? { onProgress: (...args) => onProgress(index, ...args) } : {};
        return this.preload(source2, options2);
      }));
    }
    const resource = new this(source);
    await resource.load(options);
    return resource;
  }
  async _fetch(source, addons) {
    return await _fetch(source, {}, addons).then((response) => {
      if (response.ok)
        return response.blob();
      else
        throw new Error(`${response.status}: Failed to fetch ${source}`);
    }).then((blob) => {
      if (blob.size > 0)
        return blob;
      else
        throw new Error(`The source must not be empty. Received ${blob.size} bytes size source.`);
    });
  }
  async _unzip(source) {
    if (!source.type.includes("zip")) {
      throw new TypeError(`The source type must be "application/zip"-like. Received: "${source.type}".`);
    }
    return await source.arrayBuffer().then(unzip).then((parsed) => Object.entries(parsed)).then((entries) => Object.fromEntries(entries));
  }
  async load(options) {
    let source = this._source;
    if (typeof source === "string")
      source = new Request(source);
    if (source instanceof Request)
      source = await this._fetch(source, options);
    if (source instanceof Blob)
      source = await this._unzip(source);
    if (source instanceof Object && source.constructor === Object)
      await Promise.all(Object.entries(source).map(([pathname, data]) => this.writeFile(pathname, data)));
    this._source = null;
    return this._data;
  }
  _fsWriteFile(path, data) {
    if (!this._fs)
      return;
    path = `${this._mountpoint}${path.startsWith("/") ? path.substring(1) : path}`;
    fsutils.write(this._fs, path, data);
  }
  mount(fs, mountpoint = DEFAULT_MOUNT_POINT) {
    this._fs = fs;
    this._mountpoint = mountpoint.endsWith("/") ? mountpoint : `${mountpoint}/`;
    Object.entries(this._data).forEach(([path, file]) => this._fsWriteFile(path, file));
  }
  unmount() {
    this._fs = null;
    this._mountpoint = DEFAULT_MOUNT_POINT;
  }
  async writeFile(path, file) {
    const fileAsUint8Array = new Uint8Array(file instanceof Blob ? await file.arrayBuffer() : file);
    this._data[path] = fileAsUint8Array;
    this._fsWriteFile(path, this._data[path]);
  }
}
var fsutils;
(function(fsutils2) {
  fsutils2.write = (fs, path, data) => {
    const parts = path.split("/");
    if (parts[0] === "")
      parts.shift();
    if (parts.length > 1) {
      parts.reduce((full, part) => {
        if (!fsutils2.exists(fs, full))
          fs.mkdir(full);
        return `${full}/${part}`;
      });
    }
    fs.writeFile(path, data);
  };
  fsutils2.exists = (fs, path) => {
    try {
      fs.lstat(path);
      return true;
    } catch (e) {
      if (e.errno === 44 || e.code === "ENOENT")
        return false;
      else
        throw e;
    }
  };
})(fsutils || (fsutils = {}));
const deprecate = (msg, warn = (msg2) => console.warn(msg2)) => {
  return function(target, propertyKey, descriptor) {
    const method = descriptor.value;
    if (typeof method !== "function")
      throw new TypeError("Only functions can be marked as deprecated");
    function deprecationWarning(...args) {
      warn.call(this, `DEPRECATION: ${target.constructor.name}.${propertyKey}() is deprecated. ${msg}`);
      return method.call(this, ...args);
    }
    return { ...descriptor, deprecationWarning };
  };
};
function createEventTarget() {
  try {
    return new EventTarget();
  } catch (_a2) {
    return document.createDocumentFragment();
  }
}
class EventEmitter {
  constructor() {
    Object.defineProperty(this, "_emitter", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this._emitter = createEventTarget();
  }
  addEventListener(...args) {
    this._emitter.addEventListener(...args);
  }
  removeEventListener(...args) {
    this._emitter.removeEventListener(...args);
  }
  dispatchEvent(...args) {
    var _a2;
    return (_a2 = this._emitter.dispatchEvent(...args)) !== null && _a2 !== void 0 ? _a2 : true;
  }
  removeAllEventListeners() {
    this._emitter = createEventTarget();
  }
}
class Effect {
  constructor(source) {
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: `effects/${nanoid()}`
    });
    Object.defineProperty(this, "_player", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: null
    });
    Object.defineProperty(this, "_bundle", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this._bundle = new EffectBundle(source);
  }
  static async preload(source, options) {
    if (Array.isArray(source)) {
      const onProgress = options === null || options === void 0 ? void 0 : options.onProgress;
      return await Promise.all(source.map((source2, index) => {
        const options2 = onProgress ? { onProgress: (...args) => onProgress(index, ...args) } : {};
        return this.preload(source2, options2);
      }));
    }
    const effect = new this(source);
    await effect._load(options);
    return effect;
  }
  async _load(options) {
    await this._bundle.load(options);
  }
  async _bind(player) {
    await this._bundle.load();
    this._player = player;
    this._bundle.mount(this._player["_sdk"].FS, this.name);
  }
  _unbind() {
    this._bundle.unmount();
    this._player = null;
  }
  async writeFile(path, file) {
    return this._bundle.writeFile(path, file);
  }
  callJsMethod(methodName, methodJSONParams = "") {
    if (!this._player) {
      console.warn("The method won't evaluate: the effect is not applied to a player.");
      return;
    }
    const em = this._player["_effectManager"];
    return tidy(() => em.current().callJsMethod(methodName, methodJSONParams));
  }
  async evalJs(code) {
    if (!this._player) {
      console.warn("The script won't evaluate: the effect is not applied to a player.");
      return;
    }
    const em = this._player["_effectManager"];
    return new Promise((resolve) => {
      tidy(() => em.current().evalJs(code, resolve));
    });
  }
}
__decorate([
  deprecate("Please, use Effect.evalJs() instead.")
], Effect.prototype, "callJsMethod", null);
class EffectBundle extends Bundle {
  async _unzip(source) {
    let data = await super._unzip(source);
    const paths = Object.keys(data);
    const rootDirs = paths.map((path) => path.split("/").find(Boolean));
    const mayBeEffectDir = rootDirs[0];
    const isOneDirEffect = rootDirs.every((dir) => dir === mayBeEffectDir);
    if (isOneDirEffect) {
      data = Object.fromEntries(Object.entries(data).map(([pathname, data2]) => [
        pathname.replace(`${mayBeEffectDir}/`, ""),
        data2
      ]));
    }
    return data;
  }
}
class MemoryPool {
  constructor(sdk, limit = 1) {
    Object.defineProperty(this, "_id", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: uid()
    });
    Object.defineProperty(this, "_sdk", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_free", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_inuse", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: []
    });
    this._sdk = sdk;
    this._free = new Array(limit).fill(null).map(() => ({
      id: NaN,
      ptr: NaN,
      length: 0
    }));
  }
  get(data) {
    const mem = this._free.shift();
    if (mem)
      this._inuse.push(mem);
    else
      return null;
    if (mem.length !== data.length) {
      this._sdk._free(mem.ptr);
      mem.ptr = this._sdk._malloc(data.length);
      mem.length = data.length;
    }
    this._sdk.HEAP8.set(data, mem.ptr);
    mem.id = this._id();
    return mem;
  }
  release({ id: id2 }) {
    let used;
    let freed = null;
    while ((used = this._inuse[0]) && used.id <= id2)
      this._free.push(freed = this._inuse.shift());
    return freed;
  }
  reset() {
    this._free.push(...this._inuse.splice(0, this._inuse.length));
    this._free.forEach((mem) => {
      this._sdk._free(mem.ptr);
      mem.id = NaN;
      mem.ptr = NaN;
      mem.length = 0;
    });
  }
}
const uid = () => {
  let id2 = 0;
  return () => ++id2;
};
var Player_1;
const defaultPlayerOptions = {
  devicePixelRatio: typeof devicePixelRatio !== "undefined" ? devicePixelRatio : 1,
  faceSearchMode: "GOOD",
  consistencyMode: "SYNCHRONOUS",
  cameraOrientation: 0,
  maxFaces: 1,
  logger: console
};
let Player = Player_1 = class Player2 extends EventEmitter {
  constructor(sdk, options = {}) {
    super();
    Object.defineProperty(this, "_sdk", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_preferences", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_meta", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_memory", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_player", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_effectManager", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_state", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "paused"
    });
    Object.defineProperty(this, "_frames", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: async function* () {
      }()
    });
    this._sdk = sdk;
    this._preferences = { ...defaultPlayerOptions, fps: 30, ...options };
    this._meta = { width: this._sdk.canvas.width, height: this._sdk.canvas.height };
    this._memory = new MemoryPool(this._sdk, 3);
    this._player = tidy(() => this._sdk.EffectPlayer.create(new this._sdk.EffectPlayerConfiguration(this._meta.width, this._meta.height, true, this._sdk.FaceSearchMode[this._preferences.faceSearchMode], false, false)));
    this._player.surfaceCreated(this._sdk.canvas.width, this._sdk.canvas.height);
    this._player.setMaxFaces(this._preferences.maxFaces);
    this._player.setRenderConsistencyMode(this._sdk.ConsistencyMode[this._preferences.consistencyMode]);
    this._player.addFrameDurationListener((instantDuration, averagedDuration) => this.dispatchEvent(new CustomEvent(Player_1.FRAME_PROCESSED_EVENT, {
      detail: { instantDuration, averagedDuration }
    })), (instantDuration, averagedDuration) => this.dispatchEvent(new CustomEvent(Player_1.FRAME_RECEIVED_EVENT, {
      detail: { instantDuration, averagedDuration }
    })), (instantDuration, averagedDuration) => this.dispatchEvent(new CustomEvent(Player_1.FRAME_RENDERED_EVENT, {
      detail: { instantDuration, averagedDuration }
    })));
    this._player.addFrameDataListener((frameData) => {
      tidy(() => {
        this.dispatchEvent(new CustomEvent(Player_1.FRAME_DATA_EVENT, { detail: frameData }));
        frameData.delete();
      });
    });
    this._effectManager = this._player.effectManager();
    this._effectManager.addEffectActivatedListener(() => {
      tidy(() => {
        const effect = this._effectManager.current();
        this.dispatchEvent(new CustomEvent(Player_1.EFFECT_ACTIVATED_EVENT, { detail: effect }));
        effect.delete();
      });
    });
    this.setVolume(0);
  }
  get isPlaying() {
    return this._state === "playing";
  }
  static async create(options) {
    const sdk = await createSDK(options);
    return new this(sdk, options);
  }
  use(input, options = {}) {
    this._frames = input[Symbol.asyncIterator](options);
  }
  async applyEffect(effect) {
    const player = this;
    const name = effect.name;
    await effect["_bind"](player);
    return new Promise((resolve) => {
      this.addEventListener(Player_1.EFFECT_ACTIVATED_EVENT, ({ detail: effect2 }) => {
        effect2 = keep(effect2.clone());
        resolve(effect2);
        setTimeout$1(() => effect2.delete());
      }, { once: true });
      this.addEventListener(Player_1.EFFECT_ACTIVATED_EVENT, unbindOldEffectOnEffectChange);
      tidy(() => {
        this._effectManager.load(name);
      });
      function unbindOldEffectOnEffectChange({ detail: $effect }) {
        if ($effect.url() === `/${name}`)
          return;
        player.removeEventListener(Player_1.EFFECT_ACTIVATED_EVENT, unbindOldEffectOnEffectChange);
        effect["_unbind"]();
      }
    });
  }
  async clearEffect() {
    return new Promise((resolve) => {
      this.addEventListener(Player_1.EFFECT_ACTIVATED_EVENT, () => resolve(), { once: true });
      tidy(() => {
        this._effectManager.load("");
      });
    });
  }
  callJsMethod(methodName, methodJSONParams = "") {
    return tidy(() => this._effectManager.current().callJsMethod(methodName, methodJSONParams));
  }
  setVolume(level) {
    this._effectManager.setEffectVolume(level);
    this.dispatchEvent(new CustomEvent("volumechange", { detail: level }));
  }
  _setSurfaceSize(width, height, scale = this._preferences.devicePixelRatio) {
    const dpr = Math.round(window.devicePixelRatio);
    const [maxWidth, maxHeight] = [screen.width * dpr, screen.height * dpr];
    const wScale = Math.max(1, maxWidth / width);
    const hScale = Math.max(1, maxHeight / height);
    const maxScale = Math.max(wScale, hScale);
    scale = Math.min(scale, maxScale);
    width *= scale;
    height *= scale;
    this._sdk.setCanvasSize(width, height);
    this._effectManager.setEffectSize(width, height), this._player.surfaceChanged(width, height);
  }
  _pushFrame({ data, width, height, format = "RGBA" }, parameters = []) {
    const mem = this._memory.get(data);
    if (!mem)
      return;
    mem.meta = { width, height };
    tidy(() => {
      const fd = this._sdk.FrameData.makeFromBpc8(mem.ptr, width, height, this._sdk.CameraOrientation[`DEG_${this._preferences.cameraOrientation}`], this._sdk.PixelFormat[format], false, 0);
      if (parameters.length > 0) {
        const fp = new this._sdk.VectorFeatureParameter();
        for (const [x = 0, y = 0, z = 0, w = 0] of parameters)
          fp.push_back(new this._sdk.FeatureParameter(x, y, z, w));
        fd.addFeatureParameters(fp);
      }
      this._player.pushFrameDataWithNumber(fd, mem.id);
      this._player.recognizerProcessFromBuffer();
    });
  }
  _draw() {
    try {
      const id2 = this._player.draw();
      const gl = this._sdk.ctx;
      if (!(gl instanceof WebGLRenderingContext))
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
      if (id2 === -1)
        return id2;
      const mem = this._memory.release({ id: id2 });
      if (!mem)
        return id2;
      const current = this._meta;
      const next = mem.meta;
      if (current.width !== next.width || current.height !== next.height)
        this._setSurfaceSize(current.width = next.width, current.height = next.height);
      return id2;
    } catch (error) {
      this._memory.reset();
      throw error;
    }
  }
  async play({ fps: fps2 } = {}) {
    if (typeof fps2 !== "undefined")
      this._preferences.fps = fps2;
    if (this._state === "pausing")
      this._state = "playing";
    if (this._state === "playing")
      return;
    else
      this._state = "playing";
    (async () => {
      while (this._state === "playing") {
        const { value: frame } = await this._frames.next(this._preferences.fps);
        if (frame) {
          this._pushFrame(frame);
        } else {
          this._state = "paused";
        }
      }
    })();
    (() => {
      let then2 = 0;
      const draw = (now) => {
        var _a2, _b2, _c2, _d2;
        if (this._state !== "playing")
          return;
        const interval2 = 1e3 / this._preferences.fps;
        const tolerance = 0.1 * interval2;
        if (now - then2 > interval2 - tolerance) {
          then2 = now;
          try {
            this._draw();
          } catch (error) {
            if (error instanceof WebAssembly.RuntimeError) {
              this._state = "paused";
              throw error;
            }
            this.clearEffect();
            (_b2 = (_a2 = this._preferences.logger).warn) === null || _b2 === void 0 ? void 0 : _b2.call(_a2, "The effect was force cleared due to the exception:");
            (_d2 = (_c2 = this._preferences.logger).error) === null || _d2 === void 0 ? void 0 : _d2.call(_c2, error);
          }
        }
        requestAnimationFrame$1(draw);
      };
      requestAnimationFrame$1(draw);
    })();
  }
  async pause() {
    if (this._state === "playing") {
      this._state = "pausing";
    }
    while (this._state === "pausing")
      await new Promise((r) => requestAnimationFrame$1(r));
    if (this._state !== "paused")
      throw new Error("The pause request was canceled");
  }
  async destroy() {
    await this.pause();
    this.removeAllEventListeners();
    await this.clearEffect();
    this._player.surfaceDestroyed();
    this._player.delete();
    this._effectManager.delete();
    this._memory.reset();
    for (const key in this)
      if (key.startsWith("_"))
        Object.defineProperty(this, key, {
          get() {
            throw new Error("The player is destroyed.");
          },
          set() {
            throw new Error("The player is destroyed.");
          }
        });
  }
};
Object.defineProperty(Player, "FRAME_RECEIVED_EVENT", {
  enumerable: true,
  configurable: true,
  writable: true,
  value: "framereceived"
});
Object.defineProperty(Player, "FRAME_PROCESSED_EVENT", {
  enumerable: true,
  configurable: true,
  writable: true,
  value: "frameprocessed"
});
Object.defineProperty(Player, "FRAME_RENDERED_EVENT", {
  enumerable: true,
  configurable: true,
  writable: true,
  value: "framerendered"
});
Object.defineProperty(Player, "FRAME_DATA_EVENT", {
  enumerable: true,
  configurable: true,
  writable: true,
  value: "framedata"
});
Object.defineProperty(Player, "EFFECT_ACTIVATED_EVENT", {
  enumerable: true,
  configurable: true,
  writable: true,
  value: "effectactivated"
});
__decorate([
  deprecate("Please, use Effect.evalJs() instead.")
], Player.prototype, "callJsMethod", null);
Player = Player_1 = __decorate([
  withJSExceptions
], Player);
function withJSExceptions(target, _propertyKey, descriptor) {
  if (descriptor) {
    let value = function(...args) {
      let ret;
      try {
        ret = method.call(this, ...args);
        if (!(ret instanceof Promise))
          return ret;
      } catch (error) {
        if (typeof error === "number")
          error = new Error(this["_sdk"].getExceptionMessage(error));
        throw error;
      }
      return ret.catch((error) => {
        if (typeof error === "number")
          error = new Error(this["_sdk"].getExceptionMessage(error));
        throw error;
      });
    };
    const method = descriptor.value;
    if (typeof method !== "function")
      return descriptor;
    if (method === target.constructor)
      return descriptor;
    return { ...descriptor, value };
  }
  const proto = target.prototype;
  const descriptors = Object.getOwnPropertyDescriptors(proto);
  for (const propertyKey in descriptors)
    Object.defineProperty(proto, propertyKey, withJSExceptions(proto, propertyKey, descriptors[propertyKey]));
  return target;
}
const cache = new WeakMap();
const render = (player, container) => {
  const element = typeof container === "string" ? document.querySelector(container) : container;
  if (!(element instanceof HTMLElement))
    throw new Error("Target container is not a DOM element");
  if (element instanceof HTMLMediaElement || element instanceof HTMLCanvasElement)
    throw new Error("Target container must be a plain html element like `div`");
  cache.set(element, player);
  element.appendChild(player["_sdk"].canvas);
  player.play();
};
const unmount = (container) => {
  const element = typeof container === "string" ? document.querySelector(container) : container;
  if (!(element instanceof HTMLElement))
    throw new Error("Target container is not a DOM element");
  const player = cache.get(element);
  if (player)
    element.removeChild(player["_sdk"].canvas);
  cache.delete(element);
};
const Dom = { render, unmount };
class ImageCapture {
  constructor(player) {
    Object.defineProperty(this, "_player", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this._player = player;
  }
  async takePhoto(settings) {
    var _a2, _b2;
    const canvas = this._player["_sdk"].canvas;
    const meta = this._player["_meta"];
    const width = (_a2 = settings === null || settings === void 0 ? void 0 : settings.width) !== null && _a2 !== void 0 ? _a2 : meta.width;
    const height = (_b2 = settings === null || settings === void 0 ? void 0 : settings.height) !== null && _b2 !== void 0 ? _b2 : meta.height;
    const copy = cloneWithResize(canvas, width, height);
    return await new Promise((resolve, reject) => {
      var _a3;
      return copy.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Unexpected error: Unable to create Blob")), (_a3 = settings === null || settings === void 0 ? void 0 : settings.type) !== null && _a3 !== void 0 ? _a3 : "image/jpeg", settings === null || settings === void 0 ? void 0 : settings.quality);
    });
  }
}
const cloneWithResize = (original, newWidth = original.width, newHeight = original.height) => {
  if (newWidth !== original.width || newHeight !== original.height) {
    const clone = createCanvas(newWidth, newHeight);
    clone.getContext("2d").drawImage(original, 0, 0, clone.width, clone.height);
    return clone;
  }
  return original;
};
const createCanvas = (width, height) => {
  let canvas;
  if (typeof OffscreenCanvas == "undefined") {
    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
  } else {
    canvas = new OffscreenCanvas(width, height);
    canvas.toBlob = function(cb, type, quality) {
      this.convertToBlob({ type, quality }).then(cb).catch((_) => cb(null));
    };
  }
  return canvas;
};
const MediaStreamSSR = typeof MediaStream !== "undefined" ? MediaStream : class {
  constructor() {
    throw new Error("The environment does not support MediaStream API");
  }
};
class MediaStreamCapture extends MediaStreamSSR {
  constructor(player) {
    super();
    const stream = MediaStreamCapture.cache.get(player);
    if (!stream || !stream.active) {
      let canvas = player["_sdk"].canvas;
      const ctx = canvas.getContext("webgl2") || canvas.getContext("webgl");
      const attrs = ctx.getContextAttributes() || {};
      if (attrs.alpha) {
        const original = canvas;
        const proxy = document.createElement("canvas");
        const ctx2 = utils.createRenderingContext(proxy, { alpha: false });
        const flipY = typeof WebGL2RenderingContext !== "undefined";
        player.addEventListener(Player.FRAME_RENDERED_EVENT, () => {
          let dx = 0, dy = 0, dw = original.width, dh = original.height;
          if (flipY)
            [dy, dh] = [dh, -dh];
          ctx2.drawImage(original, dx, dy, dw, dh);
        });
        canvas = proxy;
      }
      canvas.captureStream().getTracks().forEach((t) => this.addTrack(t));
      MediaStreamCapture.cache.set(player, this);
    }
    return MediaStreamCapture.cache.get(player);
  }
  getVideoTrack(index = 0) {
    return this.getVideoTracks()[index];
  }
  getAudioTrack(index = 0) {
    return this.getAudioTracks()[index];
  }
  stop() {
    this.getTracks().forEach((t) => t.stop());
  }
}
Object.defineProperty(MediaStreamCapture, "cache", {
  enumerable: true,
  configurable: true,
  writable: true,
  value: new WeakMap()
});
const MediaRecorderSSR = typeof MediaRecorder !== "undefined" ? MediaRecorder : class {
  constructor() {
    throw new Error("The environment does not support MediaRecorder API");
  }
};
class VideoRecorder extends MediaRecorderSSR {
  constructor(player, options) {
    const stream = player["_sdk"].canvas.captureStream();
    super(stream, options);
  }
  async stop() {
    return new Promise((resolve, reject) => {
      const dataavailable = (event) => {
        super.removeEventListener("dataavailable", dataavailable);
        super.removeEventListener("error", error);
        resolve(event.data);
      };
      const error = (event) => {
        super.removeEventListener("dataavailable", dataavailable);
        super.removeEventListener("error", error);
        reject(event.error);
      };
      super.addEventListener("dataavailable", dataavailable);
      super.addEventListener("error", error);
      super.stop();
    });
  }
}
const VERSION = "1.4.2";
export { Bundle, Dom, Effect, Image$1 as Image, ImageCapture, MediaStream$1 as MediaStream, MediaStreamCapture, Player, VERSION, Video, VideoRecorder, Webcam, createSDK, defaultPlayerOptions, defaultVideoConstraints, defaultVideoOptions, keep, tidy, utils };
