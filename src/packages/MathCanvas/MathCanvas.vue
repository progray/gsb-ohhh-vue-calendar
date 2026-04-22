<template>
  <canvas ref="canvasRef" class="math-canvas"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
let animationFrame = null
let gl = null
let program = null
let startTime = 0
let fadeInStart = 0
const FADE_IN_DURATION = 3000

const TARGET_FPS = 24
const FRAME_INTERVAL = 1000 / TARGET_FPS
let lastFrameTime = 0
let isVisible = true
let animationContext = null

const RENDER_SCALE = 0.65

const ALGORITHMS = ['fractal', 'particleFlow', 'ripple', 'voronoi', 'lissajous']

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min, max) {
  return Math.random() * (max - min) + min
}

function hslToRgb(h, s, l) {
  h = h / 360
  s = s / 100
  l = l / 100
  
  let r, g, b
  
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }
  
  return [r, g, b]
}

function generateColorPalette(algorithm) {
  const baseHue = randomInt(0, 360)
  const hueVariation = randomInt(40, 100)
  const saturation = randomInt(30, 50)
  const lightness = randomInt(80, 90)
  
  const bgColor = hslToRgb(baseHue, saturation, lightness)
  
  const lineHue1 = (baseHue + hueVariation) % 360
  const lineHue2 = (baseHue + 360 - hueVariation) % 360
  const lineSaturation = randomInt(40, 60)
  const lineLightness = randomInt(50, 65)
  
  const lineColor1 = hslToRgb(lineHue1, lineSaturation, lineLightness)
  const lineColor2 = hslToRgb(lineHue2, lineSaturation, lineLightness)
  
  const accentHue = (baseHue + randomInt(140, 220)) % 360
  const accentColor = hslToRgb(accentHue, randomInt(45, 65), randomInt(55, 70))
  
  return {
    bgColor,
    lineColor1,
    lineColor2,
    accentColor,
    speed: randomFloat(0.35, 0.85),
    contrast: randomFloat(1.4, 1.9),
    evolutionType: Math.random() > 0.5 ? 'continuous' : 'slow'
  }
}

function getVertexShader() {
  return `
    attribute vec2 a_position;
    varying vec2 v_uv;
    
    void main() {
      v_uv = (a_position + 1.0) * 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `
}

function getFractalShader(palette) {
  return `
    precision mediump float;
    
    varying vec2 v_uv;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec3 u_bgColor;
    uniform vec3 u_lineColor1;
    uniform vec3 u_lineColor2;
    uniform vec3 u_accentColor;
    uniform float u_speed;
    uniform float u_contrast;
    uniform float u_fadeIn;
    
    const int MAX_ITER = 40;
    const float BAILOUT = 4.0;
    
    vec3 paletteFunc(float t) {
      float d = t * 3.0;
      float a = floor(d);
      float b = fract(d);
      
      vec3 col;
      if (a < 1.0) {
        col = mix(u_bgColor, u_lineColor1, b);
      } else if (a < 2.0) {
        col = mix(u_lineColor1, u_lineColor2, b);
      } else {
        col = mix(u_lineColor2, u_accentColor, b);
      }
      return col;
    }
    
    void main() {
      vec2 uv = v_uv * 2.0 - 1.0;
      uv.x *= u_resolution.x / u_resolution.y;
      
      float t = u_time * u_speed * 0.2;
      float zoom = 1.5 + sin(t * 0.15) * 0.3;
      
      vec2 center = vec2(-0.5 + sin(t * 0.1) * 0.06, 0.0 + cos(t * 0.15) * 0.06);
      uv = uv / zoom + center;
      
      vec2 z = vec2(0.0);
      vec2 c = uv;
      
      float iter = 0.0;
      for (int i = 0; i < MAX_ITER; i++) {
        if (dot(z, z) > BAILOUT) break;
        float x2 = z.x * z.x;
        float y2 = z.y * z.y;
        z.y = 2.0 * z.x * z.y + c.y;
        z.x = x2 - y2 + c.x;
        iter += 1.0;
      }
      
      float intensity = iter / float(MAX_ITER);
      intensity = pow(intensity, 0.5) * u_contrast;
      intensity = clamp(intensity, 0.0, 1.0);
      
      vec3 color = paletteFunc(intensity);
      
      float vignette = 1.0 - 0.2 * length(v_uv - 0.5);
      color *= vignette;
      
      color = mix(u_bgColor, color, u_fadeIn);
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
}

function getParticleFlowShader(palette) {
  return `
    precision mediump float;
    
    varying vec2 v_uv;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec3 u_bgColor;
    uniform vec3 u_lineColor1;
    uniform vec3 u_lineColor2;
    uniform vec3 u_accentColor;
    uniform float u_speed;
    uniform float u_contrast;
    uniform float u_fadeIn;
    
    const int PARTICLES = 25;
    const float PARTICLE_SIZE = 0.008;
    
    float hash(float n) {
      return fract(sin(n) * 43758.5453123);
    }
    
    vec2 hash22(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.xx + p3.yz) * p3.zy);
    }
    
    vec2 getParticlePos(float fi, float t) {
      vec2 basePos = hash22(vec2(fi, fi * 2.0)) - 0.5;
      basePos.x *= u_resolution.x / u_resolution.y;
      
      float angle = t * 0.15 + fi * 1.5;
      float driftX = sin(t * 0.15 + fi * 1.1) * 0.25;
      float driftY = cos(t * 0.2 + fi * 0.8) * 0.25;
      
      return basePos + vec2(cos(angle), sin(angle)) * 0.15 + vec2(driftX, driftY);
    }
    
    void main() {
      vec2 uv = v_uv;
      uv.x *= u_resolution.x / u_resolution.y;
      
      float t = u_time * u_speed * 0.35;
      
      vec3 color = u_bgColor;
      
      for (int i = 0; i < PARTICLES; i++) {
        float fi = float(i);
        
        vec2 pos = getParticlePos(fi, t);
        vec2 prevPos = getParticlePos(fi, t - 0.08);
        vec2 prevPos2 = getParticlePos(fi, t - 0.16);
        
        float dist = length(uv - pos);
        float intensity = smoothstep(PARTICLE_SIZE * 2.0, 0.0, dist);
        
        float trailDist = min(length(uv - prevPos), length(uv - prevPos2));
        float trailIntensity = smoothstep(PARTICLE_SIZE * 1.5, 0.0, trailDist) * 0.5;
        
        float colorMix = hash(fi);
        vec3 particleColor = mix(u_lineColor1, u_lineColor2, colorMix);
        particleColor = mix(particleColor, u_accentColor, hash(fi * 3.14) * 0.35);
        
        float glow = smoothstep(PARTICLE_SIZE * 5.0, 0.0, dist);
        glow = pow(glow, 2.0);
        
        color = mix(color, particleColor, glow * 0.2 * u_contrast);
        color = mix(color, particleColor, trailIntensity * 0.35);
        color = mix(color, particleColor, intensity * 0.6);
      }
      
      float vignette = 1.0 - 0.15 * length(v_uv - 0.5);
      color *= vignette;
      
      color = mix(u_bgColor, color, u_fadeIn);
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
}

function getRippleShader(palette) {
  return `
    precision mediump float;
    
    varying vec2 v_uv;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec3 u_bgColor;
    uniform vec3 u_lineColor1;
    uniform vec3 u_lineColor2;
    uniform vec3 u_accentColor;
    uniform float u_speed;
    uniform float u_contrast;
    uniform float u_fadeIn;
    
    const int WAVES = 4;
    
    vec2 hash22(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.xx + p3.yz) * p3.zy);
    }
    
    void main() {
      vec2 uv = v_uv;
      uv.x *= u_resolution.x / u_resolution.y;
      
      float t = u_time * u_speed * 0.3;
      
      vec3 color = u_bgColor;
      
      for (int i = 0; i < WAVES; i++) {
        float fi = float(i);
        vec2 center = hash22(vec2(fi, fi * 3.0)) - 0.5;
        center.x *= u_resolution.x / u_resolution.y;
        
        float phase = t * (0.5 + fi * 0.12);
        float frequency = 8.0 + fi * 2.0;
        
        float dist = length(uv - center);
        float wave = sin(dist * frequency - phase);
        
        float pulse = 0.5 + 0.5 * sin(t * (0.35 + fi * 0.06) + fi);
        wave *= pulse;
        
        float decay = exp(-dist * 1.0);
        wave *= decay;
        
        float ring = abs(sin(dist * frequency * 0.35 - phase * 0.5));
        ring = pow(ring, 12.0);
        ring *= decay;
        ring *= u_contrast;
        
        vec3 waveColor = mix(u_lineColor1, u_lineColor2, fi / float(WAVES));
        waveColor = mix(waveColor, u_accentColor, 0.15 + fi * 0.08);
        
        color = mix(color, waveColor, ring * 0.3);
      }
      
      float vignette = 1.0 - 0.15 * length(v_uv - 0.5);
      color *= vignette;
      
      color = mix(u_bgColor, color, u_fadeIn);
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
}

function getVoronoiShader(palette) {
  return `
    precision mediump float;
    
    varying vec2 v_uv;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec3 u_bgColor;
    uniform vec3 u_lineColor1;
    uniform vec3 u_lineColor2;
    uniform vec3 u_accentColor;
    uniform float u_speed;
    uniform float u_contrast;
    uniform float u_fadeIn;
    
    vec2 hash22(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.xx + p3.yz) * p3.zy);
    }
    
    vec2 getCellPoint(vec2 cellId, float t) {
      vec2 basePos = hash22(cellId) - 0.5;
      float offsetX = sin(t * 0.2 + cellId.x * 1.0 + cellId.y * 0.7) * 0.2;
      float offsetY = cos(t * 0.18 + cellId.x * 0.8 + cellId.y * 1.0) * 0.2;
      return basePos + vec2(offsetX, offsetY) * 0.25;
    }
    
    void main() {
      vec2 uv = v_uv;
      uv.x *= u_resolution.x / u_resolution.y;
      
      float t = u_time * u_speed * 0.25;
      
      float scale = 4.0 + sin(t * 0.06) * 0.6;
      vec2 scaledUV = uv * scale;
      
      vec2 cell = floor(scaledUV);
      vec2 fcell = fract(scaledUV);
      
      float minDist = 10.0;
      float secondMinDist = 10.0;
      vec2 closestCell = cell;
      
      for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
          vec2 neighbor = vec2(float(x), float(y));
          vec2 point = getCellPoint(cell + neighbor, t);
          vec2 diff = neighbor + point - fcell;
          float dist = length(diff);
          
          if (dist < minDist) {
            secondMinDist = minDist;
            minDist = dist;
            closestCell = cell + neighbor;
          } else if (dist < secondMinDist) {
            secondMinDist = dist;
          }
        }
      }
      
      float edgeDist = secondMinDist - minDist;
      
      float cellId = closestCell.x * 13.0 + closestCell.y * 7.0;
      float cellHash = fract(sin(cellId) * 43758.5453);
      
      vec3 cellColor = mix(u_bgColor, u_lineColor1, cellHash * 0.2);
      cellColor = mix(cellColor, u_lineColor2, cellHash * 0.12);
      cellColor = mix(cellColor, u_accentColor, cellHash * 0.08);
      
      float cellShade = 1.0 - minDist * 0.3;
      cellColor *= cellShade;
      
      float edgeIntensity = 1.0 - smoothstep(0.0, 0.12, edgeDist);
      edgeIntensity = pow(edgeIntensity, 1.2) * u_contrast;
      
      float edgePulse = 0.6 + 0.4 * sin(t * 1.0 + cellHash * 6.28);
      edgeIntensity *= 0.6 + 0.4 * edgePulse;
      
      vec3 edgeColor = mix(u_lineColor1, u_lineColor2, cellHash);
      edgeColor = mix(edgeColor, u_accentColor, cellHash * 0.3);
      
      vec3 color = mix(cellColor, edgeColor, edgeIntensity * 0.45);
      
      float vignette = 1.0 - 0.12 * length(v_uv - 0.5);
      color *= vignette;
      
      color = mix(u_bgColor, color, u_fadeIn);
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
}

function getLissajousShader(palette) {
  return `
    precision mediump float;
    
    varying vec2 v_uv;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec3 u_bgColor;
    uniform vec3 u_lineColor1;
    uniform vec3 u_lineColor2;
    uniform vec3 u_accentColor;
    uniform float u_speed;
    uniform float u_contrast;
    uniform float u_fadeIn;
    
    const int CURVES = 4;
    const float LINE_WIDTH = 0.006;
    
    vec2 lissajous(float t, float a, float b, float delta, float scale) {
      return vec2(
        sin(a * t + delta) * scale,
        cos(b * t) * scale
      );
    }
    
    float distToSegment(vec2 p, vec2 a, vec2 b) {
      vec2 pa = p - a;
      vec2 ba = b - a;
      float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
      return length(pa - ba * h);
    }
    
    void main() {
      vec2 uv = v_uv * 2.0 - 1.0;
      uv.x *= u_resolution.x / u_resolution.y;
      
      float t = u_time * u_speed * 0.18;
      
      vec3 color = u_bgColor;
      
      for (int i = 0; i < CURVES; i++) {
        float fi = float(i);
        
        float a = 2.0 + fi * 0.6;
        float b = 3.0 + fi * 1.0;
        float delta = t * (0.3 + fi * 0.1) + fi * 0.5;
        float scale = 0.3 + fi * 0.06;
        
        float phaseOffset = sin(t * 0.2 + fi * 1.2) * 0.12;
        scale += phaseOffset;
        
        float totalDist = 1.0;
        vec2 prevPoint = lissajous(0.0, a, b, delta, scale);
        
        for (int j = 0; j < 50; j++) {
          float ft = float(j) / 50.0 * 6.28318;
          vec2 currentPoint = lissajous(ft, a, b, delta, scale);
          
          float dist = distToSegment(uv, prevPoint, currentPoint);
          totalDist = min(totalDist, dist);
          
          prevPoint = currentPoint;
        }
        
        float lineIntensity = smoothstep(LINE_WIDTH * 2.0, 0.0, totalDist);
        
        float glowIntensity = smoothstep(LINE_WIDTH * 6.0, 0.0, totalDist);
        glowIntensity = pow(glowIntensity, 2.0) * u_contrast;
        
        float colorMix = fi / float(CURVES);
        vec3 curveColor = mix(u_lineColor1, u_lineColor2, colorMix);
        curveColor = mix(curveColor, u_accentColor, sin(fi + t * 0.12) * 0.3 + 0.3);
        
        float pulse = 0.6 + 0.4 * sin(t * 0.5 + fi * 1.1);
        
        color = mix(color, curveColor, glowIntensity * 0.18 * pulse);
        color = mix(color, curveColor, lineIntensity * 0.55 * pulse);
      }
      
      for (int i = 0; i < CURVES; i++) {
        float fi = float(i);
        float a = 2.0 + fi * 0.6;
        float b = 3.0 + fi * 1.0;
        float delta = t * (0.3 + fi * 0.1) + fi * 0.5;
        float scale = 0.3 + fi * 0.06;
        
        float pointT = t * 0.35;
        vec2 point = lissajous(pointT, a, b, delta, scale);
        
        float dist = length(uv - point);
        float pointIntensity = smoothstep(0.02, 0.0, dist);
        
        float pointGlow = smoothstep(0.08, 0.0, dist);
        pointGlow = pow(pointGlow, 1.8) * u_contrast;
        
        vec3 pointColor = mix(u_accentColor, u_lineColor1, 0.4);
        color = mix(color, pointColor, pointGlow * 0.3);
        color = mix(color, vec3(1.0), pointIntensity * 0.6);
      }
      
      float vignette = 1.0 - 0.15 * length(v_uv - 0.5);
      color *= vignette;
      
      color = mix(u_bgColor, color, u_fadeIn);
      
      gl_FragColor = vec4(color, 1.0);
    }
  `
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program))
    return null
  }
  return program
}

function selectAlgorithm() {
  const seed = Math.random()
  if (seed < 0.2) return 'fractal'
  if (seed < 0.4) return 'particleFlow'
  if (seed < 0.6) return 'ripple'
  if (seed < 0.8) return 'voronoi'
  return 'lissajous'
}

function initWebGL(canvas, algorithm, palette) {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * RENDER_SCALE
  const rect = canvas.getBoundingClientRect()
  
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  
  gl = canvas.getContext('webgl', {
    antialias: false,
    alpha: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    failIfMajorPerformanceCaveat: true
  })
  
  if (!gl) {
    console.error('WebGL not supported')
    return null
  }
  
  gl.viewport(0, 0, canvas.width, canvas.height)
  
  const vertexShaderSource = getVertexShader()
  let fragmentShaderSource
  
  switch (algorithm) {
    case 'fractal':
      fragmentShaderSource = getFractalShader(palette)
      break
    case 'particleFlow':
      fragmentShaderSource = getParticleFlowShader(palette)
      break
    case 'ripple':
      fragmentShaderSource = getRippleShader(palette)
      break
    case 'voronoi':
      fragmentShaderSource = getVoronoiShader(palette)
      break
    case 'lissajous':
      fragmentShaderSource = getLissajousShader(palette)
      break
    default:
      fragmentShaderSource = getVoronoiShader(palette)
  }
  
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
  
  if (!vertexShader || !fragmentShader) {
    return null
  }
  
  program = createProgram(gl, vertexShader, fragmentShader)
  if (!program) {
    return null
  }
  
  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)
  
  const positions = new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    1, 1
  ])
  
  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
  
  const positionLocation = gl.getAttribLocation(program, 'a_position')
  gl.enableVertexAttribArray(positionLocation)
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
  
  return {
    program,
    canvas,
    dpr,
    algorithm,
    palette,
    baseDpr: dpr
  }
}

function render(time, context) {
  if (!gl || !program || !context) return
  
  const elapsed = time - startTime
  const fadeInElapsed = time - fadeInStart
  const fadeInProgress = Math.min(fadeInElapsed / FADE_IN_DURATION, 1.0)
  const fadeInEased = fadeInProgress * (2 - fadeInProgress)
  
  gl.useProgram(program)
  
  const timeLocation = gl.getUniformLocation(program, 'u_time')
  const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
  const bgColorLocation = gl.getUniformLocation(program, 'u_bgColor')
  const lineColor1Location = gl.getUniformLocation(program, 'u_lineColor1')
  const lineColor2Location = gl.getUniformLocation(program, 'u_lineColor2')
  const accentColorLocation = gl.getUniformLocation(program, 'u_accentColor')
  const speedLocation = gl.getUniformLocation(program, 'u_speed')
  const contrastLocation = gl.getUniformLocation(program, 'u_contrast')
  const fadeInLocation = gl.getUniformLocation(program, 'u_fadeIn')
  
  const { canvas, dpr, palette } = context
  
  gl.uniform1f(timeLocation, elapsed / 1000)
  gl.uniform2f(resolutionLocation, canvas.width / dpr, canvas.height / dpr)
  gl.uniform3fv(bgColorLocation, palette.bgColor)
  gl.uniform3fv(lineColor1Location, palette.lineColor1)
  gl.uniform3fv(lineColor2Location, palette.lineColor2)
  gl.uniform3fv(accentColorLocation, palette.accentColor)
  gl.uniform1f(speedLocation, palette.speed)
  gl.uniform1f(contrastLocation, palette.contrast)
  gl.uniform1f(fadeInLocation, fadeInEased)
  
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
}

function animate(timestamp, context) {
  if (!isVisible) {
    animationFrame = requestAnimationFrame((t) => animate(t, context))
    return
  }
  
  const currentTime = timestamp || performance.now()
  const elapsed = currentTime - lastFrameTime
  
  if (elapsed >= FRAME_INTERVAL) {
    lastFrameTime = currentTime - (elapsed % FRAME_INTERVAL)
    render(currentTime, context)
  }
  
  animationFrame = requestAnimationFrame((t) => animate(t, context))
}

function handleVisibilityChange() {
  isVisible = !document.hidden
  if (isVisible) {
    lastFrameTime = performance.now()
  }
}

function handleResize(canvas, context) {
  if (!context) return
  
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * RENDER_SCALE
  const rect = canvas.getBoundingClientRect()
  
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  
  if (gl) {
    gl.viewport(0, 0, canvas.width, canvas.height)
  }
  
  context.dpr = dpr
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const algorithm = selectAlgorithm()
  const palette = generateColorPalette(algorithm)
  
  console.log(`Selected animation: ${algorithm}`)
  
  const context = initWebGL(canvas, algorithm, palette)
  if (!context) return
  
  animationContext = context
  startTime = performance.now()
  fadeInStart = startTime
  lastFrameTime = startTime
  isVisible = !document.hidden
  
  animate(startTime, context)
  
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  const resizeObserver = new ResizeObserver(() => {
    handleResize(canvas, context)
  })
  
  resizeObserver.observe(canvas)
  
  window.addEventListener('resize', () => handleResize(canvas, context))
  
  onUnmounted(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    resizeObserver.disconnect()
    window.removeEventListener('resize', () => handleResize(canvas, context))
  })
})
</script>

<style scoped>
.math-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  image-rendering: auto;
}
</style>
