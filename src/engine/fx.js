import * as THREE6 from "three";
function tex(size, draw2) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw2(c.getContext("2d"), size);
  const t = new THREE6.CanvasTexture(c);
  t.colorSpace = THREE6.SRGBColorSpace;
  return t;
}
var R2 = Math.random;
var smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
function hash2(i, j, seed) {
  let n = Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(seed, 144665) | 0;
  n = Math.imul(n ^ n >>> 13, 1274126177);
  return ((n ^ n >>> 16) >>> 0) / 4294967295;
}
function vnoise(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed), c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm2(x, y, seed, oct = 4) {
  let s = 0, amp = 0.5, f = 1, norm = 0;
  for (let o = 0; o < oct; o++) {
    s += amp * vnoise(x * f, y * f, seed + o * 31);
    norm += amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return s / norm;
}
// Текстура по функции пикселя: fn(u, v) → [r, g, b, a(0…1)]
function pix(w, h, fn) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d"), img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [r, gg, b, a] = fn((x + 0.5) / w, (y + 0.5) / h);
    const i = (y * w + x) * 4;
    img.data[i] = r;
    img.data[i + 1] = gg;
    img.data[i + 2] = b;
    img.data[i + 3] = Math.max(0, Math.min(255, a * 255));
  }
  g.putImageData(img, 0, 0);
  const t = new THREE6.CanvasTexture(c);
  t.colorSpace = THREE6.SRGBColorSpace;
  return t;
}
var TEX = {};
function textures() {
  if (TEX.glow) return TEX;
  TEX.glow = tex(128, (g, s) => {
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.2, "rgba(255,255,255,.8)");
    gr.addColorStop(0.5, "rgba(255,255,255,.2)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, s, s);
  });
  // Вид «с торца» (так вспышку видит стрелок в прицел): неровные лепестки газовых струй
  // вокруг горячего ядра. Лепестки мягкие и разной длины — не «звезда» с ровными лучами.
  const star = (seed, petals) => tex(256, (g, s) => {
    g.translate(s / 2, s / 2);
    const n = petals + (seed % 2);
    for (let i = 0; i < n; i++) {
      g.save();
      g.rotate(Math.PI * 2 * i / n + (R2() - 0.5) * 0.6);
      const L = s * (0.2 + R2() * 0.26), w = s * (0.03 + R2() * 0.035);
      const gr2 = g.createLinearGradient(0, 0, L, 0);
      gr2.addColorStop(0, "rgba(255,236,190,.95)");
      gr2.addColorStop(0.35, "rgba(255,170,70,.55)");
      gr2.addColorStop(1, "rgba(200,60,10,0)");
      g.fillStyle = gr2;
      g.beginPath();
      g.moveTo(0, -w);
      g.bezierCurveTo(L * 0.35, -w * 1.3, L * 0.7, -w * 0.5, L, (R2() - 0.5) * w);
      g.bezierCurveTo(L * 0.7, w * 0.5, L * 0.35, w * 1.3, 0, w);
      g.fill();
      g.restore();
    }
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, s * 0.16);
    gr.addColorStop(0, "rgba(255,252,240,1)");
    gr.addColorStop(0.45, "rgba(255,214,140,.75)");
    gr.addColorStop(1, "rgba(255,140,40,0)");
    g.fillStyle = gr;
    g.beginPath();
    g.arc(0, 0, s * 0.16, 0, 7);
    g.fill();
  });
  TEX.flash = [star(0, 6), star(1, 7), star(2, 5)];
  // Осевые текстуры: u — вдоль оси канала (0 — дульный срез), v — поперёк.
  // disk — недорасширенная струя с «бочкой» и диском Маха: узкая, раскалённая, с резким фронтом;
  // fire — вторичная вспышка (догорание газов в воздухе): рыхлый оранжево-красный факел.
  TEX.disk = pix(256, 64, (u, v, i) => {
    const a = Math.abs(v - 0.5) * 2;
    const env = smooth(0, 0.18, u) * (1 - smooth(0.62, 0.8, u));
    const w = 0.28 + 0.5 * Math.sin(Math.min(1, u / 0.75) * Math.PI) * 0.55;
    const core = Math.exp(-Math.pow(a / w, 2.4)) * env;
    const disk = Math.exp(-Math.pow((u - 0.66) / 0.035, 2)) * Math.exp(-Math.pow(a / 0.55, 2));
    const I = Math.min(1, core * 0.9 + disk * 0.9);
    return [255, 214 + 41 * I, 150 + 100 * I * I, I];
  });
  const fire = (seed) => pix(256, 128, (u, v) => {
    const a = Math.abs(v - 0.5) * 2;
    const n = fbm2(u * 5, v * 3, seed, 4), n2 = fbm2(u * 11 + 3, v * 7, seed + 9, 3);
    const w = (0.22 + 0.7 * Math.pow(Math.sin(Math.min(1, u) * Math.PI), 0.9)) * (0.75 + 0.45 * n);
    const env = smooth(0, 0.2, u) * (1 - smooth(0.5 + 0.3 * n, 1, u));
    const d = Math.max(0, 1 - Math.pow(a / w, 1.6)) * env;
    const I = Math.min(1, Math.pow(d, 1.3) * (0.6 + 0.7 * n2));
    return [255, 90 + 150 * I, 25 + 110 * I * I, I];
  });
  TEX.fire = [fire(3), fire(7)];
  // Дым бездымного пороха: полупрозрачные рваные клубы (fbm), без жёсткого края.
  // Атлас 2×2, у каждого кадра своя форма. Цвет белый — оттенок и освещённость задаёт шейдер.
  TEX.smoke = (() => {
    const S2 = 256, h = S2 / 2, c = document.createElement("canvas");
    c.width = c.height = S2;
    const g = c.getContext("2d"), img = g.createImageData(S2, S2);
    for (let f = 0; f < 4; f++) {
      const ox = f % 2 * h, oy = (f >> 1) * h, sd = 11 + f * 17;
      for (let y = 0; y < h; y++) for (let x = 0; x < h; x++) {
        const u = x / h, v = y / h, dx = u - 0.5, dy = v - 0.5;
        const r = Math.hypot(dx, dy) * 2;
        const n = fbm2(u * 4 + f * 3.1, v * 4, sd, 5);
        const edge = 1 - smooth(0.35 + 0.4 * n, 1, r + 0.25 * (n - 0.5));
        const dens = Math.min(1, Math.max(0, n - 0.18) * 2.6) * edge;
        const i = ((oy + y) * S2 + ox + x) * 4;
        const shade = 0.8 + 0.2 * fbm2(u * 9, v * 9, sd + 5, 3) - 0.12 * dy;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.min(255, 255 * shade);
        img.data[i + 3] = Math.min(255, 255 * dens);
      }
    }
    g.putImageData(img, 0, 0);
    const t = new THREE6.CanvasTexture(c);
    t.colorSpace = THREE6.SRGBColorSpace;
    return t;
  })();
  TEX.spark = tex(64, (g, s) => {
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, "rgba(255,250,230,1)");
    gr.addColorStop(0.25, "rgba(255,200,110,.9)");
    gr.addColorStop(1, "rgba(255,120,30,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, s, s);
  });
  TEX.hole = tex(64, (g, s) => {
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, "rgba(20,18,16,1)");
    gr.addColorStop(0.35, "rgba(40,36,30,.9)");
    gr.addColorStop(0.6, "rgba(120,110,95,.4)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, s, s);
  });
  return TEX;
}
var additive = (map, color, opacity = 1) => new THREE6.SpriteMaterial({ map, color, transparent: true, opacity, blending: THREE6.AdditiveBlending, depthWrite: false, toneMapped: false });
var VS = `
attribute vec3 iPos;
attribute vec4 iData;   // размер, поворот, альфа, кадр атласа
attribute vec4 iCol;    // цвет + растяжение (искры)
varying vec2 vUv;
varying float vA;
varying vec3 vC;
#ifdef LIT
// Дым не светится сам: он рассеивает свет сцены. Окружение (по времени суток), вспышка выстрела,
// дежурный фонарь и лучи оружейных фонарей — точечные/конусные источники, освещённость в вершине.
uniform vec3 uAmb;
uniform vec4 uFlash;      // xyz — точка, w — сила
uniform vec3 uFlashCol;
uniform vec4 uLamp;
uniform vec3 uLampCol;
uniform vec4 uTorchP[2];  // xyz — линза, w — сила
uniform vec4 uTorchD[2];  // xyz — ось, w — cos полуугла
uniform vec3 uTorchC[2];
#endif
#include <fog_pars_vertex>
void main() {
  vec4 mvPosition = modelViewMatrix * vec4(iPos, 1.0);
  float c = cos(iData.y), s = sin(iData.y);
  vec2 q = position.xy;
  q.x *= 1.0 + iCol.w;
  mvPosition.xy += vec2(q.x * c - q.y * s, q.x * s + q.y * c) * iData.x;
  gl_Position = projectionMatrix * mvPosition;
  float f = iData.w;
  vUv = ATLAS > 1.0 ? (uv + vec2(mod(f, 2.0), floor(f / 2.0))) * 0.5 : uv;
  vA = iData.z;
  vC = iCol.rgb;
  #ifdef LIT
  vec3 L = uAmb;
  vec3 d = iPos - uFlash.xyz;
  L += uFlashCol * uFlash.w / (1.0 + 60.0 * dot(d, d));
  d = iPos - uLamp.xyz;
  L += uLampCol * uLamp.w / (1.0 + dot(d, d));
  for (int i = 0; i < 2; i++) {
    vec3 v = iPos - uTorchP[i].xyz;
    float dd = max(dot(v, v), 1e-6);
    float cs = dot(v * inversesqrt(dd), uTorchD[i].xyz);
    L += uTorchC[i] * uTorchP[i].w * smoothstep(uTorchD[i].w, mix(uTorchD[i].w, 1.0, 0.4), cs) / max(dd, 0.04);
  }
  vC *= L;
  #endif
  #include <fog_vertex>
}`;
var FS = `
uniform sampler2D map;
varying vec2 vUv;
varying float vA;
varying vec3 vC;
#include <fog_pars_fragment>
void main() {
  vec4 t = texture2D(map, vUv);
  gl_FragColor = vec4(vC * t.rgb, t.a * vA);
  if (gl_FragColor.a < 0.003) discard;
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;
// Общие униформы освещения дыма (один объект на все системы частиц)
function smokeLightUniforms() {
  return {
    uAmb: { value: new THREE6.Color(1, 1, 1) },
    uFlash: { value: new THREE6.Vector4(0, -100, 0, 0) },
    uFlashCol: { value: new THREE6.Color(1, 0.62, 0.3) },
    uLamp: { value: new THREE6.Vector4(0, -100, 0, 0) },
    uLampCol: { value: new THREE6.Color(1, 0.62, 0.28) },
    uTorchP: { value: [new THREE6.Vector4(), new THREE6.Vector4()] },
    uTorchD: { value: [new THREE6.Vector4(1, 0, 0, 0.9), new THREE6.Vector4(1, 0, 0, 0.9)] },
    uTorchC: { value: [new THREE6.Color(), new THREE6.Color()] }
  };
}
var Particles = class {
  constructor(scene, map, max, o = {}) {
    this.max = max;
    const g = new THREE6.InstancedBufferGeometry();
    const quad = new THREE6.PlaneGeometry(1, 1);
    g.index = quad.index;
    g.setAttribute("position", quad.getAttribute("position"));
    g.setAttribute("uv", quad.getAttribute("uv"));
    this.aPos = new THREE6.InstancedBufferAttribute(new Float32Array(max * 3), 3).setUsage(THREE6.DynamicDrawUsage);
    this.aData = new THREE6.InstancedBufferAttribute(new Float32Array(max * 4), 4).setUsage(THREE6.DynamicDrawUsage);
    this.aCol = new THREE6.InstancedBufferAttribute(new Float32Array(max * 4), 4).setUsage(THREE6.DynamicDrawUsage);
    g.setAttribute("iPos", this.aPos);
    g.setAttribute("iData", this.aData);
    g.setAttribute("iCol", this.aCol);
    g.instanceCount = 0;
    const uniforms = THREE6.UniformsUtils.merge([THREE6.UniformsLib.fog, { map: { value: null } }]);
    uniforms.map.value = map;
    // освещение — общие объекты-униформы, не копии: FX обновляет их раз в кадр
    if (o.light) Object.assign(uniforms, o.light);
    const defines = { ATLAS: (o.atlas ? 2 : 1).toFixed(1) };
    if (o.light) defines.LIT = 1;
    const mat = new THREE6.ShaderMaterial({
      uniforms,
      vertexShader: VS,
      fragmentShader: FS,
      transparent: true,
      depthWrite: false,
      fog: true,
      blending: o.additive ? THREE6.AdditiveBlending : THREE6.NormalBlending,
      defines
    });
    mat.toneMapped = !o.additive;
    this.mesh = new THREE6.Mesh(g, mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = o.additive ? 3 : 2;
    scene.add(this.mesh);
    this.list = [];
    this.pool = [];
    this.sort = !!o.sort;
    this._e = new THREE6.Vector3();
  }
  // p: {pos, vel, life, size, grow, alpha, color, drag, buoy, gravity, turb, rot, spin, frame, stretch, fadeIn, align}
  // align — вытянуть частицу вдоль экранной проекции скорости (раскалённые крупинки пороха, искры)
  add(p) {
    if (this.list.length >= this.max) this.pool.push(this.list.shift());
    const q = this.pool.pop() || {};
    Object.assign(q, { t: 0, drag: 2, buoy: 0, gravity: 0, rot: R2() * 6.28, spin: (R2() - 0.5) * 1.2, frame: R2() * 4 | 0, stretch: 0, fadeIn: 0.06, grow: 0, turb: 0, align: false, growPow: 0.5 }, p);
    q.px = p.pos.x;
    q.py = p.pos.y;
    q.pz = p.pos.z;
    q.vx = p.vel.x;
    q.vy = p.vel.y;
    q.vz = p.vel.z;
    q.pos = q.vel = null;
    this.list.push(q);
  }
  update(dt, cam, wind) {
    const L = this.list;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i];
      p.t += dt;
      if (p.t >= p.life) {
        this.pool.push(p);
        L.splice(i, 1);
        continue;
      }
      const dr = Math.exp(-p.drag * dt);
      p.vx = p.vx * dr + wind.x * (1 - dr);
      p.vz = p.vz * dr + wind.z * (1 - dr);
      p.vy = p.vy * dr + (p.buoy - p.gravity) * dt;
      if (p.turb) {
        p.vx += (R2() - 0.5) * p.turb * dt;
        p.vy += (R2() - 0.5) * p.turb * dt;
        p.vz += (R2() - 0.5) * p.turb * dt;
      }
      p.px += p.vx * dt;
      p.py += p.vy * dt;
      p.pz += p.vz * dt;
      p.rot += p.spin * dt;
    }
    if (this.sort && L.length > 1 && cam) {
      const c = cam.position;
      for (const p of L) p.d = (p.px - c.x) ** 2 + (p.py - c.y) ** 2 + (p.pz - c.z) ** 2;
      L.sort((a, b) => b.d - a.d);
    }
    const P = this.aPos.array, D = this.aData.array, C = this.aCol.array;
    const e = this._e, vm = cam?.matrixWorldInverse;
    for (let i = 0; i < L.length; i++) {
      const p = L[i], k = p.t / p.life;
      P[i * 3] = p.px;
      P[i * 3 + 1] = p.py;
      P[i * 3 + 2] = p.pz;
      D[i * 4] = p.size + p.grow * Math.pow(k, p.growPow);
      let stretch = p.stretch * (1 - k);
      if (p.align && vm) {
        e.set(p.vx, p.vy, p.vz).transformDirection(vm);
        p.rot = Math.atan2(e.y, e.x);
        stretch *= Math.hypot(e.x, e.y);
      }
      D[i * 4 + 1] = p.rot;
      const fin = p.fadeIn > 0 ? Math.min(1, p.t / p.fadeIn) : 1;
      // облако растёт, но теряет плотность медленнее, чем линейно: дым висит, а тает под конец
      D[i * 4 + 2] = p.alpha * fin * (1 - k * k) * (1 - k * 0.35);
      D[i * 4 + 3] = p.frame;
      C[i * 4] = p.color[0];
      C[i * 4 + 1] = p.color[1];
      C[i * 4 + 2] = p.color[2];
      C[i * 4 + 3] = stretch;
    }
    this.mesh.geometry.instanceCount = L.length;
    if (L.length) {
      for (const a of [this.aPos, this.aData, this.aCol]) {
        a.clearUpdateRanges();
        a.addUpdateRange(0, L.length * a.itemSize);
        a.needsUpdate = true;
      }
    }
  }
};
// Осевой элемент вспышки: квад вдоль оси канала, развёрнутый вокруг оси к камере.
// Факел и «бочка» струи вытянуты вдоль ствола, поэтому спрайт-кружок для них не годится.
var AX_VS = `
uniform vec3 C; uniform vec3 A; uniform vec2 S;
varying vec2 vUv;
varying float vSide;
void main() {
  vec3 toCam = normalize(cameraPosition - C);
  vec3 side = cross(A, toCam);
  float sl = length(side);
  side = sl > 1e-4 ? side / sl : vec3(0.0, 1.0, 0.0);
  vec3 w = C + A * (position.x * S.x) + side * (position.y * S.y);
  vUv = uv;
  // вдоль оси квад вырождается в полоску — гасим его, «с торца» вспышку рисуют спрайты
  vSide = smoothstep(0.12, 0.45, sl);
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
}`;
var AX_FS = `
uniform sampler2D map; uniform vec3 color; uniform float opacity; uniform float flip;
varying vec2 vUv;
varying float vSide;
void main() {
  vec4 t = texture2D(map, vec2(vUv.x, flip > 0.5 ? 1.0 - vUv.y : vUv.y));
  gl_FragColor = vec4(color * t.rgb, t.a * opacity * vSide);
}`;
var AxialFlash = class {
  constructor(parent) {
    this.u = { map: { value: null }, color: { value: new THREE6.Color(1, 1, 1) }, opacity: { value: 1 }, flip: { value: 0 }, C: { value: new THREE6.Vector3() }, A: { value: new THREE6.Vector3(1, 0, 0) }, S: { value: new THREE6.Vector2(1, 1) } };
    const g = new THREE6.PlaneGeometry(1, 1);
    this.mesh = new THREE6.Mesh(g, new THREE6.ShaderMaterial({ uniforms: this.u, vertexShader: AX_VS, fragmentShader: AX_FS, transparent: true, depthWrite: false, blending: THREE6.AdditiveBlending, toneMapped: false, side: THREE6.DoubleSide }));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 4;
    this.mesh.visible = false;
    parent.add(this.mesh);
  }
  // center — середина элемента; axis — единичный вектор; len/width — метры
  set(map, center, axis, len, width, color, opacity) {
    const u = this.u;
    u.map.value = map;
    u.C.value.copy(center);
    u.A.value.copy(axis);
    u.S.value.set(len, width);
    u.color.value.setRGB(color[0], color[1], color[2]);
    u.opacity.value = opacity;
    u.flip.value = R2() < 0.5 ? 1 : 0;
    this.base = opacity;
    this.mesh.visible = opacity > 1e-3;
  }
  hide() {
    this.mesh.visible = false;
  }
};
// Цветовая температура светодиода → линейный RGB (приближение Таннера Хелланда).
function kelvinColor(k) {
  const t = k / 100;
  let r, g, b;
  if (t <= 66) {
    r = 255;
    g = 99.47 * Math.log(t) - 161.12;
    b = t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04;
  } else {
    r = 329.7 * Math.pow(t - 60, -0.1332);
    g = 288.12 * Math.pow(t - 60, -0.0755);
    b = 255;
  }
  const c = (v) => Math.min(255, Math.max(0, v)) / 255;
  return new THREE6.Color().setRGB(c(r), c(g), c(b), THREE6.SRGBColorSpace);
}
// Световое пятно отражателя: горячее ядро, тёмное «кольцо» перехода, широкая засветка и
// слабое внешнее гало от кромки отражателя. Небольшая неровность — след апельсиновой корки.
function torchCookie(hot, spill) {
  const S2 = 256, c = document.createElement("canvas");
  c.width = c.height = S2;
  const g = c.getContext("2d"), img = g.createImageData(S2, S2);
  for (let y = 0; y < S2; y++) for (let x = 0; x < S2; x++) {
    const dx = (x + 0.5) / S2 * 2 - 1, dy = (y + 0.5) / S2 * 2 - 1, r = Math.hypot(dx, dy);
    const a = Math.atan2(dy, dx);
    const core = Math.exp(-Math.pow(r / hot, 2.2));
    const ring = 0.06 * Math.exp(-Math.pow((r - hot * 1.9) / (hot * 0.45), 2));
    const sp = spill * Math.pow(Math.max(0, 1 - r), 1.4) * (1 - 0.35 * Math.exp(-Math.pow((r - hot * 1.35) / (hot * 0.3), 2)));
    const halo = 0.005 * Math.exp(-Math.pow((r - 0.86) / 0.08, 2));
    const orange = 1 + 0.035 * Math.sin(a * 23 + r * 40) * Math.sin(a * 7 - r * 25);
    const v = Math.min(1, (core + ring + sp + halo) * orange) * (r < 1 ? 1 : 0);
    const q = Math.pow(v, 1 / 2.2) * 255;
    const i = (y * S2 + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = q;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE6.CanvasTexture(c);
  t.colorSpace = THREE6.SRGBColorSpace;
  return t;
}
var BEAM_VS = `
varying vec3 vW;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
// Объёмный луч: по лучу зрения от камеры до задней грани конуса — 28 шагов; в каждой точке
// рассеяние ∝ I(θ)/t² (профиль пятна как у куки-текстуры). Земля перекрывает луч.
// Пыль/влага — медленный шум в мировых координатах, чтобы луч «жил».
var BEAM_FS = `
uniform vec3 color; uniform float k; uniform float len; uniform float tanA; uniform float hot; uniform float spill;
uniform float time; uniform vec3 camPos; uniform vec3 O; uniform vec3 D;
varying vec3 vW;
float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453); }
float n3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(mix(h(i), h(i+vec3(1,0,0)), f.x), mix(h(i+vec3(0,1,0)), h(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(h(i+vec3(0,0,1)), h(i+vec3(1,0,1)), f.x), mix(h(i+vec3(0,1,1)), h(i+vec3(1,1,1)), f.x), f.y), f.z); }
float groundAt(vec3 p){ return (abs(p.x + .8) < 3. && abs(p.z) < 2.5) ? .12 : 0.; }
void main(){
  vec3 rd = vW - camPos; float L = length(rd); rd /= L;
  float t0 = dot(camPos - O, D), dd = dot(rd, D);
  float s0 = 0., s1 = L;
  if (abs(dd) > 1e-4) {
    float a = (0.02 - t0) / dd, b = (len - t0) / dd;
    s0 = max(s0, min(a, b)); s1 = min(s1, max(a, b));
  }
  if (s1 <= s0) discard;
  const int N = 28;
  float ds = (s1 - s0) / float(N);
  float j = h(vec3(gl_FragCoord.xy, time));
  float acc = 0.;
  for (int i = 0; i < N; i++) {
    vec3 p = camPos + rd * (s0 + (float(i) + j) * ds);
    if (p.y < groundAt(p)) break;
    vec3 v = p - O; float t = dot(v, D);
    if (t <= 0.) continue;
    float r = length(v - D * t) / (t * tanA);
    if (r >= 1.) continue;
    float prof = exp(-pow(r / hot, 2.2)) + spill * pow(1. - r, 1.4);
    float tt = max(t, .25);
    float dust = .6 + .55 * n3(p * 1.7 + vec3(time * .05, time * .015, time * .03)) + .3 * n3(p * 7.3 - time * .08);
    acc += prof / (tt * tt) * dust * ds;
  }
  float nearCam = smoothstep(.02, .35, distance(vW, camPos));
  float a = k * acc;
  a = a / (1. + a * .6);
  gl_FragColor = vec4(color * a * nearCam, 1.);
}`;
var Torch = class {
  constructor(scene, T2) {
    this.spot = new THREE6.SpotLight(16777215, 0, 140, 0.62, 0, 2);
    this.spot.castShadow = true;
    this.spot.shadow.mapSize.set(1024, 1024);
    this.spot.shadow.camera.near = 0.03;
    this.spot.shadow.camera.far = 140;
    this.spot.shadow.bias = -2e-4;
    this.spot.shadow.normalBias = 0.02;
    this.spot.visible = false;
    scene.add(this.spot, this.spot.target);
    this.cookies = new Map();
    const geo = new THREE6.ConeGeometry(1, 1, 48, 1, true);
    geo.translate(0, -0.5, 0);
    geo.rotateZ(Math.PI / 2);
    this.beamU = { color: { value: new THREE6.Color() }, k: { value: 0 }, len: { value: 40 }, tanA: { value: 0.3 }, hot: { value: 0.3 }, spill: { value: 0.1 }, time: { value: 0 }, camPos: { value: new THREE6.Vector3() }, O: { value: new THREE6.Vector3() }, D: { value: new THREE6.Vector3(1, 0, 0) } };
    this.beam = new THREE6.Mesh(geo, new THREE6.ShaderMaterial({ uniforms: this.beamU, vertexShader: BEAM_VS, fragmentShader: BEAM_FS, transparent: true, depthWrite: false, blending: THREE6.AdditiveBlending, side: THREE6.BackSide, toneMapped: false, fog: false }));
    this.beam.frustumCulled = false;
    this.beam.visible = false;
    this.beam.renderOrder = 5;
    scene.add(this.beam);
    this.glare = new THREE6.Sprite(additive(T2.glow, 16777215, 0));
    this.glare.visible = false;
    this.glare.renderOrder = 6;
    scene.add(this.glare);
    this.t = 0;
    this._v = new THREE6.Vector3();
  }
  cookie(spec) {
    const key = spec.hot.toFixed(3) + "|" + spec.spill.toFixed(3);
    if (!this.cookies.has(key)) this.cookies.set(key, torchCookie(spec.hot, spec.spill));
    return this.cookies.get(key);
  }
  set(on, pos, dir, spec, level, haze, cam) {
    this.spot.visible = this.beam.visible = this.glare.visible = !!on;
    if (!on) {
      this.spot.intensity = 0;
      return;
    }
    const sp = this.spot, a = spec.angle ?? 0.62;
    if (sp.userData.key !== spec.key) {
      sp.userData.key = spec.key;
      sp.map = this.cookie(spec);
      sp.angle = a;
      sp.color.copy(kelvinColor(spec.kelvin));
      this.beamU.color.value.copy(sp.color);
      this.beamU.tanA.value = Math.tan(a);
      this.beamU.hot.value = spec.hot;
      this.beamU.spill.value = spec.spill;
      this.beamU.len.value = spec.throw;
      this.beam.scale.set(spec.throw, Math.tan(a) * spec.throw, Math.tan(a) * spec.throw);
    }
    // сила света в канделах → единицы сцены (солнце днём ≈2.4)
    sp.intensity = spec.cd * 0.022 * level;
    sp.position.copy(pos);
    sp.target.position.copy(pos).addScaledVector(dir, 10);
    this.beam.position.copy(pos);
    this.beam.quaternion.setFromUnitVectors(X_AXIS, dir);
    this.t += 0.016;
    this.beamU.time.value = this.t;
    this.beamU.O.value.copy(pos);
    this.beamU.D.value.copy(dir);
    this.beamU.k.value = 1.1e-3 * spec.cd * 0.022 * haze * level;
    if (cam) this.beamU.camPos.value.copy(cam.position);
    // блик линзы: виден, когда смотришь в фонарь
    this.glare.position.copy(pos).addScaledVector(dir, 2e-3);
    let facing = 0;
    if (cam) {
      this._v.copy(cam.position).sub(pos).normalize();
      facing = Math.max(0, this._v.dot(dir));
    }
    const g = Math.pow(facing, 6) * level;
    this.glare.material.opacity = Math.min(1, 0.25 * level + g * 1.2);
    this.glare.scale.setScalar(spec.lensR * 2.4 + g * 0.35 * Math.sqrt(spec.cd / 2e4));
  }
};
// След пули: квад вдоль отрезка траектории, развёрнутый к камере. Ширина не меньше ≈1 пикселя,
// при расширении яркость делится — далёкий трассер остаётся точкой, а не исчезает.
var ST_VS = `
attribute vec3 iA;
attribute vec3 iB;
attribute vec4 iP;   // ширина (м), альфа, яркость ядра, —
attribute vec3 iC;
uniform float uPix;
varying vec2 vUv;
varying float vAl;
varying vec3 vCol;
varying float vCore;
void main() {
  vec3 ax = iB - iA;
  float L = length(ax);
  vec3 A = L > 1e-6 ? ax / L : vec3(1.0, 0.0, 0.0);
  vec3 mid = (iA + iB) * 0.5;
  vec3 toCam = cameraPosition - mid;
  float dist = length(toCam);
  vec3 side = cross(A, toCam / max(dist, 1e-4));
  float sl = length(side);
  side = sl > 1e-4 ? side / sl : vec3(0.0, 1.0, 0.0);
  float w = max(iP.x, dist * uPix);
  vec3 p = mix(iA, iB, position.x + 0.5) + side * position.y * w;
  vUv = uv;
  vAl = iP.y * min(1.0, iP.x / w);
  vCol = iC;
  vCore = iP.z;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
var ST_FS = `
varying vec2 vUv;
varying float vAl;
varying vec3 vCol;
varying float vCore;
void main() {
  float a = abs(vUv.y - 0.5) * 2.0;
  float across = exp(-a * a * 5.0);
  float along = pow(vUv.x, 1.6);
  vec3 c = mix(vCol, vec3(1.0), vCore * exp(-a * a * 30.0) * along);
  gl_FragColor = vec4(c, vAl * across * along);
  if (gl_FragColor.a < 0.002) discard;
}`;
var Streaks = class {
  constructor(scene, max, additive) {
    this.max = max;
    const g = new THREE6.InstancedBufferGeometry();
    const quad = new THREE6.PlaneGeometry(1, 1);
    g.index = quad.index;
    g.setAttribute("position", quad.getAttribute("position"));
    g.setAttribute("uv", quad.getAttribute("uv"));
    const mk = (n) => new THREE6.InstancedBufferAttribute(new Float32Array(max * n), n).setUsage(THREE6.DynamicDrawUsage);
    this.a = { iA: mk(3), iB: mk(3), iP: mk(4), iC: mk(3) };
    for (const k in this.a) g.setAttribute(k, this.a[k]);
    g.instanceCount = 0;
    this.u = { uPix: { value: 1e-3 } };
    this.mesh = new THREE6.Mesh(g, new THREE6.ShaderMaterial({ uniforms: this.u, vertexShader: ST_VS, fragmentShader: ST_FS, transparent: true, depthWrite: false, blending: additive ? THREE6.AdditiveBlending : THREE6.NormalBlending, toneMapped: false, side: THREE6.DoubleSide }));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = additive ? 4 : 3;
    scene.add(this.mesh);
    this.n = 0;
  }
  begin(cam) {
    this.n = 0;
    if (cam) this.u.uPix.value = 2 * Math.tan(cam.fov * Math.PI / 360) / Math.max(300, innerHeight) * 1.3;
  }
  push(A, B, width, alpha, core, col) {
    if (this.n >= this.max) return;
    const i = this.n++, a = this.a;
    a.iA.array.set([A.x, A.y, A.z], i * 3);
    a.iB.array.set([B.x, B.y, B.z], i * 3);
    a.iP.array.set([width, alpha, core, 0], i * 4);
    a.iC.array.set([col.r, col.g, col.b], i * 3);
  }
  end() {
    this.mesh.geometry.instanceCount = this.n;
    if (this.n) for (const k in this.a) {
      const at = this.a[k];
      at.clearUpdateRanges();
      at.addUpdateRange(0, this.n * at.itemSize);
      at.needsUpdate = true;
    }
  }
};
// Видимость вспышки и искр по времени суток: днём глаз адаптирован к яркому фону и вспышка
// выстрела почти не видна; в сумерках и ночью — во всей красе.
var FLASH_VIS = { day: 0.38, dusk: 0.8, night: 1 };
var SMOKE_AMB = { day: [0.92, 0.94, 0.98], dusk: [0.34, 0.3, 0.3], night: [0.035, 0.042, 0.06] };
// Профили дульных устройств: множители осевой вспышки (disk), вторичного факела (fire),
// вида с торца (star), боковых/верхних струй (jets) и дыма.
var MUZZLE_FX = {
  bare: { disk: 1, fire: 1, star: 1, jets: 0, smoke: 1, sparks: 1 },
  fh: { disk: 0.75, fire: 0.14, star: 0.55, jets: 0, smoke: 0.9, sparks: 0.45, prongs: true },
  linear: { disk: 0.6, fire: 0.3, star: 0.25, jets: 0, smoke: 0.9, sparks: 0.4 },
  brake: { disk: 0.7, fire: 0.45, star: 0.8, jets: 1, smoke: 1.25, sparks: 0.8 },
  comp: { disk: 0.8, fire: 0.6, star: 0.8, jets: 0.8, smoke: 1.1, sparks: 0.8, up: true },
  supp: { disk: 0, fire: 0, star: 0, jets: 0, smoke: 0.45, sparks: 0 }
};
var MAX_SHELLS = 60;
var X_AXIS = new THREE6.Vector3(1, 0, 0);
var FX = class {
  constructor(scene, mats) {
    this.scene = scene;
    const T2 = textures();
    this.T = T2;
    this.mats = mats;
    this.timeOfDay = "day";
    // вспышка: ядро и вид с торца — спрайты; «бочка» струи, факел и боковые струи — осевые квады
    this.flash = new THREE6.Group();
    this.flash.visible = false;
    scene.add(this.flash);
    this.flashCore = new THREE6.Sprite(additive(T2.glow, 16770752));
    this.flashStar = new THREE6.Sprite(additive(T2.flash[0], 16764032));
    this.flash.add(this.flashCore, this.flashStar);
    this.axial = [0, 1, 2, 3, 4, 5, 6].map(() => new AxialFlash(scene));
    this.flashLight = new THREE6.PointLight(16754768, 0, 8, 2);
    scene.add(this.flashLight);
    this.flashAge = 99;
    this.light = smokeLightUniforms();
    this.smoke = new Particles(scene, T2.smoke, 480, { atlas: true, sort: true, light: this.light });
    this.fire = new Particles(scene, T2.spark, 260, { additive: true });
    this.tracers = new Streaks(scene, 64, true);
    this.traces = new Streaks(scene, 64, false);
    this.wind = new THREE6.Vector3(0.9, 0, 0.35);
    this.smokeWind = this.wind.clone().multiplyScalar(0.35);
    this.noWind = new THREE6.Vector3();
    this.heat = 0;
    this.wispT = 0;
    this.lastShotT = -99;
    this.clock = 0;
    this.shells = [];
    this.inst = /* @__PURE__ */ new Map();
    this.holes = [];
    this.holeGeo = new THREE6.CircleGeometry(0.012, 12);
    this.holeMat = new THREE6.MeshBasicMaterial({ map: T2.hole, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
    // до двух ЛЦУ и двух фонарей одновременно — у каждого свой луч
    this.lasers = [0, 1].map(() => {
      const beam = new THREE6.Mesh(
        new THREE6.CylinderGeometry(6e-4, 14e-4, 1, 6, 1, true).translate(0, 0.5, 0).rotateZ(-Math.PI / 2),
        new THREE6.MeshBasicMaterial({ color: 16722458, transparent: true, opacity: 0.22, blending: THREE6.AdditiveBlending, depthWrite: false, toneMapped: false })
      );
      beam.visible = false;
      beam.frustumCulled = false;
      const dot = new THREE6.Sprite(additive(T2.glow, 16724e3, 1));
      dot.visible = false;
      scene.add(beam, dot);
      return { beam, dot, color: null, k: 1 };
    });
    this.torches = [new Torch(scene, T2), new Torch(scene, T2)];
    this.torch = this.torches[0];
    this.ray = new THREE6.Raycaster();
    this._v = new THREE6.Vector3();
    this._v2 = new THREE6.Vector3();
    this._q = new THREE6.Quaternion();
    this._m = new THREE6.Matrix4();
    this._s = new THREE6.Vector3(1, 1, 1);
    this._c = new THREE6.Color();
  }
  // Что-то ещё движется — кадр нужно перерисовать.
  active() {
    return this.flashAge < 3 || this.smoke.list.length > 0 || this.fire.list.length > 0 || this.heat > 0.3 || this.tracers.n > 0 || this.traces.n > 0 || this.shells.some((s) => s.alive && !s.rest);
  }
  smokePuff(pos, vel, o = {}) {
    const g = o.grey ?? 0.7 + R2() * 0.08;
    this.smoke.add({
      pos,
      vel,
      life: o.life ?? 1.6 + R2(),
      size: o.size ?? 0.03,
      grow: o.grow ?? 0.3,
      growPow: o.growPow ?? 0.5,
      alpha: o.alpha ?? 0.35,
      color: o.color || [g * 0.98, g, g * 1.03],
      drag: o.drag ?? 3.5,
      buoy: o.buoy ?? 0.12,
      turb: o.turb ?? 0.25,
      fadeIn: o.fadeIn ?? 0.03,
      gravity: o.gravity ?? 0
    });
  }
  // Дульная вспышка и газы. Физика: из дульного среза выходит недорасширенная струя — светящаяся
  // «бочка» с диском Маха в нескольких калибрах от среза (промежуточная вспышка); дальше горючие
  // газы (CO, H₂) смешиваются с воздухом и догорают — вторичная вспышка, крупный оранжевый факел.
  // Пламегаситель срывает вторичную вспышку, ДТК отводит газы вбок, глушитель гасит почти всё.
  // Длительность — миллисекунды: на экране это 1 полный кадр и 1 кадр догорания.
  muzzleFlash(pos, dir, kind, size = 1, o = {}) {
    const P = MUZZLE_FX[kind] || MUZZLE_FX.bare;
    const supp = kind === "supp";
    const vis = FLASH_VIS[this.timeOfDay] ?? 1;
    const now = this.clock;
    const cold = now - this.lastShotT > 4;
    this.lastShotT = now;
    const k = size * (o.barrel ?? 1);
    const up = this._v2.set(0, 1, 0);
    const side = new THREE6.Vector3().crossVectors(dir, up).normalize();
    const vup = new THREE6.Vector3().crossVectors(side, dir).normalize();
    const cam = o.cam;
    // насколько камера смотрит вдоль ствола: в прицел вспышка видна «с торца»
    const endOn = cam ? Math.abs(this._v.copy(cam.position).sub(pos).normalize().dot(dir)) : 0;
    const axK = Math.sqrt(Math.max(0, 1 - endOn * endOn)) * 0.85 + 0.15;
    const rnd = (a) => 1 - a + R2() * 2 * a;
    for (const a of this.axial) a.hide();
    let ai = 0;
    const ax = (map, center, axis, len, w, col, op) => {
      if (op > 1e-3 && ai < this.axial.length) this.axial[ai++].set(map, center, axis, len, w, col, op);
    };
    this.flash.position.copy(pos);
    this.flash.visible = true;
    this.flashAge = 0;
    let lightI;
    if (supp) {
      // глушитель: вспышки нет; холодный глушитель даёт «первый хлопок» — кислород в камерах догорает
      const frp = cold ? 1 : 0;
      this.flashCore.visible = frp > 0;
      this.flashCore.position.copy(dir).multiplyScalar(0.01);
      this.flashCore.scale.setScalar(0.05 * k);
      this.flashCore.material.color.setRGB(1, 0.55, 0.22);
      this.flashCore.material.opacity = 0.55 * vis * frp;
      this.flashStar.visible = false;
      if (frp) ax(this.T.fire[0], pos.clone().addScaledVector(dir, 0.05 * k), dir, 0.1 * k, 0.05 * k, [1, 0.45, 0.16], 0.5 * vis * axK);
      lightI = frp ? 1.2 * k : 0.05;
    } else {
      this.flashCore.visible = true;
      this.flashCore.position.copy(dir).multiplyScalar(0.012 * k);
      this.flashCore.scale.setScalar(0.045 * k * rnd(0.2));
      this.flashCore.material.color.setRGB(1, 0.93, 0.78);
      this.flashCore.material.opacity = Math.min(1, 0.9 * vis + 0.1);
      this.flashStar.visible = P.star > 0;
      this.flashStar.material.map = this.T.flash[R2() * 3 | 0];
      this.flashStar.material.rotation = R2() * 6.28;
      this.flashStar.position.copy(dir).multiplyScalar(0.03 * k);
      this.flashStar.scale.setScalar((P.prongs ? 0.07 : 0.11) * k * rnd(0.25));
      this.flashStar.material.opacity = P.star * vis * (0.06 + 0.94 * endOn * endOn);
      const dl = 0.1 * k * rnd(0.2);
      ax(this.T.disk, pos.clone().addScaledVector(dir, dl * 0.5), dir, dl, 0.034 * k, [1, 0.96, 0.86], P.disk * Math.min(1, vis * 1.3) * axK);
      // вторичная вспышка начинается у диска Маха; днём глаз её почти не различает
      const fl = 0.3 * k * rnd(0.3) * (0.5 + 0.5 * P.fire);
      ax(this.T.fire[R2() * 2 | 0], pos.clone().addScaledVector(dir, 0.06 * k + fl * 0.45), dir, fl, 0.13 * k * rnd(0.25) * (0.6 + 0.4 * P.fire), vis < 0.5 ? [1, 0.45, 0.18] : [1, 0.56, 0.26], P.fire * Math.pow(vis, 1.6) * axK * 0.85);
      if (P.prongs) {
        // пламегаситель щелевой: короткие язычки из прорезей, ядро струи уже
        for (let i = 0; i < 3; i++) {
          const a = R2() * 6.28, rd = side.clone().multiplyScalar(Math.cos(a)).addScaledVector(vup, Math.sin(a)).multiplyScalar(0.35).add(dir).normalize();
          ax(this.T.fire[1], pos.clone().addScaledVector(rd, 0.035 * k), rd, 0.06 * k, 0.018 * k, [1, 0.62, 0.3], 0.55 * vis);
        }
      }
      if (P.jets) {
        // ДТК: две мощные боковые струи; компенсатор — вверх
        const dirs = P.up ? [vup.clone().multiplyScalar(0.9).addScaledVector(dir, 0.35).normalize()] : [side.clone().addScaledVector(dir, -0.15).normalize(), side.clone().negate().addScaledVector(dir, -0.15).normalize()];
        for (const jd of dirs) {
          const jl = 0.1 * k * rnd(0.25);
          ax(this.T.disk, pos.clone().addScaledVector(dir, -0.012 * k).addScaledVector(jd, jl * 0.5), jd, jl, 0.03 * k, [1, 0.9, 0.7], 0.9 * P.jets * vis);
          ax(this.T.fire[0], pos.clone().addScaledVector(jd, jl * 0.9), jd, jl * 1.3, 0.08 * k, [1, 0.5, 0.22], 0.5 * P.jets * Math.pow(vis, 1.6));
        }
      }
      lightI = (4 + 6 * P.fire) * k;
    }
    this.flashLight.position.copy(pos).addScaledVector(dir, 0.12 * k);
    this.flashLight.intensity = lightI;
    this.light.uFlash.value.set(pos.x + dir.x * 0.1, pos.y + dir.y * 0.1, pos.z + dir.z * 0.1, supp ? 0.2 * (cold ? 3 : 0.2) : 6 * k * (0.4 + P.fire));
    this.heat = Math.min(3, this.heat + 0.22 * size);
    // несгоревшие крупинки пороха: раскалённые, летят вперёд, вытягиваются по скорости
    const nSp = Math.round((kind === "bare" ? 6 : 3) * P.sparks * size * (o.barrel ?? 1) * (0.6 + R2() * 0.8));
    for (let i = 0; i < nSp; i++) {
      const v = dir.clone().multiplyScalar(18 + R2() * 30).add(new THREE6.Vector3((R2() - 0.5) * 5, (R2() - 0.5) * 5, (R2() - 0.5) * 5));
      this.fire.add({ pos: pos.clone().addScaledVector(dir, 0.02), vel: v, life: 0.03 + R2() * 0.07, size: 2.2e-3 + R2() * 2e-3, alpha: vis, color: [1, 0.66, 0.3], drag: 9, gravity: 3, stretch: 6, align: true, fadeIn: 0, spin: 0 });
    }
    this.blastSmoke(pos, dir, side, vup, kind, size, o);
  }
  // Газы выстрела. Основная масса вылетает со скоростью в сотни м/с, но сразу тормозится воздухом:
  // облако встаёт в 0,3…1,5 м перед стволом, быстро расширяется, светлеет и расползается ветром.
  // Бездымный порох даёт немного дыма: полупрозрачный, серо-голубой, через 1…2 с его почти нет.
  blastSmoke(pos, dir, side, vup, kind, size, o) {
    const P = MUZZLE_FX[kind] || MUZZLE_FX.bare;
    const dense = (o.smoke ?? 1) * P.smoke;
    const supp = kind === "supp";
    if (supp) {
      // из глушителя газ выходит медленно — вялый клуб у торца, поднимается и тает
      for (let i = 0; i < 3; i++) {
        const v = dir.clone().multiplyScalar(0.8 + R2() * 1.6).add(new THREE6.Vector3((R2() - 0.5) * 0.15, 0.08 + R2() * 0.1, (R2() - 0.5) * 0.15));
        this.smokePuff(pos.clone().addScaledVector(dir, 0.01), v, { size: 0.02, grow: 0.12 + R2() * 0.08, alpha: 0.2 * dense, life: 1.4 + R2(), drag: 2.4, buoy: 0.1, turb: 0.2, fadeIn: 0.05, grey: 0.74 });
      }
      return;
    }
    const n = Math.round(9 * Math.min(1.6, size) * (0.8 + 0.2 * dense));
    for (let i = 0; i < n; i++) {
      // путь до остановки ≈ v/drag: 0,2…1,2 м перед срезом
      const sp = 3 + R2() * 10;
      const v = dir.clone().multiplyScalar(sp).addScaledVector(side, (R2() - 0.5) * 1.6).addScaledVector(vup, (R2() - 0.4) * 1.2);
      this.smokePuff(pos.clone().addScaledVector(dir, 0.02 + R2() * 0.04), v, { size: 0.025 + R2() * 0.02, grow: (0.22 + R2() * 0.26) * Math.min(1.5, size), growPow: 0.3, alpha: (0.22 + R2() * 0.14) * dense, life: 1.5 + R2() * 1.4, drag: 10 + R2() * 6, buoy: 0.07, turb: 0.3, fadeIn: 0.012, grey: 0.7 + R2() * 0.08 });
    }
    // тороидальный вихрь у самого среза — маленький плотный клубок, крутится и медленно уходит вперёд
    for (let i = 0; i < 2; i++) {
      const v = dir.clone().multiplyScalar(1.2 + R2() * 1.4).addScaledVector(vup, 0.1);
      this.smokePuff(pos.clone().addScaledVector(dir, 0.03), v, { size: 0.015, grow: 0.1 * Math.min(1.5, size), alpha: 0.16 * dense, life: 0.7 + R2() * 0.5, drag: 3, buoy: 0.08, turb: 0.2, fadeIn: 0.01, grey: 0.7 });
    }
    if (P.jets) {
      const dirs = P.up ? [vup] : [side, side.clone().negate()];
      for (const jd of dirs) for (let i = 0; i < 4; i++) {
        const v = jd.clone().multiplyScalar(5 + R2() * 7).addScaledVector(dir, -0.5 + R2() * 1.5).addScaledVector(vup, (R2() - 0.3) * 1.2);
        this.smokePuff(pos.clone(), v, { size: 0.02, grow: 0.22 + R2() * 0.18, growPow: 0.35, alpha: 0.16 * dense, life: 1 + R2() * 0.8, drag: 8, buoy: 0.05, turb: 0.3, fadeIn: 0.015 });
      }
    }
  }
  // пороховые газы из окна выброса (у глушителя их заметно больше — газ идёт назад)
  portSmoke(pos, dir, k = 1) {
    for (let i = 0; i < 2; i++) {
      const v = dir.clone().multiplyScalar(0.35 + R2() * 0.3).add(new THREE6.Vector3((R2() - 0.5) * 0.1, 0.12 + R2() * 0.08, 0));
      this.smokePuff(pos.clone(), v, { size: 0.01, grow: 0.08 + R2() * 0.06, alpha: 0.1 * k, life: 0.7 + R2() * 0.5, drag: 3, grey: 0.72 });
    }
  }
  shellMesh(key, cal, live) {
    let m = this.inst.get(key);
    if (m) return m;
    const c = CAL[cal] || CAL["556"];
    const brass = c.steel ? this.mats.get("steelCase") : this.mats.get("brass");
    let g = caseGeo(cal), mat = brass;
    if (c.shot || live) {
      // гильза дроби — два материала (латунь + пластик); живой патрон — гильза + пуля
      const parts = (c.shot ? [shotHead(c), shotHull(c, !live)] : [g, bulletGeo(cal)]).map((x) => x.index ? x.toNonIndexed() : x);
      g = new THREE6.BufferGeometry();
      for (const a of ["position", "normal"]) {
        const arr = new Float32Array(parts[0].getAttribute(a).array.length + parts[1].getAttribute(a).array.length);
        arr.set(parts[0].getAttribute(a).array, 0);
        arr.set(parts[1].getAttribute(a).array, parts[0].getAttribute(a).array.length);
        g.setAttribute(a, new THREE6.BufferAttribute(arr, 3));
      }
      const n0 = parts[0].getAttribute("position").count;
      g.addGroup(0, n0, 0);
      g.addGroup(n0, parts[1].getAttribute("position").count, 1);
      mat = c.shot ? [this.mats.get("brass"), this.mats.get("hullRed")] : [brass, this.mats.get("copper")];
    }
    g.scale(1e-3, 1e-3, 1e-3);
    g.translate(-c.L * 5e-4, 0, 0);
    m = new THREE6.InstancedMesh(g, mat, live ? 8 : MAX_SHELLS);
    m.castShadow = true;
    m.count = 0;
    m.frustumCulled = false;
    m.instanceMatrix.setUsage(THREE6.DynamicDrawUsage);
    this.scene.add(m);
    this.inst.set(key, m);
    return m;
  }
  // Гильза: вылет из окна с кувырком, дымок из дульца, отскоки от бетона.
  shell(pos, vel, cal, quat, live = false) {
    const c = CAL[cal] || CAL["556"];
    const key = cal + (live ? ":live" : "");
    this.shellMesh(key, cal, live);
    const cap = live ? 8 : MAX_SHELLS;
    const same = this.shells.filter((x) => x.key === key);
    let s = same.find((x) => !x.alive);
    if (!s) {
      if (same.length >= cap) s = same.reduce((a, b) => a.t > b.t ? a : b);
      else {
        s = { key, pos: new THREE6.Vector3(), quat: new THREE6.Quaternion(), vel: new THREE6.Vector3(), w: new THREE6.Vector3() };
        this.shells.push(s);
      }
    }
    s.pos.copy(pos);
    s.quat.copy(quat);
    s.vel.copy(vel);
    const axis = X_AXIS.clone().applyQuaternion(quat);
    const tumble = new THREE6.Vector3().crossVectors(axis, vel).normalize();
    s.w.copy(tumble).multiplyScalar((live ? 12 : 24) + R2() * 22).addScaledVector(axis, (R2() - 0.5) * 12);
    s.alive = true;
    s.rest = false;
    s.t = 0;
    s.bounced = 0;
    s.steel = c.steel;
    s.kind = c.shot ? "hull" : c.steel ? "steel" : "brass";
    s.live = live;
    s.r = c.rim * 5e-4;
    s.trail = live ? 0 : c.shot ? 0.5 : 0.28;
    return s;
  }
  // Попадание: пыль и комья по земле/валу, искры и отметина на стали.
  impact(hit, surface) {
    const p = hit.point, n = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : new THREE6.Vector3(0, 1, 0);
    if (surface === "steel") {
      for (let i = 0; i < 3; i++) this.smokePuff(p.clone().addScaledVector(n, 0.02), n.clone().multiplyScalar(0.4).add(new THREE6.Vector3((R2() - 0.5) * 0.6, R2() * 0.5, (R2() - 0.5) * 0.6)), { life: 0.7, size: 0.06, grow: 0.25, alpha: 0.4, drag: 3 });
      for (let i = 0; i < 10; i++) {
        const v = n.clone().multiplyScalar(1 + R2() * 2).add(new THREE6.Vector3((R2() - 0.5) * 4, R2() * 3, (R2() - 0.5) * 4));
        this.fire.add({ pos: p.clone().addScaledVector(n, 0.01), vel: v, life: 0.15 + R2() * 0.25, size: 0.012 + R2() * 0.01, alpha: 1, color: [1, 0.75, 0.4], drag: 1.5, gravity: 9.8, stretch: 2, fadeIn: 0, spin: 0 });
      }
      const hole = new THREE6.Mesh(this.holeGeo, this.holeMat);
      hit.object.worldToLocal(hole.position.copy(p).addScaledVector(n, 15e-4));
      const ln = n.clone().transformDirection(new THREE6.Matrix4().copy(hit.object.matrixWorld).invert());
      hole.lookAt(hole.position.clone().add(ln));
      hit.object.add(hole);
      this.holes.push(hole);
      if (this.holes.length > 80) {
        const h = this.holes.shift();
        h.parent?.remove(h);
      }
    } else {
      for (let i = 0; i < 6; i++) {
        this.smoke.add({ pos: p.clone(), vel: n.clone().multiplyScalar(0.8 + R2() * 1.4).add(new THREE6.Vector3((R2() - 0.5) * 0.9, R2() * 1.2, (R2() - 0.5) * 0.9)), life: 1 + R2() * 0.8, size: 0.08, grow: 0.55, alpha: 0.55, color: [0.58, 0.5, 0.39], drag: 2.5, gravity: 0.4, turb: 0.3 });
      }
      for (let i = 0; i < 5; i++) {
        this.smoke.add({ pos: p.clone(), vel: n.clone().multiplyScalar(2 + R2() * 2).add(new THREE6.Vector3((R2() - 0.5) * 2, R2() * 2, (R2() - 0.5) * 2)), life: 0.5 + R2() * 0.3, size: 0.025, alpha: 0.9, color: [0.3, 0.26, 0.2], drag: 0.8, gravity: 9.8, fadeIn: 0 });
      }
    }
  }
  // i — номер излучателя (0/1): два ЛЦУ на одном оружии светят независимо
  setLaser(on, pos, dir, hitables, color = 16722458, i = 0) {
    const L = this.lasers[i];
    if (!L) return;
    L.beam.visible = L.dot.visible = !!on;
    if (!on) return;
    if (L.color !== color) {
      L.color = color;
      L.beam.material.color.setHex(color);
      L.dot.material.color.setHex(color);
    }
    this.ray.set(pos, dir);
    this.ray.far = 250;
    const h = this.ray.intersectObjects(hitables, false)[0];
    const d = h ? h.distance : 250;
    L.beam.position.copy(pos);
    L.beam.scale.set(d, 1, 1);
    L.beam.quaternion.setFromUnitVectors(X_AXIS, dir);
    L.dot.position.copy(pos).addScaledVector(dir, d - 0.01);
    L.dot.scale.setScalar((0.015 + d * 22e-4) * L.k);
  }
  // spec: {cd, spill, hot, kelvin, lens}; level — отдача с учётом батареи (0…1); haze — видимость луча
  setLight(on, pos, dir, spec, level = 1, haze = 1, cam, i = 0) {
    const T2 = this.torches[i];
    if (!T2) return;
    const lit = !!on && level > 0;
    T2.set(lit, pos, dir, spec, level, haze, cam);
    // луч фонаря подсвечивает дым: частицы в конусе рассеивают свет
    const P = this.light.uTorchP.value[i], D = this.light.uTorchD.value[i];
    if (lit) {
      P.set(pos.x, pos.y, pos.z, spec.cd * 22e-4 * 0.0016 * level);
      D.set(dir.x, dir.y, dir.z, Math.cos(spec.angle ?? 0.62));
      this.light.uTorchC.value[i].copy(T2.spot.color);
    } else P.w = 0;
  }
  setLaserLevel(level, haze, i = 0) {
    const L = this.lasers[i];
    if (!L) return;
    const k = Math.max(0, level);
    L.beam.material.opacity = (0.05 + 0.3 * haze) * k;
    L.dot.material.opacity = Math.min(1, 0.25 + k);
    L.k = 0.6 + 0.8 * haze;
  }
  // Трассы пуль в полёте: трассер — яркая полоса с горячей головой (зажигается метрах в 10 от среза),
  // обычная пуля — едва заметный «след» (возмущение воздуха ударной волной), виден в основном сзади.
  bullets(list, mode, cam) {
    this.tracers.begin(cam);
    this.traces.begin(cam);
    if (mode !== "off") {
      const vis = FLASH_VIS[this.timeOfDay] ?? 1;
      const amb = SMOKE_AMB[this.timeOfDay] || SMOKE_AMB.day;
      const A = this._v, dirV = this._v2;
      for (const b of list) {
        const head = b.p, fade = b.alive ? 1 : Math.max(0, (b.fade ?? 0) / 0.12);
        if (fade <= 0) continue;
        const v = b.v.length();
        dirV.copy(b.v).divideScalar(Math.max(v, 1));
        const flown = b.origin.distanceTo(head);
        if (b.tracer || mode === "tracer") {
          const burn = flown - 10;
          if (burn <= 0) continue;
          const len = Math.min(burn, v * 0.022, 25);
          A.copy(head).addScaledVector(dirV, -len);
          this._c.setHex(b.spec.tracer ?? 16725558);
          this.tracers.push(A, head, 0.012, (0.55 + 0.45 * vis) * fade, 0.8, this._c);
        } else {
          if (flown < 2.5) continue;
          const len = Math.min(flown - 2, 3.5);
          A.copy(head).addScaledVector(dirV, -len);
          this._c.setRGB(amb[0], amb[1], amb[2]);
          const sup = v > 360 ? 1 : 0.55;
          this.traces.push(A, head, 0.006, 0.16 * sup * fade, 0, this._c);
        }
      }
    }
    this.tracers.end();
    this.traces.end();
  }
  // muzzle — текущий дульный срез: от нагретого ствола после очереди идёт струйка дыма
  update(dt, onShellBounce, cam, muzzle) {
    this.clock += dt;
    if (this.flashAge < 3) {
      this.flashAge++;
      if (this.flashAge === 2) {
        // второй кадр: ядро погасло, догорает только факел
        this.flashCore.visible = this.flashStar.visible = false;
        for (const a of this.axial) a.u.opacity.value = a.base * 0.3;
        this.flashLight.intensity *= 0.25;
        this.light.uFlash.value.w *= 0.3;
      } else if (this.flashAge >= 3) {
        this.flash.visible = false;
        for (const a of this.axial) a.hide();
        this.flashLight.intensity = 0;
        this.light.uFlash.value.w = 0;
      }
    }
    // освещённость дыма по времени суток; ночью — плюс дежурный натриевый фонарь у рубежа
    const amb = SMOKE_AMB[this.timeOfDay] || SMOKE_AMB.day;
    this.light.uAmb.value.setRGB(amb[0], amb[1], amb[2]);
    if (this.lamp) {
      const lp = this.lamp.position;
      this.light.uLamp.value.set(lp.x, lp.y, lp.z, this.lamp.intensity * 0.012);
    }
    if (this.heat > 0) {
      this.heat = Math.max(0, this.heat - dt * 0.35);
      this.wispT -= dt;
      if (this.wispT <= 0 && this.heat > 0.3 && muzzle) {
        this.wispT = 0.07 + R2() * 0.06;
        this.smokePuff(muzzle.clone(), new THREE6.Vector3((R2() - 0.5) * 0.02, 0.1 + R2() * 0.06, (R2() - 0.5) * 0.02), { size: 0.008, grow: 0.07, alpha: Math.min(0.1, this.heat * 0.04), life: 1.6 + R2(), drag: 1.2, buoy: 0.08, turb: 0.1, grey: 0.74, fadeIn: 0.3 });
      }
    }
    for (const s of this.shells) {
      if (!s.alive) continue;
      s.t += dt;
      if (s.t > 10) {
        s.alive = false;
        continue;
      }
      if (s.rest) continue;
      s.vel.y -= 9.81 * dt;
      s.vel.multiplyScalar(Math.exp(-0.25 * dt));
      s.pos.addScaledVector(s.vel, dt);
      const wl = s.w.length();
      if (wl > 1e-3) {
        this._q.setFromAxisAngle(this._v.copy(s.w).divideScalar(wl), wl * dt);
        s.quat.premultiply(this._q);
      }
      if (s.trail > 0) {
        s.trail -= dt;
        if (R2() < 0.45) this.smokePuff(s.pos.clone(), s.vel.clone().multiplyScalar(0.1), { size: 6e-3, grow: 0.05, alpha: 0.14, life: 0.5 + R2() * 0.4, drag: 4, grey: 0.74, fadeIn: 0.02 });
      }
      const floor = (Math.abs(s.pos.x + 0.8) < 3 && Math.abs(s.pos.z) < 2.5 ? 0.12 : 0) + s.r;
      if (s.pos.y < floor) {
        s.pos.y = floor;
        if (s.vel.y < -0.35) {
          s.vel.y *= -(0.28 + R2() * 0.12);
          s.vel.x *= 0.55;
          s.vel.z *= 0.55;
          s.w.multiplyScalar(0.5).add(this._v.set((R2() - 0.5) * 20, (R2() - 0.5) * 30, (R2() - 0.5) * 20));
          if (s.bounced++ < 2 && onShellBounce) onShellBounce(s, s.bounced);
        } else {
          s.rest = true;
          const ax = X_AXIS.clone().applyQuaternion(s.quat);
          ax.y = 0;
          if (ax.lengthSq() < 1e-6) ax.set(1, 0, 0);
          s.quat.setFromUnitVectors(X_AXIS, ax.normalize()).multiply(this._q.setFromAxisAngle(X_AXIS, R2() * 6.28));
        }
      }
    }
    const counts = /* @__PURE__ */ new Map();
    for (const s of this.shells) {
      if (!s.alive) continue;
      const m = this.inst.get(s.key), i = counts.get(s.key) || 0;
      m.setMatrixAt(i, this._m.compose(s.pos, s.quat, this._s));
      counts.set(s.key, i + 1);
    }
    for (const [k, m] of this.inst) {
      const n = counts.get(k) || 0;
      if (n || m.count) m.instanceMatrix.needsUpdate = true;
      m.count = n;
    }
    this.smoke.update(dt, cam, this.smokeWind);
    this.fire.update(dt, cam, this.noWind);
  }
};


