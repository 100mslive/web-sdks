import { Results } from '@mediapipe/selfie_segmentation';
import { HMSBackgroundInput } from './interfaces';

export class CanvasHandler {
  private canvas: HTMLCanvasElement;
  private gl?: WebGL2RenderingContext;
  private shaderProgram: WebGLProgram | null = null;
  private blurProgram: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private segmentationTexture: WebGLTexture | null = null;
  private inputTexture: WebGLTexture | null = null;
  private blurTexture: WebGLTexture | null = null;
  private background?: HMSBackgroundInput;
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.init();
    this.createBlurProgram();
  }

  init(): void {
    const gl = this.canvas.getContext('webgl2');
    if (!gl) {
      return;
    }
    this.gl = gl;
    const vertexShaderSource = `
          attribute vec2 a_position;
          attribute vec2 a_texCoord;
          varying vec2 v_uv;
          void main() {
              gl_Position = vec4(a_position, 0, 1);
              v_uv = vec2(a_texCoord.x, 1.0 - a_texCoord.y);
          }
          `;

    const fragmentShaderSource = `
          precision mediump float;
          varying vec2 v_uv;
          uniform sampler2D u_texture;
          uniform sampler2D u_segmentation;
          uniform sampler2D u_input;

          void main() {
              vec4 background = texture2D(u_texture, v_uv);
              vec4 segmentation = texture2D(u_segmentation, v_uv);
              vec4 source = texture2D(u_input, v_uv);
              if (segmentation.a < 0.3) {
                  gl_FragColor = background;
              } else {
                  gl_FragColor = source;
              }
          }
          `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) {
      return;
    }
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragmentShader) {
      return;
    }
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    const shaderProgram = gl.createProgram();
    if (!shaderProgram) {
      return;
    }
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    this.shaderProgram = shaderProgram;

    const positionAttributeLocation = gl.getAttribLocation(shaderProgram, 'a_position');
    const texCoordAttributeLocation = gl.getAttribLocation(shaderProgram, 'a_texCoord');

    const buffer = gl.createBuffer();
    this.texture = this.createTexture();
    this.segmentationTexture = this.createTexture();
    this.inputTexture = this.createTexture();

    const vertices = [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0];
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(texCoordAttributeLocation);
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]),
      gl.STATIC_DRAW,
    );
    gl.vertexAttribPointer(texCoordAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(this.shaderProgram);
  }

  draw(results: Results, background: HMSBackgroundInput): void {
    if (!this.gl || !this.shaderProgram || !this.texture || !this.segmentationTexture || !this.inputTexture) {
      return;
    }
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const textureUniformLocation = gl.getUniformLocation(this.shaderProgram, 'u_texture');
    const segmentationUniformLocation = gl.getUniformLocation(this.shaderProgram, 'u_segmentation');
    const inputUniformLocation = gl.getUniformLocation(this.shaderProgram, 'u_input');

    gl.uniform1i(textureUniformLocation, 0);
    gl.uniform1i(segmentationUniformLocation, 1);
    gl.uniform1i(inputUniformLocation, 2);

    this.setBackground(background);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.segmentationTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, results.segmentationMask);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.inputTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, results.image);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  drawBlur(results: Results) {
    if (!this.gl || !this.blurProgram || !this.blurTexture) {
      return;
    }
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const textureUniformLocation = gl.getUniformLocation(this.blurProgram, 'u_image');
    gl.uniform1i(textureUniformLocation, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.blurTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, results.image);
  }

  setBackground(background: HMSBackgroundInput) {
    if (!this.gl || !this.texture || (this.background === background && background instanceof HTMLImageElement)) {
      return;
    }
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, background);
    this.background = background;
  }

  cleanUp() {
    if (this.gl) {
      this.gl.deleteProgram(this.shaderProgram);
      this.gl.deleteTexture(this.texture);
      this.gl.deleteTexture(this.segmentationTexture);
      this.gl.deleteTexture(this.inputTexture);
    }
  }

  private createBlurProgram() {
    if (!this.gl) {
      return;
    }
    const gl = this.gl;
    const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;

    uniform vec2 u_resolution;
    uniform float u_flipY;

    varying vec2 v_texCoord;

    void main() {
      // convert the rectangle from pixels to 0.0 to 1.0
      vec2 zeroToOne = a_position / u_resolution;

      // convert from 0->1 to 0->2
      vec2 zeroToTwo = zeroToOne * 2.0;

      // convert from 0->2 to -1->+1 (clipspace)
      vec2 clipSpace = zeroToTwo - 1.0;

      gl_Position = vec4(clipSpace * vec2(1, u_flipY), 0, 1);

      // pass the texCoord to the fragment shader
      // The GPU will interpolate this value between points.
      v_texCoord = a_texCoord;
    }`;

    const fragmentShaderSource = `
    precision mediump float;

    // our texture
    uniform sampler2D u_image;
    uniform vec2 u_textureSize;
    uniform float u_kernel[9];
    uniform float u_kernelWeight;

    // the texCoords passed in from the vertex shader.
    varying vec2 v_texCoord;

    void main() {
      vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
      vec4 colorSum =
          texture2D(u_image, v_texCoord + onePixel * vec2(-1, -1)) * u_kernel[0] +
          texture2D(u_image, v_texCoord + onePixel * vec2( 0, -1)) * u_kernel[1] +
          texture2D(u_image, v_texCoord + onePixel * vec2( 1, -1)) * u_kernel[2] +
          texture2D(u_image, v_texCoord + onePixel * vec2(-1,  0)) * u_kernel[3] +
          texture2D(u_image, v_texCoord + onePixel * vec2( 0,  0)) * u_kernel[4] +
          texture2D(u_image, v_texCoord + onePixel * vec2( 1,  0)) * u_kernel[5] +
          texture2D(u_image, v_texCoord + onePixel * vec2(-1,  1)) * u_kernel[6] +
          texture2D(u_image, v_texCoord + onePixel * vec2( 0,  1)) * u_kernel[7] +
          texture2D(u_image, v_texCoord + onePixel * vec2( 1,  1)) * u_kernel[8] ;
      gl_FragColor = vec4((colorSum / u_kernelWeight).rgb, 1);
    }
    `;
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) {
      return;
    }
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragmentShader) {
      return;
    }
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram();
    if (!program) {
      return;
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const texcoordLocation = gl.getAttribLocation(program, 'a_texCoord');

    // Create a buffer to put three 2d clip space points in
    const positionBuffer = gl.createBuffer();
    // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Set a rectangle the same size as the image.
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0,
        0,
        this.canvas.width,
        0,
        0,
        this.canvas.height,
        0,
        this.canvas.height,
        this.canvas.width,
        0,
        this.canvas.width,
        this.canvas.height,
      ]),
      gl.STATIC_DRAW,
    );

    gl.enableVertexAttribArray(positionLocation);
    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(texcoordLocation);
    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

    const originalImageTexture = this.createTexture();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas);

    const blurTexture = this.createTexture();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.canvas.width, this.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, blurTexture, 0);

    this.blurProgram = program;
    this.blurTexture = blurTexture;

    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const textureSizeLocation = gl.getUniformLocation(program, 'u_textureSize');
    const kernelLocation = gl.getUniformLocation(program, 'u_kernel[0]');
    const kernelWeightLocation = gl.getUniformLocation(program, 'u_kernelWeight');
    const flipYLocation = gl.getUniformLocation(program, 'u_flipY');

    gl.uniform2f(textureSizeLocation, this.canvas.width, this.canvas.height);
    gl.bindTexture(gl.TEXTURE_2D, originalImageTexture);

    // don't y flip images while drawing to the textures
    gl.uniform1f(flipYLocation, 1);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

    // Tell the shader the resolution of the framebuffer.
    gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);

    const blurKernel = [0, 1, 0, 1, 1, 1, 0, 1, 0];
    const blurKernelWeight = blurKernel.reduce((acc, curr) => acc + curr, 0);

    // Tell webgl the viewport setting needed for framebuffer.
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.uniform1fv(kernelLocation, blurKernel);
    gl.uniform1f(kernelWeightLocation, blurKernelWeight <= 0 ? 1 : blurKernelWeight);
  }

  private createTexture() {
    if (!this.gl) {
      return null;
    }
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return texture;
  }
}
