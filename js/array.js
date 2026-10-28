// Generic CTAO array scene: terrain, telescopes, roads, pointing, air showers, event display.
// Needs three.js r128, OrbitControls, common.js and the telescope builders loaded first.
// initArray(SITE) reads its controls from fixed element ids (see ctao-north.html).
//
// SITE = {
//   refAlt,                         // reference altitude of the layout (m a.s.l.)
//   layout: [{ name, kind, id, E, N, z?, context? }],  // z = elevation-axis height above refAlt
//                                   // (null: sit on the terrain); context = shown, but not in the array
//   terrainSamples: [[E, N, ground]],  // extra ground heights (optional)
//   center: [E, N], residualFade: [r0, r1], innerSize, innerSeg,
//   regional(E, N, r) -> dh,        // large-scale shape outside the measured area
//   noise: [amp, scale, ampMid, scaleMid, ampFar, scaleFar],
//   palette: { rock, scrub, dark }, groundTint,
//   vegetation: { count, colors } | null, clouds: { y } | null,
//   accessRoad: [E, N] | null, landmarks: [{ name, E, N, build(world, M) -> Object3D }],
//   overview: { pos: [x, y, z], target: [x, y, z] }, maxDistance, fog: [near, far], shadowExtent,
//   impactRadius (m), energy: [Emin, Emax] (TeV), startPointing: [az, el], terrainText,
// }

const AXIS_H = { LST: 14.5, MST: 10.4, SST: 3.6, MAGIC: 9.5 };
const world = (E, N, y = 0) => new THREE.Vector3(E, y, -N); // x = East, z = South

const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const hash = (i, j) => { const h = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return h - Math.floor(h); };
function vnoise(x, y) {
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
  const u = fx * fx * (3 - 2 * fx), w = fy * fy * (3 - 2 * fy);
  const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
  return (a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w) * 2 - 1;
}
const fbm = (x, y, oct = 4) => { let s = 0, a = 0.5, f = 1; for (let o = 0; o < oct; o++) { s += a * vnoise(x * f, y * f); a *= 0.5; f *= 2.03; } return s; };

function initArray(SITE) {
  const $ = (id) => document.getElementById(id);

  // ---- Renderer, scene ----
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  $('view').appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xa6b9dc, SITE.fog[0], SITE.fog[1]);
  const cam = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.3, 80000);
  const controls = new THREE.OrbitControls(cam, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.maxDistance = SITE.maxDistance;
  const M = makeMaterials();
  const [cE, cN] = SITE.center;
  const key = addTwilightSky(scene, renderer, { domeRadius: 60000, shadowExtent: SITE.shadowExtent });
  key.target.position.copy(world(cE, cN));
  key.position.add(key.target.position);

  // ---- Terrain function: plane + smooth residual through the measured ground heights ----
  const sites = SITE.layout.map(s => Object.assign({}, s));
  const samples = [];
  for (const s of sites) if (s.z != null) samples.push([s.E, s.N, s.z - AXIS_H[s.kind]]);
  for (const p of SITE.terrainSamples || []) samples.push(p);
  const plane = (() => {
    const S = [0, 0, 0, 0, 0, 0, 0, 0, 0], r = [0, 0, 0];
    for (const [E, N, g] of samples) {
      const a = [E, N, 1];
      for (let i = 0; i < 3; i++) { r[i] += a[i] * g; for (let j = 0; j < 3; j++) S[3 * i + j] += a[i] * a[j]; }
    }
    const det = (m) => m[0] * (m[4] * m[8] - m[5] * m[7]) - m[1] * (m[3] * m[8] - m[5] * m[6]) + m[2] * (m[3] * m[7] - m[4] * m[6]);
    const D = det(S), out = [];
    for (let c = 0; c < 3; c++) { const m = S.slice(); for (let i = 0; i < 3; i++) m[3 * i + c] = r[i]; out.push(det(m) / D); }
    return out;
  })();
  const planeH = (E, N) => plane[0] * E + plane[1] * N + plane[2];
  const res = samples.map(([E, N, g]) => [E, N, g - planeH(E, N)]);
  const [na, ns, nma, nms, nfa, nfs] = SITE.noise;
  const [f0, f1] = SITE.residualFade;
  const flats = []; // [E, N, radius, height]
  function terrainH(E, N, flatten = true) {
    const r = Math.hypot(E - cE, N - cN);
    let h = planeH(E, N);
    if (r < f1) {
      let ws = 0, acc = 0;
      for (const [sE, sN, sr] of res) { const w = 1 / ((E - sE) ** 2 + (N - sN) ** 2 + 1600); ws += w; acc += w * sr; }
      h += (acc / ws) * (1 - smoothstep(f0, f1, r));
    }
    h += SITE.regional(E, N, r);
    h += fbm(E / ns, N / ns) * na + fbm(E / nms, N / nms) * nma * smoothstep(f0 * 0.5, f1, r) + fbm(E / nfs, N / nfs, 5) * nfa * smoothstep(f1, f1 * 3, r);
    if (flatten) for (const [fe, fn, fr, fh] of flats) {
      const t = smoothstep(fr, fr + 16, Math.hypot(E - fe, N - fn));
      if (t < 1) h = fh + (h - fh) * t;
    }
    return h;
  }

  // ---- Telescopes ----
  const builders = { LST: buildLST, MST: buildMST, SST: buildSST, MAGIC: buildMAGIC };
  const telescopes = [];
  for (const s of sites) {
    const ground = s.z != null ? s.z - AXIS_H[s.kind] : terrainH(s.E, s.N, false);
    const t = Object.assign(builders[s.kind](M), s, { ground });
    t.root.position.copy(world(s.E, s.N, ground));
    t.root.userData.tel = t;
    for (const [x, z, r] of t.pads) flats.push([s.E + x, s.N - z, r, ground]);
    scene.add(t.root);
    telescopes.push(t);
  }
  const array = telescopes.filter(t => !t.context);

  // ---- Terrain meshes: detailed inner square, coarse outer skirt ----
  const P = SITE.palette;
  const ROCK = new THREE.Color(P.rock), SCRUB = new THREE.Color(P.scrub), DARK = new THREE.Color(P.dark), tmpC = new THREE.Color();
  function groundTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = SITE.groundTint || '#d8d2c8'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 12000; i++) {
      const s = 150 + Math.random() * 105 | 0;
      g.fillStyle = `rgba(${s},${s - 8},${s - 20},${0.25 + Math.random() * 0.5})`;
      g.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 1 + Math.random() * 3);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.encoding = THREE.sRGBEncoding;
    return tex;
  }
  const half = SITE.innerSize / 2;
  function terrainMesh(size, seg, repeat, sink) {
    const geo = new THREE.PlaneGeometry(size, size, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const E = pos.getX(i) + cE, N = -pos.getZ(i) + cN;
      let h = terrainH(E, N);
      if (sink && Math.abs(E - cE) < half - 10 && Math.abs(N - cN) < half - 10) h -= 3; // hidden under the inner mesh
      pos.setXYZ(i, E, h, -N);
      const n1 = fbm(E / 90, N / 90), n2 = fbm(E / 17, N / 17, 2);
      tmpC.copy(ROCK).lerp(SCRUB, smoothstep(-0.25, 0.35, n1)).lerp(DARK, Math.max(0, n2) * 0.5);
      col.set([tmpC.r, tmpC.g, tmpC.b], i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    const map = groundTexture(); map.repeat.set(repeat, repeat);
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, map, roughness: 1 }));
    mesh.receiveShadow = true;
    return mesh;
  }
  const inner = terrainMesh(SITE.innerSize, SITE.innerSeg, SITE.innerSize / 5.8, false);
  const outer = terrainMesh(40000, 260, 2600, true);
  scene.add(inner, outer);

  if (SITE.clouds) {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d'), img = g.createImageData(512, 512);
    for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
      const n = (fbm(x / 64, y / 64, 5) + 1) / 2, s = 200 + 55 * n;
      img.data.set([s, s, s + 6, 255], (y * 512 + x) * 4);
    }
    g.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(30, 30); tex.encoding = THREE.sRGBEncoding;
    const clouds = new THREE.Mesh(new THREE.PlaneGeometry(90000, 90000), new THREE.MeshStandardMaterial({ map: tex, roughness: 1, color: 0xe6ecf5 }));
    clouds.rotation.x = -Math.PI / 2; clouds.position.y = SITE.clouds.y;
    scene.add(clouds);
  }

  // ---- Roads: minimum spanning tree between telescopes, plus an access road ----
  const roadEdges = [];
  {
    const pts = sites.map(s => [s.E, s.N]);
    const inTree = [0], rest = pts.map((_, i) => i).slice(1);
    const dist = pts.map(a => pts.map(b => Math.hypot(a[0] - b[0], a[1] - b[1])));
    const best = pts.map((_, i) => [dist[0][i], 0]);
    while (rest.length) {
      let bi = rest[0];
      for (const i of rest) if (best[i][0] < best[bi][0]) bi = i;
      roadEdges.push([pts[best[bi][1]], pts[bi]]);
      inTree.push(bi); rest.splice(rest.indexOf(bi), 1);
      for (const i of rest) if (dist[bi][i] < best[i][0]) best[i] = [dist[bi][i], bi];
    }
    if (SITE.accessRoad) {
      const [aE, aN] = SITE.accessRoad;
      const near = pts.reduce((a, b) => Math.hypot(b[0] - aE, b[1] - aN) < Math.hypot(a[0] - aE, a[1] - aN) ? b : a);
      roadEdges.push([near, [aE, aN]]);
    }
    const verts = [], idx = [], W = 2.6;
    for (const [[e0, n0], [e1, n1]] of roadEdges) {
      const len = Math.hypot(e1 - e0, n1 - n0), ux = (e1 - e0) / len, un = (n1 - n0) / len, steps = Math.ceil(len / 3);
      for (let k = 0; k <= steps; k++) {
        const E = e0 + ux * len * k / steps, N = n0 + un * len * k / steps;
        for (const s of [-1, 1]) {
          const e = E - un * W * s, n = N + ux * W * s;
          verts.push(e, terrainH(e, n) + 0.25, -n);
        }
        if (k) { const b = verts.length / 3 - 4; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(idx); geo.computeVertexNormals();
    const road = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: SITE.roadColor || 0xa69a86, roughness: 1, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 }));
    road.receiveShadow = true;
    scene.add(road);
  }
  const distToRoad = (E, N) => {
    let best = Infinity;
    for (const [[e0, n0], [e1, n1]] of roadEdges) {
      const dx = e1 - e0, dn = n1 - n0, t = Math.max(0, Math.min(1, ((E - e0) * dx + (N - n0) * dn) / (dx * dx + dn * dn)));
      best = Math.min(best, Math.hypot(E - e0 - t * dx, N - n0 - t * dn));
    }
    return best;
  };

  // ---- Vegetation / rocks ----
  const vegetation = new THREE.Group();
  if (SITE.vegetation) {
    const V = SITE.vegetation, shrubs = [], rocks = [];
    let tries = 0;
    while (shrubs.length + rocks.length < V.count && tries++ < V.count * 6) {
      const E = cE + (Math.random() * 2 - 1) * (half - 10), N = cN + (Math.random() * 2 - 1) * (half - 10);
      if (flats.some(([fe, fn, fr]) => Math.hypot(E - fe, N - fn) < fr + 4) || distToRoad(E, N) < 5) continue;
      if (fbm(E / 90, N / 90) < -0.15 && Math.random() < 0.7) continue;
      (Math.random() < V.shrubFraction ? shrubs : rocks).push([E, N]);
    }
    const mk = (list, geo, colors, sx, sy) => {
      const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }), Math.max(1, list.length));
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
      list.forEach(([E, N], i) => {
        const k = 0.6 + Math.random() * 1.0;
        q.setFromAxisAngle(UP, Math.random() * 6.28);
        m.compose(world(E, N, terrainH(E, N) + sy * k * 0.35), q, v(sx * k * (0.8 + Math.random() * 0.4), sy * k, sx * k * (0.8 + Math.random() * 0.4)));
        mesh.setMatrixAt(i, m);
        mesh.setColorAt(i, c.set(colors[Math.random() * colors.length | 0]));
      });
      mesh.count = list.length;
      mesh.castShadow = mesh.receiveShadow = true;
      return mesh;
    };
    vegetation.add(mk(shrubs, new THREE.IcosahedronGeometry(1, 0), V.shrubColors, 1.3, 0.9));
    vegetation.add(mk(rocks, new THREE.DodecahedronGeometry(1, 0), V.rockColors, 0.9, 0.6));
    scene.add(vegetation);
  }

  // ---- Landmarks ----
  const landmarks = [];
  for (const L of SITE.landmarks || []) {
    const obj = L.build(M);
    obj.userData.landmark = true;
    obj.position.copy(world(L.E, L.N, terrainH(L.E, L.N)));
    scene.add(obj);
    landmarks.push({ name: L.name, root: obj, labelHeight: L.labelHeight || 60, kind: 'context' });
  }

  // ---- Labels ----
  const labelLayer = $('labels');
  for (const t of [...telescopes, ...landmarks]) {
    const d = document.createElement('div');
    d.className = 'label ' + (t.context || t.kind === 'context' ? 'context' : t.kind.toLowerCase());
    d.textContent = t.name;
    labelLayer.appendChild(d);
    t.label = d;
  }

  // ---- Pointing ----
  const azIn = $('az'), elIn = $('el');
  let [tgtAz, tgtEl] = SITE.startPointing, parked = false;
  function setTarget(a, e, park = false) {
    tgtAz = ((a % 360) + 360) % 360; tgtEl = e; parked = park;
    azIn.value = Math.round(tgtAz); elIn.value = Math.round(Math.max(0, e));
    $('azv').textContent = azIn.value;
    $('elv').textContent = Math.round(e);
  }
  setTarget(tgtAz, tgtEl);
  azIn.oninput = () => setTarget(+azIn.value, +elIn.value);
  elIn.oninput = () => setTarget(+azIn.value, +elIn.value);
  $('park').onclick = () => setTarget(0, 0, true);
  $('zenith').onclick = () => setTarget(tgtAz, 90);
  $('grb').onclick = () => setTarget(Math.random() * 360, 35 + Math.random() * 45);
  for (const t of telescopes) { t.curAz = tgtAz; t.curEl = tgtEl; } // start on target so showers appear right away
  const azErr = (t) => Math.abs(((tgtAz - t.curAz + 540) % 360) - 180);
  function stepPointing(dt) {
    let onTarget = 0;
    for (const t of telescopes) {
      const wantEl = parked && t.kind === 'LST' ? -5 : tgtEl; // LSTs park slightly below the horizon
      const dAz = ((tgtAz - t.curAz + 540) % 360) - 180;       // shortest way round
      const dEl = wantEl - t.curEl, step = t.slewRate * dt;
      t.curAz += Math.sign(dAz) * Math.min(Math.abs(dAz), step);
      t.curEl += Math.sign(dEl) * Math.min(Math.abs(dEl), step * 0.5);
      t.az.rotation.y = -THREE.MathUtils.degToRad(t.curAz);
      t.el.rotation.x = THREE.MathUtils.degToRad(t.curEl);
      if (!t.context && Math.abs(dAz) < 0.3 && Math.abs(dEl) < 0.3) onTarget++;
    }
    return onTarget;
  }

  // ---- Air showers ----
  // Physics-based toy model, numbers and sources in SHOWER_MODEL.md:
  // - energy from a power law (spread evenly in log E, or Crab-like E^-2.5)
  // - shower maximum X_max = X0 ln(E/Ec), longitudinal profile from the Greisen formula, in an
  //   exponential atmosphere; the axis is parallel to the pointing
  // - photon density on the ground rho(R, E) ~ 90 ph/m² per TeV inside the ~120 m pool, with an
  //   energy-dependent ring and fall-off; photoelectrons = rho × mirror area × 10 % efficiency
  // - each emission point is projected into every camera with a lateral spread of ~10 m;
  //   arrival times include path length and the refractive delay of the air
  // Real times are ns; display times are seconds.
  const C_LIGHT = 0.2998;     // m/ns
  const DESCENT = 0.9;        // s of shower-development animation before the light reaches the array
  const INTRA = 0.12;         // display s per ns inside one image
  const X0 = 36.7, EC = 83e-6, X_SEA = 1030, H_ATM = 7600; // g/cm², TeV, g/cm², m (fits US Std 5-13 km)
  const H_OBS = SITE.refAlt, X_OBS = X_SEA * Math.exp(-H_OBS / H_ATM);
  const N1_OBS = 2.92e-4 * Math.exp(-H_OBS / 8400); // refractivity n - 1 at the site
  const EFF = 0.1, LAT_SPREAD = 10;                  // photon → p.e. efficiency; m
  const MIRROR = { LST: 369, MST: 88, SST: 6 };      // effective mirror area, m²
  const TRIG_SIZE = 50, TRIG_PE = 5, TRIG_PIX = 3;   // image size and pixels needed to trigger
  for (const t of array) { t.level = new Float32Array(t.pixPts.length); t.hits = null; t.dirty = true; t.lastSize = 0; }

  // Photon density (ph/m², 300-550 nm) at distance R (m) from the axis for energy E (TeV)
  function rhoCherenkov(R, E) {
    const Rc = 120, A = E <= 1 ? 0.3 : 0.3 / (1 + Math.log10(E)), R0 = 45 * Math.pow(E / 0.1, 0.15);
    let f = R <= Rc ? 1 + A * Math.exp(-(((R - Rc) / 25) ** 2)) : (1 + A) * Math.exp(-(R - Rc) / R0);
    if (E > 1) f *= 1 + 0.5 * Math.log10(E) * Math.exp(-R / 30); // deep showers fill in the core
    return 90 * E * f;
  }
  const greisen = (t, y) => { const s = 3 * t / (t + 2 * y); return 0.31 / Math.sqrt(y) * Math.exp(t * (1 - 1.5 * Math.log(s))); };
  const gauss = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
  const fmtE = (E) => E < 1 ? `${Number((E * 1000).toPrecision(2))} GeV` : `${E < 10 ? E.toFixed(1) : E.toFixed(0)} TeV`;
  function sampleEnergy() {
    const [Emin, Emax] = SITE.energy, u = Math.random();
    if (!$('spectrum') || $('spectrum').value !== 'crab') return Emin * Math.pow(Emax / Emin, u); // even in log E
    const a = 1 - 2.5;                                                                          // dN/dE ∝ E^-2.5
    return Math.pow(Math.pow(Emin, a) + u * (Math.pow(Emax, a) - Math.pow(Emin, a)), 1 / a);
  }

  const axisLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([v(0, 0, 0), v(0, 1, 0)]),
    new THREE.LineBasicMaterial({ color: 0x9fe6ff, transparent: true, opacity: 0, fog: false, blending: THREE.AdditiveBlending, depthWrite: false }));
  const frontGlow = new THREE.Mesh(new THREE.SphereGeometry(18, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xcff4ff, transparent: true, opacity: 0, fog: false, blending: THREE.AdditiveBlending, depthWrite: false }));
  // light pool: a grid draped on the terrain, textured with the radial photon density of each shower
  const poolCanvas = document.createElement('canvas'); poolCanvas.width = poolCanvas.height = 256;
  const poolTex = new THREE.CanvasTexture(poolCanvas);
  const pool = new THREE.Mesh(new THREE.BufferGeometry(),
    new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  pool.frustumCulled = false;
  scene.add(axisLine, frontGlow, pool);
  function drawPool(I, E) {
    // radius where the density drops to 3 % of its value at the ring
    const ref = rhoCherenkov(120, E);
    let Rv = 150;
    while (Rv < 1500 && rhoCherenkov(Rv, E) > 0.03 * ref) Rv += 10;
    let peak = 0;
    for (let R = 0; R <= Rv; R += 5) peak = Math.max(peak, rhoCherenkov(R, E));
    const g = poolCanvas.getContext('2d'), img = g.createImageData(256, 256);
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const r = Math.hypot(x - 127.5, y - 127.5) / 128;
      const a = r >= 1 ? 0 : Math.sqrt(rhoCherenkov(r * Rv, E) / peak) * (1 - smoothstep(0.85, 1, r));
      img.data.set([140, 225, 255, 255 * a], (y * 256 + x) * 4);
    }
    g.putImageData(img, 0, 0);
    poolTex.needsUpdate = true;
    const geo = new THREE.PlaneGeometry(2 * Rv, 2 * Rv, 80, 80);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + I.x, z = pos.getZ(i) + I.z;
      pos.setXYZ(i, x, terrainH(x, -z) + 0.8, z);
    }
    pool.geometry.dispose();
    pool.geometry = geo;
    return Rv;
  }

  let shower = null, eventCount = 0;
  const pointingDir = (azDeg, elDeg) => {
    const a = THREE.MathUtils.degToRad(azDeg), e = THREE.MathUtils.degToRad(elDeg);
    return v(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
  };
  function simulateShower(E) {
    const s = pointingDir(tgtAz, tgtEl), sinEl = Math.max(0.15, s.y);
    const Rimp = SITE.impactRadius + 150 * Math.max(0, Math.log10(E));   // brighter showers trigger from further out
    const rr = Rimp * Math.sqrt(Math.random()), ra = Math.random() * Math.PI * 2;
    const IE = cE + rr * Math.cos(ra), IN = cN + rr * Math.sin(ra);
    const I = world(IE, IN, terrainH(IE, IN));
    // longitudinal profile along the axis, in radiation lengths of slant depth
    const y = Math.log(E / EC), shift = gauss() * 0.95;                  // ~35 g/cm² shower-to-shower jitter
    const tGround = X_OBS / sinEl / X0, K = 40, samples = [];
    let wsum = 0;
    for (let k = 0; k < K; k++) {
      const t = 0.3 + (tGround - 0.3) * (k + 0.5) / K, tt = t - shift;
      if (tt <= 0.05) continue;
      const hAsl = H_ATM * Math.log(X_SEA / (t * X0 * sinEl)), D = hAsl - H_OBS;
      if (D < 30) continue;
      const w = greisen(tt, y);
      samples.push({ P: I.clone().addScaledVector(s, D / sinEl), d: D / sinEl, D, w });
      wsum += w;
    }
    for (const sm of samples) sm.w /= wsum;
    const used = samples.filter(sm => sm.w > 2e-3);
    const xMax = (y + shift) * X0, hMax = H_ATM * Math.log(X_SEA / (xMax * sinEl));

    const q = new THREE.Quaternion(), T = new THREE.Vector3(), u = new THREE.Vector3(), rel = new THREE.Vector3();
    const tels = [];
    for (const t of array) {
      t.el.updateMatrixWorld(true);
      t.el.localToWorld(T.set(0, 0, t.dishZ));
      t.el.getWorldQuaternion(q).invert();
      rel.subVectors(T, I);
      const R = rel.clone().addScaledVector(s, -rel.dot(s)).length();  // distance from the shower axis
      const size = rhoCherenkov(R, E) * MIRROR[t.kind] * EFF;         // photoelectrons collected by the mirror
      if (size < TRIG_SIZE) { tels.push({ t, R, size: 0, triggered: false, hits: [] }); continue; }
      const psf = t.pixPitch * 0.5, pixA = t.kind === 'SST' ? t.pixPitch ** 2 : t.pixPitch ** 2 * Math.sqrt(3) / 2;
      const img = [];
      for (const sm of used) {
        u.subVectors(sm.P, T);
        const dist = u.length();
        u.divideScalar(dist).applyQuaternion(q);
        if (u.z >= -0.5) continue;
        const sig = Math.hypot(t.F * LAT_SPREAD / dist, psf);
        // light from higher up crosses more air: path difference plus refractive delay (ns)
        const delay = N1_OBS * 8400 * (1 - Math.exp(-sm.D / 8400)) / sinEl;
        img.push({ x: t.F * u.x / u.z, y: t.F * u.y / u.z, w: sm.w * pixA / (2 * Math.PI * sig * sig), sig, s2: 2 * sig * sig, cut: 4 * sig, tns: (dist - sm.d + delay) / C_LIGHT });
      }
      const hits = [];
      let inCam = 0;
      for (let i = 0; i < t.pixPts.length; i++) {
        const [x, yy] = t.pixPts[i];
        let sum = 0, st = 0;
        for (const p of img) {
          const dx = x - p.x, dy = yy - p.y;
          if (dx > p.cut || dx < -p.cut || dy > p.cut || dy < -p.cut) continue;
          const g = p.w * Math.exp(-(dx * dx + dy * dy) / p.s2);
          sum += g; st += g * p.tns;
        }
        const pe = size * sum;
        inCam += pe;
        if (pe >= 1) hits.push([i, pe, st / sum]);
      }
      const triggered = inCam >= TRIG_SIZE && hits.filter(h => h[1] >= TRIG_PE).length >= TRIG_PIX;
      tels.push({ t, R, size: inCam, triggered, hits: triggered ? hits : [], tmin: triggered ? Math.min(...hits.map(h => h[2])) : 0 });
    }
    return { tels, I, s, IE, IN, E, hMax, trig: tels.filter(x => x.triggered) };
  }
  function showShower(now, forcedE) {
    // most showers land where few telescopes see them; redraw the impact until at least two do
    const E = forcedE || sampleEnergy();
    let r = simulateShower(E);
    for (let k = 0; k < 12 && r.trig.length < 2; k++) r = simulateShower(E);
    const { tels, I, s, IE, IN, hMax, trig } = r;
    const t0 = trig.length ? Math.min(...trig.map(x => x.tmin)) : 0;
    const span = trig.length ? Math.max(...trig.map(x => x.tmin)) - t0 : 0;
    const G = Math.min(0.004, 1.0 / Math.max(span, 1)); // display s per ns between telescopes
    for (const x of tels) {
      x.t.lastSize = x.triggered ? x.size : 0;
      // pixel brightness on a log scale: ~5 p.e. faint blue, ~300 p.e. saturated yellow
      x.t.hits = x.triggered ? { start: now + DESCENT + (x.tmin - t0) * G, list: x.hits.map(([i, pe, tns]) => [i, Math.log10(1 + pe) / 2.5, Math.min(1.0, (tns - x.tmin) * INTRA)]) } : null;
      x.t.label.classList.toggle('hit', x.triggered);
      x.t.dirty = true;
    }
    axisLine.geometry.setFromPoints([I, I.clone().addScaledVector(s, 15000)]);
    const Rv = drawPool(I, E);
    const bright = Math.min(1, 0.3 + 0.17 * Math.log10(E / 0.01));        // brighter showers, brighter pool
    frontGlow.scale.setScalar(0.5 + 0.35 * Math.log10(E / 0.01));
    eventCount++;
    shower = { start: now, I, s, bright };
    const best = trig.reduce((a, b) => (b.size > (a ? a.size : 0) ? b : a), null);
    const byKind = ['LST', 'MST', 'SST'].map(k => [k, trig.filter(x => x.t.kind === k).length, array.filter(t => t.kind === k).length]).filter(([, , n]) => n);
    $('evcap').innerHTML = `Event ${eventCount}: <b>${fmtE(E)}</b> · shower max ≈ ${(hMax / 1000).toFixed(1)} km a.s.l. · light pool ≈ ${Math.round(Rv / 10) * 10} m<br>` +
      `impact E ${IE.toFixed(0)} m, N ${IN.toFixed(0)} m · <b>${trig.length}/${array.length}</b> triggered (` +
      byKind.map(([k, c, n]) => `${c}/${n} ${k}`).join(', ') + ')' +
      (best ? ` · brightest image ${Math.round(best.size).toLocaleString('en')} p.e. (${best.t.name})` : '');
  }
  function updateShowerVisuals(now) {
    if (!shower) return;
    const age = now - shower.start;
    frontGlow.position.copy(shower.I).addScaledVector(shower.s, 15000 * (1 - Math.min(1, age / DESCENT)));
    frontGlow.material.opacity = age < DESCENT ? 0.9 * shower.bright : 0;
    axisLine.material.opacity = Math.max(0, 0.7 * shower.bright * Math.min(1, age * 3) * (1 - smoothstep(DESCENT + 0.6, DESCENT + 1.8, age)));
    const pa = age - DESCENT;
    pool.material.opacity = pa < 0 ? 0 : shower.bright * Math.min(1, pa / 0.08) * Math.exp(-pa / 0.7);
  }
  const tmp = new THREE.Color();
  function paintCameras(now) {
    for (const t of array) {
      if (!t.hits && !t.dirty) continue;
      t.level.fill(0);
      let active = false;
      if (t.hits) {
        for (const [i, val, dt] of t.hits.list) {
          const tau = now - t.hits.start - dt;
          if (tau < 0) { active = true; continue; }
          const p = tau < 0.04 ? tau / 0.04 : Math.exp(-(tau - 0.04) / 0.3);
          if (p > 0.01) active = true;
          t.level[i] = val * p;
        }
        if (!active) { t.hits = null; t.label.classList.remove('hit'); }
      }
      for (let i = 0; i < t.level.length; i++) t.pixels.setColorAt(i, pixelColor(t.level[i] + 0.04 * Math.random(), tmp));
      t.pixels.instanceColor.needsUpdate = true;
      t.dirty = !!t.hits;
    }
  }

  // ---- Event display: every array camera, grouped by type ----
  const evc = $('evcanvas'), ev = evc.getContext('2d'), W = evc.width;
  const CELLS = [];
  {
    let y = 8;
    for (const kind of ['LST', 'MST', 'SST']) {
      const list = array.filter(t => t.kind === kind);
      if (!list.length) continue;
      const size = kind === 'LST' ? 170 : kind === 'MST' ? (list.length > 10 ? 97 : 132) : 75;
      const perRow = Math.floor(W / size);
      list.forEach((t, i) => {
        const row = Math.floor(i / perRow), col = i % perRow, n = Math.min(perRow, list.length - row * perRow);
        CELLS.push({ t, cx: W / 2 + (col - (n - 1) / 2) * size, cy: y + row * (size + 4) + size * 0.45, r: size * 0.4, size });
      });
      y += Math.ceil(list.length / perRow) * (size + 4) + 6;
    }
    evc.height = Math.ceil(y);
    evc.style.height = (evc.height / 2) + 'px';
  }
  const evBg = document.createElement('canvas'); evBg.width = evc.width; evBg.height = evc.height;
  {
    const g = evBg.getContext('2d');
    g.fillStyle = '#0a1122'; g.fillRect(0, 0, evBg.width, evBg.height);
    g.textAlign = 'center';
    for (const c of CELLS) {
      const k = c.r / c.t.camR, px = Math.max(1.2, c.t.pixPitch * k * 0.95);
      g.fillStyle = pixelStyle(0);
      for (const [x, y] of c.t.pixPts) g.fillRect(c.cx + x * k - px / 2, c.cy - y * k - px / 2, px, px);
      g.font = `600 ${c.size > 100 ? 18 : 13}px system-ui, sans-serif`;
      g.fillStyle = { LST: '#ffd27a', MST: '#8fd3ff', SST: '#b8f0a0' }[c.t.kind];
      g.fillText(c.t.name, c.cx, c.cy + c.r + (c.size > 100 ? 18 : 13));
    }
  }
  function drawEventDisplay() {
    ev.drawImage(evBg, 0, 0);
    for (const c of CELLS) {
      if (!c.t.hits) continue;
      const k = c.r / c.t.camR, L = c.t.level, px = Math.max(1.6, c.t.pixPitch * k * 1.05);
      for (let i = 0; i < L.length; i++) {
        if (L[i] < 0.05) continue;
        const [x, y] = c.t.pixPts[i];
        ev.fillStyle = pixelStyle(L[i]);
        ev.fillRect(c.cx + x * k - px / 2, c.cy - y * k - px / 2, px, px);
      }
    }
  }

  // ---- Fly-to, picking ----
  const flyto = $('flyto');
  for (const t of telescopes) { const o = document.createElement('option'); o.value = t.name; o.textContent = t.name + (t.context ? ` (${t.contextNote || 'not in the array'})` : ''); flyto.appendChild(o); }
  function overview() { cam.position.set(...SITE.overview.pos); controls.target.set(...SITE.overview.target); }
  overview();
  flyto.onchange = () => {
    const t = telescopes.find(x => x.name === flyto.value);
    if (!t) return overview();
    const p = t.root.position, out = v(p.x - cE, 0, p.z + cN).normalize();
    if (out.lengthSq() < 0.1) out.set(1, 0, 1).normalize();
    const dist = { LST: 75, MST: 45, SST: 18, MAGIC: 60 }[t.kind];
    controls.target.set(p.x, p.y + t.pivotH, p.z);
    cam.position.set(p.x + out.x * dist, p.y + dist * 0.45, p.z + out.z * dist);
  };
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  let downAt = null;
  renderer.domElement.addEventListener('pointerdown', e => downAt = [e.clientX, e.clientY]);
  renderer.domElement.addEventListener('pointerup', e => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 5) return;
    mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(mouse, cam);
    const targets = telescopes.filter(t => t.root.visible).map(t => t.root).concat([inner]);
    const hit = ray.intersectObjects(targets, true)[0];
    if (!hit) return;
    let o = hit.object, part = null, tel = null;
    for (; o; o = o.parent) { if (!part && o.userData.info) part = o.userData.info; if (o.userData.tel) { tel = o.userData.tel; break; } }
    if (tel) {
      const [pt, pd] = (part && tel.info[part]) || [tel.kind, ''];
      $('infoTitle').textContent = `${tel.name} · ${pt}`;
      $('infoMeta').textContent = `E ${tel.E.toFixed(1)} m, N ${tel.N.toFixed(1)} m · ground ≈ ${(SITE.refAlt + tel.ground).toFixed(0)} m a.s.l.` +
        (tel.context ? ` · ${tel.contextNote || 'not in the array'}` : '') + (tel.lastSize ? ` · last image ${Math.round(tel.lastSize).toLocaleString('en')} p.e.` : '');
      $('infoText').textContent = pd;
    } else {
      $('infoTitle').textContent = 'Terrain';
      $('infoMeta').textContent = `E ${hit.point.x.toFixed(0)} m, N ${(-hit.point.z).toFixed(0)} m · ≈ ${(SITE.refAlt + hit.point.y).toFixed(0)} m a.s.l.`;
      $('infoText').textContent = SITE.terrainText;
    }
  });

  // ---- Loop ----
  const clock = new THREE.Clock(), status = $('status'), projV = new THREE.Vector3();
  let nextShower = 1.0, evFrame = 0, forcedE = null;
  if ($('fireLow')) $('fireLow').onclick = () => { forcedE = 0.05; nextShower = 0; };
  if ($('fireHigh')) $('fireHigh').onclick = () => { forcedE = 30; nextShower = 0; };
  const kinds = ['LST', 'MST', 'SST'].filter(k => array.some(t => t.kind === k));
  function tick() {
    const dt = Math.min(clock.getDelta(), 0.1), now = clock.elapsedTime;
    const onTarget = stepPointing(dt);
    const tracking = onTarget === array.length && !parked;
    status.innerHTML = parked ? (onTarget === array.length ? '<b>Parked</b>' : `<b>Parking</b> · ${onTarget}/${array.length} in position`)
      : tracking ? `<b>Tracking</b> az ${tgtAz.toFixed(0)}°, el ${tgtEl.toFixed(0)}°`
      : '<b>Slewing</b> · ' + kinds.map(k => {
        const l = array.filter(t => t.kind === k);
        return `${k}s ${l.filter(t => azErr(t) < 0.3 && Math.abs(tgtEl - t.curEl) < 0.3).length}/${l.length}`;
      }).join(', ') + ' on target';
    if ($('tShowers').checked && tracking && now > nextShower) {
      showShower(now, forcedE);
      forcedE = null;
      nextShower = now + 3.2 + Math.random() * 1.5;
    }
    updateShowerVisuals(now);
    paintCameras(now);
    if (evFrame++ % 2 === 0) drawEventDisplay();

    const lv = $('tLabels').checked;
    for (const t of [...telescopes, ...landmarks]) {
      if (!lv || !t.root.visible) { t.label.style.display = 'none'; continue; }
      projV.copy(t.root.position); projV.y += t.labelHeight;
      projV.project(cam);
      const vis = projV.z < 1 && Math.abs(projV.x) < 1.1 && Math.abs(projV.y) < 1.1;
      t.label.style.display = vis ? 'block' : 'none';
      if (vis) { t.label.style.left = ((projV.x + 1) / 2 * innerWidth) + 'px'; t.label.style.top = ((1 - projV.y) / 2 * innerHeight) + 'px'; }
    }
    controls.update();
    renderer.render(scene, cam);
    requestAnimationFrame(tick);
  }
  tick();

  addEventListener('resize', () => {
    cam.aspect = innerWidth / innerHeight;
    cam.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  return { scene, cam, controls, telescopes, array, vegetation, terrainH, M, flyto };
}
