export class CanvasHandler {
  private canvas: HTMLCanvasElement;
  private gl!: WebGL2RenderingContext;
  private shaderProgram: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private video: HTMLVideoElement;
  private initCalled = false;
  constructor(canvas: HTMLCanvasElement, video: HTMLVideoElement) {
    this.canvas = canvas;
    this.video = video;
  }

  init(): void {
    if (this.initCalled) {
      return;
    }
    this.initCalled = true;
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
          void main() {
              gl_FragColor = texture2D(u_texture, v_texCoord);
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

    const texture = gl.createTexture();
    const buffer = gl.createBuffer();

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

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
    this.texture = texture;
  }
  draw(): void {
    if (!this.gl || !this.shaderProgram || !this.texture) {
      return;
    }
    const gl = this.gl;
    const textureUniformLocation = gl.getUniformLocation(this.shaderProgram, 'u_texture');
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, this.video);

    gl.useProgram(this.shaderProgram);
    gl.uniform1i(textureUniformLocation, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  cleanUp() {
    this.gl.deleteProgram(this.shaderProgram);
    this.gl.deleteTexture(this.texture);
  }
}
