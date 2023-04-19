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
  private blurInputTexture: WebGLTexture | null = null;
  private background?: HMSBackgroundInput;
  private blurKernel = [1.0, 2.0, 1.0, 2.0, 4.0, 2.0, 1.0, 2.0, 1.0];
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
    const vertexShaderSource = this.getVertexShader();

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
  }

  draw(results: Results, background: HMSBackgroundInput): void {
    if (!this.gl || !this.shaderProgram || !this.texture || !this.segmentationTexture || !this.inputTexture) {
      return;
    }
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.shaderProgram);

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

  drawBlur(results: Results): void {
    if (!this.gl || !this.blurProgram || !this.blurInputTexture) {
      return;
    }
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.blurProgram);

    const textureUniformLocation = gl.getUniformLocation(this.blurProgram, 'u_texture');
    const resolutionUniformLocation = gl.getUniformLocation(this.blurProgram, 'u_resolution');
    const kernelUniformLocation = gl.getUniformLocation(this.blurProgram, 'u_kernel[0]');
    const kernelWeightUniformLocation = gl.getUniformLocation(this.blurProgram, 'u_kernelWeight');

    gl.uniform1i(textureUniformLocation, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.blurInputTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, results.image);

    gl.activeTexture(gl.TEXTURE1);
    gl.uniform2f(resolutionUniformLocation, this.canvas.width, this.canvas.height);
    gl.uniform1fv(kernelUniformLocation, this.blurKernel);
    gl.uniform1f(kernelWeightUniformLocation, this.computeKernelWeight(this.blurKernel));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  cleanUp() {
    if (this.gl) {
      this.gl.deleteProgram(this.shaderProgram);
      this.gl.deleteTexture(this.texture);
      this.gl.deleteTexture(this.segmentationTexture);
      this.gl.deleteTexture(this.inputTexture);
    }
  }

  // eslint-disable-next-line complexity
  private createBlurProgram() {
    if (!this.gl) {
      return;
    }
    const gl = this.gl;
    const vertexShaderSource = this.getVertexShader();

    const fragmentShaderSource = `
    precision highp float;

    uniform sampler2D u_texture;
    uniform vec2 u_resolution;
    uniform float u_kernel[9];
    uniform float u_kernelWeight;
    
    varying vec2 v_uv;
    
    void main() {
      vec2 onePixel = vec2(1.0, 1.0) / u_resolution;
      vec4 colorSum =
       texture2D(u_texture, v_uv + onePixel * vec2(-1, -1)) * u_kernel[0] +
       texture2D(u_texture, v_uv + onePixel * vec2( 0, -1)) * u_kernel[1] +
       texture2D(u_texture, v_uv + onePixel * vec2( 1, -1)) * u_kernel[2] +
       texture2D(u_texture, v_uv + onePixel * vec2(-1,  0)) * u_kernel[3] +
       texture2D(u_texture, v_uv + onePixel * vec2( 0,  0)) * u_kernel[4] +
       texture2D(u_texture, v_uv + onePixel * vec2( 1,  0)) * u_kernel[5] +
       texture2D(u_texture, v_uv + onePixel * vec2(-1,  1)) * u_kernel[6] +
       texture2D(u_texture, v_uv + onePixel * vec2( 0,  1)) * u_kernel[7] +
       texture2D(u_texture, v_uv + onePixel * vec2( 1,  1)) * u_kernel[8] ;
       
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

    const blurProgram = gl.createProgram();
    if (!blurProgram) {
      return;
    }
    gl.attachShader(blurProgram, vertexShader);
    gl.attachShader(blurProgram, fragmentShader);
    gl.linkProgram(blurProgram);
    const linked = gl.getProgramParameter(blurProgram, gl.LINK_STATUS);
    if (!linked) {
      console.log('program not linked');
      return;
    }

    this.blurProgram = blurProgram;

    const positionAttributeLocation = gl.getAttribLocation(blurProgram, 'a_position');
    const texCoordAttributeLocation = gl.getAttribLocation(blurProgram, 'a_texCoord');

    const buffer = gl.createBuffer();
    this.blurInputTexture = this.createTexture();

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
    gl.useProgram(this.blurProgram);
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

  private computeKernelWeight(kernel: Array<number>) {
    const weight = kernel.reduce(function (prev, curr) {
      return prev + curr;
    });
    return weight <= 0 ? 1 : weight;
  }

  private getVertexShader() {
    return `
          attribute vec2 a_position;
          attribute vec2 a_texCoord;
          varying vec2 v_uv;
          void main() {
              gl_Position = vec4(a_position, 0, 1);
              v_uv = vec2(a_texCoord.x, 1.0 - a_texCoord.y);
          }
          `;
  }
}
