// CTAO Small-Sized Telescope (SST, ASTRI-based dual-mirror design). See SST_summary.md.
// buildSST(M) returns { root, az, el, ... }; root sits at ground level on the azimuth axis.
// The dish faces local -Z at elevation 0. M1 and M2 are approximated by spheres chosen to
// reproduce the published spacings; the real surfaces are aspheric polynomials.

const SST_INFO = {
  mirrors: ['Primary mirror M1 (18 panels)', '4.3 m primary made of 18 hexagonal panels in three concentric rings, each ring with its own aspheric profile. The centre is left open for the camera tube.'],
  m2: ['Secondary mirror M2', 'A monolithic 1.8 m glass shell, 19 mm thick, bent to shape. It sits 3 m above M1 and reflects the light back down onto the camera 0.52 m below it.'],
  dish: ['Primary dish', 'The M1 support: large and flat, built in two halves, about 4.7 t, with a grated walkway round the edge.'],
  mast: ['Mast', 'A slim quadrupod fixed to the dish that carries the M2 housing.'],
  tube: ['Central tube', 'Carries the camera on the optical axis, between M1 and M2.'],
  camera: ['SST camera (SST-CAM)', '2048 silicon photomultiplier pixels in 32 modules of 8 × 8, each pixel 6 × 6 mm (about 0.19°). The modules follow the curved focal surface (radius 1060 mm). Waveforms sampled at 1 GSa/s.'],
  counter: ['Counterweights', 'Ballast on two long arms that balance the mast, M2 and camera around the elevation axis.'],
  fork: ['Fork', 'Turns on the azimuth bearing and carries the elevation bearings and drives. Elevation range −1° to +90°.'],
  tower: ['Tower', 'Conical steel column holding the azimuth bearing and drive. Azimuth range ±270°. The whole structure weighs about 16 t (ASTRI-Horn).'],
};

// Sphere-approximated optics (local el frame, metres)
const SST_OPTICS = (() => {
  const DISH_Z = -0.75;          // M1 vertex
  const R1 = 8.0;                // M1 radius of curvature (focus 4 m)
  const M2_Z = DISH_Z - 3.0;     // M2 vertex, 3 m from M1
  const R2 = 2.17;               // concave M2
  const CAM_Z = M2_Z + 0.52;     // focal surface, 0.52 m below M2
  return { DISH_Z, R1, M2_Z, R2, CAM_Z, F_EQ: 2.15, M1_R: 2.15, M2_R: 0.9 };
})();

// Camera layout: 6 × 6 modules minus the corners = 32 modules of 8 × 8 pixels = 2048.
// Returns pixel centres in focal-plane coordinates (x, y) in metres.
const SST_PIX_PITCH = 0.0065, SST_MOD_PITCH = 0.0545;
const sstCameraLayout = (() => {
  const pts = [], mods = [];
  for (let my = 0; my < 6; my++)
    for (let mx = 0; mx < 6; mx++) {
      if ((mx === 0 || mx === 5) && (my === 0 || my === 5)) continue;
      const cx = (mx - 2.5) * SST_MOD_PITCH, cy = (my - 2.5) * SST_MOD_PITCH;
      mods.push([cx, cy]);
      for (let py = 0; py < 8; py++)
        for (let px = 0; px < 8; px++)
          pts.push([cx + (px - 3.5) * SST_PIX_PITCH, cy + (py - 3.5) * SST_PIX_PITCH, mods.length - 1]);
    }
  return { pts, mods };
})();

function buildSST(M) {
  const { DISH_Z, R1, M2_Z, R2, CAM_Z } = SST_OPTICS;
  const PIVOT_H = 3.6, BEAR_X = 2.55;
  const C1 = v(0, 0, DISH_Z - R1);                       // M1 centre of curvature
  const m1Z = (x, y) => C1.z + Math.sqrt(R1 * R1 - x * x - y * y);
  const C2 = v(0, 0, M2_Z + R2);                         // M2 centre of curvature (towards M1)
  const black = new THREE.MeshStandardMaterial({ color: new THREE.Color(0x24272b).convertSRGBToLinear(), metalness: 0.1, roughness: 0.7 });
  const red = M.sstRed || (M.sstRed = new THREE.MeshStandardMaterial({ color: new THREE.Color(0x6e0c12).convertSRGBToLinear(), metalness: 0.3, roughness: 0.55 }));

  const root = new THREE.Group(), az = new THREE.Group(), el = new THREE.Group();
  el.position.y = PIVOT_H;
  az.add(el); root.add(az);

  // ---- M1: 18 hexagonal panels (ring of 6 + ring of 12), centre open ----
  const PANEL = 0.85;
  const panelPts = hexGrid(PANEL, 18, true);
  const mirrors = tagged(new THREE.Group(), 'mirrors');
  {
    const r = PANEL / Math.sqrt(3) * 0.97;
    const geo = new THREE.CylinderGeometry(r, r, 0.04, 6);
    geo.rotateX(Math.PI / 2);
    const facets = new THREE.InstancedMesh(geo, [M.mirrorBack, M.mirrorBack, M.mirror], panelPts.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion();
    panelPts.forEach(([x, y], i) => {
      const p = v(x, y, m1Z(x, y));
      q.setFromUnitVectors(v(0, 0, -1), C1.clone().sub(p).normalize());
      facets.setMatrixAt(i, m.compose(p, q, v(1, 1, 1)));
    });
    facets.castShadow = facets.receiveShadow = true;
    mirrors.add(facets);
  }
  el.add(mirrors);

  // ---- Primary dish: flat hexagonal frame with a grated rim walkway ----
  const dish = tagged(new THREE.Group(), 'dish');
  const RIM = 2.5, DZ0 = DISH_Z + 0.12, DZ1 = DISH_Z + 0.55;
  const hexPt = (r, k, z) => { const a = (k / 6) * Math.PI * 2 + Math.PI / 6; return v(r * Math.cos(a), r * Math.sin(a), z); };
  {
    const g = [];
    for (let k = 0; k < 6; k++) {
      for (const z of [DZ0, DZ1]) g.push([hexPt(RIM, k, z), hexPt(RIM, k + 1, z)], [hexPt(1.25, k, z), hexPt(1.25, k + 1, z)], [hexPt(0.45, k, z), hexPt(RIM, k, z)]);
      g.push([hexPt(RIM, k, DZ0), hexPt(RIM, k, DZ1)], [hexPt(RIM, k, DZ0), hexPt(RIM, k + 1, DZ1)], [hexPt(1.25, k, DZ1), hexPt(RIM, k + 1, DZ0)]);
    }
    dish.add(tubes(g, 0.07, red, true));
    // rim walkway: thin hexagonal ring plate
    const shape = new THREE.Shape(), hole = new THREE.Path();
    for (let k = 0; k <= 6; k++) {
      const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
      (k ? shape.lineTo.bind(shape) : shape.moveTo.bind(shape))(2.75 * Math.cos(a), 2.75 * Math.sin(a));
      (k ? hole.lineTo.bind(hole) : hole.moveTo.bind(hole))(2.38 * Math.cos(a), 2.38 * Math.sin(a));
    }
    shape.holes.push(hole);
    const walk = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ color: new THREE.Color(0x6e0c12).convertSRGBToLinear(), metalness: 0.3, roughness: 0.6, side: THREE.DoubleSide }));
    walk.position.z = DZ0 - 0.02;
    walk.castShadow = true;
    dish.add(walk);
    // rim railing posts
    const rail = [];
    for (let k = 0; k < 6; k++) for (let s = 0; s < 4; s++) {
      const p = hexPt(2.72, k, DZ0).lerp(hexPt(2.72, k + 1, DZ0), s / 4);
      rail.push(p, p.clone().setZ(DZ0 - 0.25));
      rail.push(p.clone().setZ(DZ0 - 0.25), hexPt(2.72, k, DZ0).lerp(hexPt(2.72, k + 1, DZ0), (s + 1) / 4).setZ(DZ0 - 0.25));
    }
    dish.add(lines(rail, M.rail));
    // dish to elevation bearings
    const b = [];
    for (const s of [-1, 1]) {
      const B = v(s * BEAR_X, 0, 0);
      b.push([B, hexPt(RIM, s > 0 ? 0 : 3, DZ1)], [B, hexPt(RIM, s > 0 ? 5 : 2, DZ1)], [B, hexPt(1.25, s > 0 ? 0 : 3, DZ1)]);
    }
    dish.add(tubes(b, 0.11, red, true));
  }
  el.add(dish);

  // ---- M2: concave monolithic shell inside a faceted housing ----
  const m2 = tagged(new THREE.Group(), 'm2');
  {
    const theta = Math.asin(SST_OPTICS.M2_R / R2);
    const geo = new THREE.SphereGeometry(R2, 48, 8, 0, Math.PI * 2, 0, theta);
    geo.rotateX(-Math.PI / 2);                       // cap now points to -Z from its centre
    const shell = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.12, side: THREE.DoubleSide }));
    shell.position.copy(C2);
    const housingGeo = new THREE.CylinderGeometry(0.5, 1.08, 0.75, 8, 1, true);
    housingGeo.rotateX(-Math.PI / 2);               // narrow end towards the sky (-Z)
    const housing = new THREE.Mesh(housingGeo, new THREE.MeshStandardMaterial({ color: new THREE.Color(0x24272b).convertSRGBToLinear(), metalness: 0.1, roughness: 0.7, side: THREE.DoubleSide }));
    housing.position.z = M2_Z - 0.3;
    const capGeo = new THREE.CircleGeometry(0.5, 8);
    const cap = new THREE.Mesh(capGeo, black);
    cap.position.z = M2_Z - 0.675; cap.rotation.y = Math.PI;
    housing.castShadow = cap.castShadow = true;
    m2.add(shell, housing, cap);
    const ring = [];
    for (let k = 0; k < 8; k++) {
      const a0 = k / 8 * Math.PI * 2 + Math.PI / 8, a1 = (k + 1) / 8 * Math.PI * 2 + Math.PI / 8;
      ring.push([v(1.08 * Math.cos(a0), 1.08 * Math.sin(a0), M2_Z + 0.075), v(1.08 * Math.cos(a1), 1.08 * Math.sin(a1), M2_Z + 0.075)]);
    }
    m2.add(tubes(ring, 0.05, black));
  }
  el.add(m2);

  // ---- Mast: quadrupod from the dish corners to the M2 housing ----
  const mast = tagged(new THREE.Group(), 'mast');
  {
    const top = [45, 135, 225, 315].map(d => v(1.05 * Math.cos(d * Math.PI / 180), 1.05 * Math.sin(d * Math.PI / 180), M2_Z + 0.08));
    const feet = [0, 1, 3, 4].map(k => hexPt(RIM - 0.05, k, DZ0 - 0.05)); // eccentric: corners on either side
    const legs = feet.map((f, i) => [f, top[i]]);
    const braces = [];
    for (let i = 0; i < 4; i++) {
      const a = feet[i].clone().lerp(top[i], 0.55), b = feet[(i + 1) % 4].clone().lerp(top[(i + 1) % 4], 0.55);
      braces.push([a, b], [a, v(0, 0, CAM_Z + 0.6)]);
    }
    mast.add(tubes(legs, 0.07, black), tubes(braces, 0.025, black));
  }
  el.add(mast);

  // ---- Central tube and camera (faces M2, i.e. towards -Z) ----
  const tube = tagged(new THREE.Group(), 'tube');
  {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, (DISH_Z + 0.3) - (CAM_Z + 0.45), 24), black);
    t.rotation.x = Math.PI / 2;
    t.position.z = ((DISH_Z + 0.3) + (CAM_Z + 0.45)) / 2;
    t.castShadow = true;
    tube.add(t);
  }
  el.add(tube);
  const camera = tagged(new THREE.Group(), 'camera');
  camera.add(box(0.56, 0.56, 0.42, M.grey, 0, 0, CAM_Z + 0.24));
  camera.add(box(0.44, 0.44, 0.03, M.dark, 0, 0, CAM_Z + 0.045)); // behind the curved module surface
  const pixels = new THREE.InstancedMesh(unitBox, new THREE.MeshBasicMaterial(), sstCameraLayout.pts.length);
  {
    // modules tile the curved focal surface (radius 1.06 m, centre on the M1 side)
    const RF = 1.06, CF = v(0, 0, CAM_Z + RF);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3();
    const qMod = sstCameraLayout.mods.map(([x, y]) => {
      const c = v(x, y, CF.z - Math.sqrt(RF * RF - x * x - y * y));
      return { c, q: new THREE.Quaternion().setFromUnitVectors(v(0, 0, -1), c.clone().sub(CF).normalize()) };
    });
    sstCameraLayout.pts.forEach(([x, y, k], i) => {
      const md = qMod[k], [mx, my] = sstCameraLayout.mods[k];
      p.set(x - mx, y - my, -0.004).applyQuaternion(md.q).add(md.c);
      m.compose(p, md.q, v(SST_PIX_PITCH * 0.92, SST_PIX_PITCH * 0.92, 0.006));
      pixels.setMatrixAt(i, m);
    });
  }
  camera.add(pixels);
  el.add(camera);

  // ---- Counterweights on two long arms behind the dish ----
  const counter = tagged(new THREE.Group(), 'counter');
  {
    const arms = [];
    for (const s of [-1, 1]) {
      const W = v(s * 2.15, -1.25, 1.85);
      arms.push([v(s * BEAR_X, 0, 0), W], [hexPt(RIM, s > 0 ? 5 : 4, DZ1), W], [hexPt(1.25, s > 0 ? 5 : 4, DZ1), W]);
      const w = box(0.75, 1.15, 1.25, red, W.x, W.y - 0.1, W.z + 0.3);
      for (let k = 0; k < 3; k++) counter.add(box(0.85, 0.12, 1.35, red, W.x, W.y - 0.6 + k * 0.45, W.z + 0.3)); // ribbed plates
      counter.add(w);
    }
    counter.add(tubes(arms, 0.09, red));
  }
  el.add(counter);

  // ---- Fork on the azimuth bearing ----
  const fork = tagged(new THREE.Group(), 'fork');
  {
    fork.add(box(1.5, 0.55, 1.3, red, 0, 2.85, 0));
    const arms = [];
    for (const s of [-1, 1]) {
      arms.push([v(s * 0.6, 3.05, -0.5), v(s * BEAR_X, PIVOT_H, -0.05)], [v(s * 0.6, 3.05, 0.5), v(s * BEAR_X, PIVOT_H, 0.05)],
                [v(s * 0.7, 2.7, 0), v(s * BEAR_X, PIVOT_H - 0.55, 0)], [v(s * BEAR_X, PIVOT_H - 0.55, 0), v(s * BEAR_X, PIVOT_H, 0)]);
      fork.add(box(0.5, 0.6, 0.6, red, s * BEAR_X, PIVOT_H, 0));
      fork.add(box(0.35, 0.8, 0.5, red, s * (BEAR_X - 0.45), PIVOT_H - 0.25, 0.35)); // elevation drive
    }
    fork.add(tubes(arms, 0.13, red, true));
    const bearing = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.18, 40), M.dark);
    bearing.position.y = 2.55;
    fork.add(bearing);
  }
  az.add(fork);

  // ---- Tower: flared conical column on a pad ----
  const tower = tagged(new THREE.Group(), 'tower');
  {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.9, 2.2, 40), red);
    col.position.y = 1.4;
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.05, 0.3, 40), red);
    foot.position.y = 0.15;
    const bolts = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.04, 6, 40), M.dark);
    bolts.rotation.x = Math.PI / 2; bolts.position.y = 0.05;
    const pad = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.3, 3.2), M.concrete);
    pad.position.y = -0.1; pad.receiveShadow = true;
    col.castShadow = foot.castShadow = true;
    const door = box(0.55, 0.9, 0.08, red, 0, 1.0, 0.76);
    door.rotation.x = -0.14;
    tower.add(col, foot, bolts, pad, door);
  }
  root.add(tower);

  return {
    kind: 'SST', info: SST_INFO, root, az, el, pixels, pixPts: sstCameraLayout.pts, camR: 0.2, pixPitch: SST_PIX_PITCH, F: SST_OPTICS.F_EQ, camZ: CAM_Z, dishZ: DISH_Z, pivotH: PIVOT_H,
    labelHeight: 9, slewRate: 6, // illustrative
    parts: { mirrors, dish, mast, m2 },
    pads: [[0, 0, 2.5]],
    optics: { C1, R1, C2, R2, panelPts, PANEL },
  };
}

// Ray path for the display: M1 is taken as a paraboloid (focus 4 m), so every ray heads
// exactly for M1's focus; it is intersected with the M2 sphere and then drawn to the ideal
// on-axis focus. The real aspheric surfaces do that last correction; spheres alone would not.
function sstTraceRay(x, y) {
  const { DISH_Z, M2_Z, R2, CAM_Z } = SST_OPTICS;
  const F1 = v(0, 0, DISH_Z - 4.0), C2 = v(0, 0, M2_Z + R2);
  const P1 = v(x, y, DISH_Z - (x * x + y * y) / 16);
  const d1 = F1.clone().sub(P1).normalize();
  // P1 lies inside the M2 sphere, so the ray leaves it through the cap: the positive root
  const oc = P1.clone().sub(C2), b = oc.dot(d1), c = oc.lengthSq() - R2 * R2, disc = b * b - c;
  if (disc < 0) return null;
  const P2 = P1.clone().addScaledVector(d1, -b + Math.sqrt(disc));
  return [P1, P2, v(0, 0, CAM_Z)];
}
