import HMSLogger from '../utils/logger';

// eslint-disable-next-line complexity
export function drawOnCanvas(canvas: HTMLCanvasElement, video: HTMLVideoElement, defaultFPS: number) {
  const gl = canvas.getContext('webgl2');

  // If we don't have a GL context, give up now

  if (!gl) {
    HMSLogger.e('PlaylistVideoManager', 'Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  // Vertex shader program
  const vsSource = `
      attribute mediump vec2 aVertexPosition;
      varying mediump vec2 vDirection;
  
      void main( void ) 
      {
          gl_Position = vec4(aVertexPosition, 1.0, 1.0) * 2.0;
          vDirection = aVertexPosition;
      }
    `;

  // Fragment shader program
  const fsSource = `
    //<!-- //## code for pixel effects goes here if needed -->
  
    //# these two vars will access 
    varying mediump vec2 vDirection;
    uniform sampler2D uSampler;
    
    void main(void) 
    {
        //# get current video pixel's color (no FOR-loops needed like in JS Canvas)
        gl_FragColor = texture2D(uSampler, vec2(vDirection.x * 0.5 + 0.5, vDirection.y * 0.5 + 0.5));
        
        /*
        //# example of basic colour effect
        gl_FragColor.r = ( gl_FragColor.r * 1.15 );
        gl_FragColor.g = ( gl_FragColor.g * 0.8 );
        gl_FragColor.b = ( gl_FragColor.b * 0.45 );
        */
    }
    `;

  const program: WebGLProgram | null = gl.createProgram();
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  if (!program || !vertexShader || !fragmentShader) {
    return;
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.useProgram(program);

  const params = {
    attributes: ['aVertexPosition'],
    uniforms: ['someVal', 'uSampler'],
  };

  const attributes: Record<string, any> = {};

  for (let i = 0; i < params.attributes.length; i++) {
    const attributeName = params.attributes[i];
    attributes[attributeName] = gl.getAttribLocation(program, attributeName);
    gl.enableVertexAttribArray(attributes[attributeName]);
  }

  const uniforms: Record<string, any> = {};

  for (let i = 0; i < params.uniforms.length; i++) {
    const uniformName = params.uniforms[i];
    uniforms[uniformName] = gl.getUniformLocation(program, uniformName);

    gl.enableVertexAttribArray(attributes[uniformName]);
  }

  // some webGL initialization
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clearDepth(1.0);
  gl.disable(gl.DEPTH_TEST);

  const positionsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
  const positions = [-1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const verticesIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, verticesIndexBuffer);

  const vertexIndices = [0, 1, 2, 0, 2, 3];

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  //# must be LINEAR to avoid subtle pixelation (double-check this... test other options like NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);

  // update the texture from the video
  const updateTexture = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    //# next line fails in Safari if input video is NOT from same domain/server as this html code
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
    gl.bindTexture(gl.TEXTURE_2D, null);
  };

  let timer: any = null;
  function draw() {
    if (!gl) {
      return;
    }
    updateTexture(); //# update pixels with current video frame's pixels...

    gl.useProgram(program); //# apply our program

    gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
    gl.vertexAttribPointer(attributes['aVertexPosition'], 2, gl.FLOAT, false, 0, 0);

    //# Specify the texture to map onto the faces.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(uniforms['uSampler'], 0);

    //# Draw GPU
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, verticesIndexBuffer);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    timer = setTimeout(draw, 1000 / defaultFPS);
  }

  draw();
  return timer;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) {
    HMSLogger.e('PlaylistVideoManager', `Unable to create shade of type ${type}`);
    return;
  }
  // Send the source to the shader object
  gl.shaderSource(shader, source);
  // Compile the shader program
  gl.compileShader(shader);
  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    HMSLogger.e('PlaylistVideoManager', `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}
