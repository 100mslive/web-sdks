import { Results } from '@mediapipe/selfie_segmentation';

export class CanvasHandler {
  private canvas: HTMLCanvasElement;
  private gl!: WebGL2RenderingContext;
  private shaderProgram: WebGLProgram | null = null;
  private segmentationProgram: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private segmentationTexture: WebGLTexture | null = null;
  private inputTexture: WebGLTexture | null = null;
  private vertexShader: WebGLShader | null = null;
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.init();
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
          varying vec2 v_texCoord;
          void main() {
              gl_Position = vec4(a_position, 0, 1);
              v_texCoord = vec2(a_texCoord.x, 1.0 - a_texCoord.y);
          }
          `;

    const fragmentShaderSource = `
          precision mediump float;
          varying vec2 v_texCoord;
          uniform sampler2D u_texture;
          uniform sampler2D u_segmentation;
          uniform sampler2D u_input;

          void main() {
              vec4 background = texture2D(u_texture, v_texCoord);
              vec4 segmentation = texture2D(u_segmentation, v_texCoord);
              vec4 source = texture2D(u_input, v_texCoord);
              gl_FragColor = segmentation;
          }
          `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) {
      return;
    }
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    this.vertexShader = vertexShader;

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

  draw(_results: Results, _background: HTMLImageElement): void {
    if (!this.gl || !this.shaderProgram || !this.texture || !this.segmentationTexture || !this.inputTexture) {
      return;
    }
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.shaderProgram);

    // gl.enable(gl.BLEND);
    // gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    // gl.clearColor(0, 0, 0, 0);
    // gl.clear(gl.COLOR_BUFFER_BIT);

    const textureUniformLocation = gl.getUniformLocation(this.shaderProgram, 'u_texture');
    const segmentationUniformLocation = gl.getUniformLocation(this.shaderProgram, 'u_segmentation');
    const inputUniformLocation = gl.getUniformLocation(this.shaderProgram, 'u_input');

    gl.uniform1i(textureUniformLocation, 0);
    gl.uniform1i(segmentationUniformLocation, 1);
    gl.uniform1i(inputUniformLocation, 2);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, _background);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.segmentationTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, _results.segmentationMask);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.inputTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, _results.image);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // this.attachSegmentationShader(_results, _background);
  }

  cleanUp() {
    this.gl.deleteProgram(this.shaderProgram);
    this.gl.deleteTexture(this.texture);
  }

  attachSegmentationShader(_results: Results, _background: HTMLImageElement | HTMLCanvasElement) {
    const gl = this.gl;
    if (!gl) {
      return;
    }

    const fragmentShaderSource = `
      precision highp float;
      uniform sampler2D u_inputSegmentation;
      in vec2 v_texCoord;
      out vec4 outColor;
      void main() {
        vec2 segmentation = texture(u_inputSegmentation, v_texCoord).rg;
        float shift = max(segmentation.r, segmentation.g);
        float backgroundExp = exp(segmentation.r - shift);
        float personExp = exp(segmentation.g - shift);
        outColor = vec4(vec3(0.0), personExp / (backgroundExp + personExp));
      }
  `;

    const segmentationTexture = this.createTexture();

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragmentShader) {
      return;
    }
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    const program = this.createProgram(fragmentShader)!;
    const inputLocation = gl.getUniformLocation(program, 'u_inputSegmentation');
    const frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, segmentationTexture!, 0);

    gl.useProgram(program);
    gl.uniform1i(inputLocation, 1);

    this.segmentationProgram = program;
  }

  drawSegmentation(results: Results) {
    const gl = this.gl;
    if (!gl || !this.segmentationProgram) {
      return;
    }
    const inputTexture = this.createTexture();
    gl.useProgram(this.segmentationProgram);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, inputTexture!);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, results.segmentationMask);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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
    // gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R32F, width, height);
    return texture;
  }

  private createProgram(fragmentShader: WebGLShader) {
    if (!this.gl || !this.vertexShader) {
      return;
    }
    const gl = this.gl;
    const program = gl.createProgram()!;
    gl.attachShader(program, this.vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Could not link WebGL program: ${gl.getProgramInfoLog(program)}`);
    }
    return program;
  }
}
