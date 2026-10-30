// Shared helpers for the CTAO telescope models (classic script, defines globals).
// Needs three.js r128 loaded first.

const UP = new THREE.Vector3(0, 1, 0);
const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 8);
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const v = (x, y, z) => new THREE.Vector3(x, y, z);
const tagged = (obj, key) => { obj.userData.info = key; return obj; };

function makeMaterials() {
  return {
    white: new THREE.MeshStandardMaterial({ color: 0xe8eaed, metalness: 0.25, roughness: 0.5 }),
    grey: new THREE.MeshStandardMaterial({ color: 0xa9afb6, metalness: 0.45, roughness: 0.45 }),
    lstRed: new THREE.MeshStandardMaterial({ color: 0x5e0d10, metalness: 0.35, roughness: 0.6 }),
    mstRed: new THREE.MeshStandardMaterial({ color: 0x7a0c10, metalness: 0.3, roughness: 0.5 }),
    cfrp: new THREE.MeshStandardMaterial({ color: 0x5b6067, metalness: 0.3, roughness: 0.55 }),
    mirror: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.16 }),
    mirrorBack: new THREE.MeshStandardMaterial({ color: 0xa9afb5, metalness: 0.4, roughness: 0.5 }),
    camera: new THREE.MeshStandardMaterial({ color: 0xf1f3f4, metalness: 0.15, roughness: 0.45 }),
    concrete: new THREE.MeshStandardMaterial({ color: 0xa3a4a6, roughness: 0.9 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x14171c, metalness: 0.2, roughness: 0.35 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xdfe9f5, metalness: 0.6, roughness: 0.05, transparent: true, opacity: 0.18, depthWrite: false }),
    rope: new THREE.LineBasicMaterial({ color: 0xc9d1dc, transparent: true, opacity: 0.75 }),
    rail: new THREE.LineBasicMaterial({ color: 0xb8bec6 }),
    cable: new THREE.LineBasicMaterial({ color: 0x4a4f57 }),
  };
}

// One InstancedMesh for many members: segs = [[a, b], ...]. square = box section (girders).
function tubes(segs, radius, mat, square = false) {
  const geo = square ? unitBox : unitCyl, k = square ? 2 : 1;
  const mesh = new THREE.InstancedMesh(geo, mat, segs.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), mid = new THREE.Vector3(), dir = new THREE.Vector3();
  segs.forEach(([a, b], i) => {
    dir.subVectors(b, a);
    const len = dir.length();
    q.setFromUnitVectors(UP, dir.normalize());
    mid.addVectors(a, b).multiplyScalar(0.5);
    m.compose(mid, q, s.set(radius * k, len, radius * k));
    mesh.setMatrixAt(i, m);
  });
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
const lines = (pts, mat) => new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), mat);
function box(w, h, d, mat, x, y, z) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  b.position.set(x, y, z);
  b.castShadow = b.receiveShadow = true;
  return b;
}
// Rectangular railing around [x0,x1]×[z0,z1] at height y
function railing(x0, x1, z0, z1, y, mat, h = 1.1) {
  const pts = [], c = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  for (let i = 0; i < 4; i++) {
    const [ax, az] = c[i], [bx, bz] = c[(i + 1) % 4];
    for (const t of [h, h / 2]) pts.push(v(ax, y + t, az), v(bx, y + t, bz));
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 1.5));
    for (let k = 0; k < n; k++) {
      const x = ax + (bx - ax) * k / n, z = az + (bz - az) * k / n;
      pts.push(v(x, y, z), v(x, y + h, z));
    }
  }
  return lines(pts, mat);
}
// Lattice box with X-bracing. Corners interpolate from a base to a top footprint.
function lattice(xa, xb, zBase, zTop, y0, y1, levels) {
  const segs = [];
  const ring = (i) => {
    const t = i / levels, y = y0 + (y1 - y0) * t, z = zBase + (zTop - zBase) * t;
    return [v(xa, y, -z), v(xb, y, -z), v(xb, y, z), v(xa, y, z)];
  };
  for (let i = 0; i <= levels; i++) {
    const r = ring(i);
    for (let k = 0; k < 4; k++) segs.push([r[k], r[(k + 1) % 4]]);
    if (i === 0) continue;
    const p = ring(i - 1);
    for (let k = 0; k < 4; k++) {
      const k2 = (k + 1) % 4;
      segs.push([p[k], r[k]], [p[k], r[k2]], [p[k2], r[k]]);
    }
  }
  return segs;
}
// Hex grid with neighbours along ±x, trimmed to the n cells nearest the centre
function hexGrid(pitch, n, skipCentre = false) {
  const R = Math.ceil(Math.sqrt(n)) + 2, pts = [];
  for (let j = -R; j <= R; j++)
    for (let i = -R; i <= R; i++) {
      if (skipCentre && i === 0 && j === 0) continue;
      const x = pitch * (i + j / 2), y = pitch * j * Math.sqrt(3) / 2;
      pts.push([x, y, Math.hypot(x, y) + 1e-6 * Math.atan2(y, x)]);
    }
  return pts.sort((a, b) => a[2] - b[2]).slice(0, n);
}

// Camera face at z = camZ, facing +Z (toward the dish): 1855 light-guide pixels (positions from js/lstcam.js) behind a round window.
const CAM_PIX_PITCH = 0.05;
const cameraFace = (() => {
  const pts = lstcamPoints(), rot = LSTCAM_ROT;
  const r = CAM_PIX_PITCH / Math.sqrt(3) * 0.94;
  const geo = new THREE.CylinderGeometry(r, r * 0.6, 0.04, 6); // tapered like a light guide
  geo.rotateX(Math.PI / 2);
  return { pts, rot, geo };
})();
function addCameraFace(group, camZ, M) {
  const pixels = new THREE.InstancedMesh(cameraFace.geo, new THREE.MeshBasicMaterial(), cameraFace.pts.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(v(0, 0, 1), cameraFace.rot);
  cameraFace.pts.forEach(([x, y], i) => { m.compose(v(x, y, camZ + 0.03), q, v(1, 1, 1)); pixels.setMatrixAt(i, m); });
  group.add(pixels);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(1.3, 72), M.glass);
  glass.position.set(0, 0, camZ + 0.09);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.05, 8, 72), M.dark);
  rim.position.copy(glass.position);
  group.add(glass, rim);
  return pixels;
}

// Twilight sky: gradient dome, stars, environment map, lights. Returns the key light.
function addTwilightSky(scene, renderer, { domeRadius = 900, shadowExtent = 60, night = false } = {}) {
  const SKY = night ? { top: 0x02040c, mid: 0x060c1e, horizon: 0x101a30, hemi: 0.12, key: 0.22 } : { top: 0x0f2a6b, mid: 0x4a74c4, horizon: 0xb9c9e6, hemi: 0.55, key: 1.3 };
  const dome = new THREE.Mesh(new THREE.SphereGeometry(domeRadius, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(SKY.top) }, mid: { value: new THREE.Color(SKY.mid) }, horizon: { value: new THREE.Color(SKY.horizon) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top, mid, horizon; varying vec3 vP; void main(){ float h = max(vP.y, 0.0); vec3 c = mix(horizon, mid, smoothstep(0.0, 0.25, h)); c = mix(c, top, smoothstep(0.25, 1.0, h)); if (vP.y < 0.0) c = mix(horizon, vec3(0.32,0.38,0.5) * ' + (night ? '0.12' : '1.0') + ', smoothstep(0.0,-0.2,vP.y)); gl_FragColor = vec4(c, 1.0); }',
  }));
  dome.frustumCulled = false;
  scene.add(dome);
  const n = 3000, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * Math.PI * 2, y = 0.08 + Math.random() * 0.92, r = Math.sqrt(1 - y * y);
    pos.set([0.94 * domeRadius * r * Math.cos(u), 0.94 * domeRadius * y, 0.94 * domeRadius * r * Math.sin(u)], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 }));
  stars.frustumCulled = false;
  scene.add(stars);

  // equirectangular gradient matching the dome, so mirrors reflect a blue twilight sky
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const ctx = c.getContext('2d'), grad = ctx.createLinearGradient(0, 0, 0, 256);
  if (night) {
    grad.addColorStop(0, '#02040c'); grad.addColorStop(0.3, '#050a1a'); grad.addColorStop(0.49, '#101a30');
    grad.addColorStop(0.52, '#0a0d0a'); grad.addColorStop(1, '#050605');
  } else {
    grad.addColorStop(0, '#0f2a6b'); grad.addColorStop(0.3, '#3d66b8'); grad.addColorStop(0.49, '#b9c9e6');
    grad.addColorStop(0.52, '#55604a'); grad.addColorStop(1, '#2c3324');
  }
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.encoding = THREE.sRGBEncoding;
  scene.environment = new THREE.PMREMGenerator(renderer).fromEquirectangular(tex).texture;

  scene.add(new THREE.HemisphereLight(0xb8cdf5, 0x3c4630, SKY.hemi));
  const key = new THREE.DirectionalLight(0xdfe8ff, SKY.key);
  key.position.set(-0.6, 0.8, -0.4).multiplyScalar(shadowExtent * 1.6);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  key.shadow.bias = -0.0005;
  Object.assign(key.shadow.camera, { left: -shadowExtent, right: shadowExtent, top: shadowExtent, bottom: -shadowExtent, far: shadowExtent * 5 });
  scene.add(key, key.target);
  return key;
}

// Pixel colours: idle light guides, then blue → yellow with signal
// hex values are sRGB; convert so they render as written with sRGB output
const PIX_IDLE = new THREE.Color(0x3c4a5c).convertSRGBToLinear(), PIX_MID = new THREE.Color(0x3fa9ff).convertSRGBToLinear(), PIX_HOT = new THREE.Color(0xffe066).convertSRGBToLinear();
function pixelColor(s, out) {
  return out.copy(PIX_IDLE).lerp(s < 0.5 ? PIX_MID : PIX_HOT, Math.min(1, s * 1.6));
}
// CSS colour for 2D canvases, which expect sRGB
const _pixCss = new THREE.Color();
const pixelStyle = (s) => pixelColor(s, _pixCss).convertLinearToSRGB().getStyle();
