// CTAO Large-Sized Telescope (LST) model. See LST-1_summary.md for the numbers.
// buildLST(M) returns { root, az, el, ... }; root sits at ground level on the azimuth axis,
// north is -Z, the dish faces local -Z at elevation 0.

const LST_INFO = {
  mirrors: ['Mirror facets (198)', 'Hexagonal facets about 1.5 m flat-to-flat on a 23 m paraboloid with 28 m focal length. A parabola keeps all light paths to the focus the same length, so the nanosecond Cherenkov flash stays short. The Active Mirror Control re-aligns the facets about every 10 s as the dish bends.'],
  frame: ['Dish space frame', 'A tetrahedral frame of tubes joined with MERO nodes. The design specified carbon-fibre tubes to keep the moving mass low, which allows fast slewing.'],
  arch: ['Camera support arch', 'A single arched tube carries the camera at the focal point, 28 m from the dish, tied to the rim by a fan of tension ropes.'],
  camera: ['LST camera', '1855 photomultiplier pixels in 265 modules of 7, GHz-sampling readout, 4.5° field of view, under 2 t.'],
  calibox: ['CaliBox', 'Calibration light source at the centre of the dish that flashes the camera.'],
  elev: ['Elevation drive arc', 'A large circular arc under the dish, centred on the elevation axle, driven from the base.'],
  towers: ['Azimuth structure', 'Steel lattice frame with two tapered side towers holding the elevation bearings and platforms.'],
  base: ['Bogies and azimuth rail', 'The structure rides on wheeled bogies on a circular rail. An LST can slew 180° in about 20 s to catch gamma-ray bursts.'],
  access: ['Camera access tower', 'Fixed tower with stairs and a work cabin, used to reach the camera when the telescope is parked.'],
};

function buildLST(M) {
  const F = 28, N_FACETS = 198, FACET_FLAT = 1.51;
  const PIVOT_H = 14.5, DISH_Z = -1.5, FRAME_DEPTH = 2.6, RIM_R = 12.2;
  const BEARING_X = 12.9, TOWER_OUT = 15.6, TOWER_Z = 7, ARC_R = 13;
  const CAM_Z = DISH_Z - F;
  const surfZ = (x, y) => DISH_Z - (x * x + y * y) / (4 * F);

  const root = new THREE.Group(), az = new THREE.Group(), el = new THREE.Group();
  el.position.y = PIVOT_H;
  az.add(el); root.add(az);

  // ---- Mirrors (centre position left open) ----
  const facetPts = hexGrid(FACET_FLAT, N_FACETS, true);
  const facetR = FACET_FLAT / Math.sqrt(3) * 0.975;
  const facetGeo = new THREE.CylinderGeometry(facetR, facetR, 0.05, 6);
  facetGeo.rotateX(Math.PI / 2);
  const focus = v(0, 0, CAM_Z);
  const mirrors = tagged(new THREE.Group(), 'mirrors');
  {
    // after rotateX(+90°) the bottom cap (group 2) faces -Z, toward the camera
    const facets = new THREE.InstancedMesh(facetGeo, [M.mirrorBack, M.mirrorBack, M.mirror], facetPts.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion();
    facetPts.forEach(([x, y], i) => {
      const p = v(x, y, surfZ(x, y));
      const n = v(0, 0, -1).add(focus.clone().sub(p).normalize()).normalize();
      q.setFromUnitVectors(v(0, 0, -1), n);
      m.compose(p, q, v(1, 1, 1));
      facets.setMatrixAt(i, m);
    });
    facets.castShadow = facets.receiveShadow = true;
    mirrors.add(facets);
  }
  el.add(mirrors);

  // ---- Dish space frame ----
  const frame = tagged(new THREE.Group(), 'frame');
  const N_SPOKE = 30;
  const node = (r, k, back) => {
    const a = (k / N_SPOKE) * Math.PI * 2, x = r * Math.cos(a), y = r * Math.sin(a);
    return v(x, y, surfZ(x, y) + 0.3 + (back ? FRAME_DEPTH * (1 - 0.45 * r / RIM_R) : 0));
  };
  {
    const radii = [1.8, 4.2, 6.6, 9.0, 11.0, RIM_R], segs = [];
    radii.forEach((r, ri) => {
      for (let k = 0; k < N_SPOKE; k++) {
        const f0 = node(r, k, 0), f1 = node(r, k + 1, 0), b0 = node(r, k, 1), b1 = node(r, k + 1, 1);
        segs.push([f0, f1], [b0, b1], [f0, b0], [f0, b1], [b0, f1]);
        if (ri > 0) {
          const pr = radii[ri - 1];
          segs.push([node(pr, k, 0), f0], [node(pr, k, 1), b0], [node(pr, k, 1), f0], [node(pr, k + 1, 0), b0]);
        }
      }
    });
    frame.add(tubes(segs, 0.05, M.white));
    const g = [];
    for (const s of [-1, 1]) {
      const b = v(s * BEARING_X, 0, 0), k0 = s > 0 ? 0 : N_SPOKE / 2;
      for (const dk of [-2, -1, 0, 1, 2]) g.push([b, node(RIM_R, k0 + dk, 1)], [b, node(9.0, k0 + dk, 1)]);
      g.push([b, node(RIM_R, k0, 0)]);
    }
    frame.add(tubes(g, 0.14, M.white));
    frame.add(tubes([[v(-BEARING_X - 0.5, 0, 0), v(-BEARING_X + 0.6, 0, 0)], [v(BEARING_X - 0.6, 0, 0), v(BEARING_X + 0.5, 0, 0)]], 0.45, M.grey));
  }
  el.add(frame);

  // ---- Elevation drive arc ----
  const elevArc = tagged(new THREE.Group(), 'elev');
  {
    const segs = [], aMin = -100, aMax = 90, n = 48;
    const P = (a, x) => { const r = a * Math.PI / 180; return v(x, ARC_R * Math.sin(r), ARC_R * Math.cos(r)); };
    for (let i = 0; i <= n; i++) {
      const a = aMin + (aMax - aMin) * i / n;
      const L = P(a, -0.9), R = P(a, 0.9), Li = P(a, -0.6).multiplyScalar(0.93), Ri = P(a, 0.6).multiplyScalar(0.93);
      Li.x = -0.6; Ri.x = 0.6;
      segs.push([L, R], [Li, Ri], [L, Li], [R, Ri]);
      if (i > 0) {
        const ap = aMin + (aMax - aMin) * (i - 1) / n;
        const Lp = P(ap, -0.9), Rp = P(ap, 0.9);
        segs.push([Lp, L], [Rp, R], [Lp, R]);
        if (i % 4 === 0) {
          const r = ARC_R * Math.sin(a * Math.PI / 180) * 0.6;
          const hub = v(0, r, surfZ(0, r) + 0.3 + FRAME_DEPTH * (1 - 0.45 * Math.abs(r) / RIM_R));
          segs.push([L, hub], [R, hub]);
        }
      }
    }
    segs.push([P(aMax, 0), node(RIM_R, N_SPOKE / 4, 1)], [P(aMin, 0), node(RIM_R, 3 * N_SPOKE / 4, 1)]);
    elevArc.add(tubes(segs, 0.07, M.white));
  }
  el.add(elevArc);

  el.add(tagged(box(0.6, 0.6, 0.5, M.grey, 0, 0, DISH_Z + 0.1), 'calibox'));

  // ---- Camera support: one arched tube plus a fan of ropes ----
  const arch = tagged(new THREE.Group(), 'arch');
  const CAM_HALF = 1.5;
  {
    const footZ = surfZ(11.7, 0) + 0.2;
    const curve = new THREE.CatmullRomCurve3([
      v(-11.7, 0, footZ), v(-10.6, 0, DISH_Z - 8), v(-7.6, 0, DISH_Z - 17), v(-3.6, 0, DISH_Z - 24.5),
      v(-CAM_HALF - 0.1, 0, CAM_Z - 0.4), v(CAM_HALF + 0.1, 0, CAM_Z - 0.4),
      v(3.6, 0, DISH_Z - 24.5), v(7.6, 0, DISH_Z - 17), v(10.6, 0, DISH_Z - 8), v(11.7, 0, footZ),
    ], false, 'centripetal');
    const archMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 240, 0.28, 12, false), M.white);
    archMesh.castShadow = true;
    arch.add(archMesh);
    const rim = (deg) => { const a = deg * Math.PI / 180, x = 11.6 * Math.cos(a), y = 11.6 * Math.sin(a); return v(x, y, surfZ(x, y) - 0.1); };
    const pts = [], nRope = 9;
    for (let i = 1; i <= nRope; i++) {
      const t = 0.06 + 0.37 * i / nRope;
      for (const leg of [t, 1 - t]) {
        const p = curve.getPointAt(leg), side = leg < 0.5 ? -1 : 1, spread = 25 + 130 * i / nRope;
        for (const s of [1, -1]) pts.push(p, rim(side < 0 ? 180 - s * spread : s * spread));
      }
    }
    for (const d of [80, 90, 100, 260, 270, 280]) pts.push(v(0, Math.sign(Math.sin(d * Math.PI / 180)) * CAM_HALF, CAM_Z - 0.2), rim(d));
    arch.add(lines(pts, M.rope));
  }
  el.add(arch);

  // ---- Camera ----
  const camera = tagged(new THREE.Group(), 'camera');
  camera.add(box(2 * CAM_HALF, 2 * CAM_HALF, 1.4, M.camera, 0, 0, CAM_Z - 0.75));
  {
    const e = [];
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]])
      e.push([v(sx * CAM_HALF, sy * CAM_HALF, CAM_Z - 0.05), v(sx * CAM_HALF, sy * CAM_HALF, CAM_Z - 1.45)]);
    camera.add(tubes(e, 0.08, M.camera));
  }
  camera.add(box(2.6, 2.6, 0.06, M.dark, 0, 0, CAM_Z - 0.02));
  camera.add(box(2.0, 2.0, 0.6, M.camera, 0, 0, CAM_Z - 1.7));
  const pixels = addCameraFace(camera, CAM_Z, M);
  el.add(camera);

  // ---- Azimuth structure ----
  const towers = tagged(new THREE.Group(), 'towers');
  {
    const segs = [];
    for (const s of [-1, 1]) {
      segs.push(...lattice(s * (BEARING_X + 0.3), s * TOWER_OUT, TOWER_Z, 3.2, 1.2, PIVOT_H - 0.8, 6));
      segs.push([v(s * (TOWER_OUT + 1.2), 1.2, -TOWER_Z), v(s * TOWER_OUT, PIVOT_H * 0.55, -TOWER_Z + 1.6)],
                [v(s * (TOWER_OUT + 1.2), 1.2, TOWER_Z), v(s * TOWER_OUT, PIVOT_H * 0.55, TOWER_Z - 1.6)]);
    }
    for (const z of [-TOWER_Z, TOWER_Z]) {
      const a = v(-BEARING_X - 0.3, 1.2, z), b = v(BEARING_X + 0.3, 1.2, z), a2 = v(-BEARING_X - 0.3, 2.6, z), b2 = v(BEARING_X + 0.3, 2.6, z);
      segs.push([a, b]);
      for (let i = 0; i < 8; i++) {
        const p = a.clone().lerp(b, i / 8), pt = a2.clone().lerp(b2, i / 8), qt = a2.clone().lerp(b2, (i + 1) / 8);
        segs.push([pt, qt], [p, pt], [p, qt]);
      }
    }
    towers.add(tubes(segs, 0.13, M.white));
    for (const s of [-1, 1]) {
      const cx = s * (BEARING_X + TOWER_OUT + 1.0) / 2, w = TOWER_OUT - BEARING_X + 1.6;
      towers.add(box(w, 0.25, 7.6, M.grey, cx, PIVOT_H - 0.7, 0));
      towers.add(railing(cx - w / 2, cx + w / 2, -3.8, 3.8, PIVOT_H - 0.58, M.rail));
      towers.add(box(1.8, 1.6, 1.8, M.grey, s * (BEARING_X + 0.4), PIVOT_H, 0));
      const st = [];
      for (let k = 0; k < 6; k++) {
        const y0 = 1.2 + k * (PIVOT_H - 2) / 6, y1 = y0 + (PIVOT_H - 2) / 6, z = (k % 2 ? 1 : -1) * 2.2;
        st.push([v(s * (TOWER_OUT - 0.8), y0, z), v(s * (TOWER_OUT - 0.8), y1, -z)]);
      }
      towers.add(tubes(st, 0.35, M.grey));
    }
  }
  az.add(towers);

  const RAIL_R = Math.hypot(TOWER_OUT, TOWER_Z);
  const base = tagged(new THREE.Group(), 'base');
  {
    const corners = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) corners.push(v(sx * (TOWER_OUT - 1), 0.75, sz * TOWER_Z));
    const segs = [];
    for (const c of corners) segs.push([c, v(0, 0.75, 0)]);
    segs.push([corners[0], corners[1]], [corners[2], corners[3]], [corners[0], corners[2]], [corners[1], corners[3]]);
    base.add(tubes(segs, 0.4, M.lstRed));
    for (let i = 0; i < 8; i++) {
      const ang = Math.atan2(corners[i >> 1].z, corners[i >> 1].x) + (i % 2 ? 0.06 : -0.06);
      const b = box(1.4, 1.0, 2.2, M.lstRed, RAIL_R * Math.cos(ang), 0.55, RAIL_R * Math.sin(ang));
      b.rotation.y = -ang;
      base.add(b);
    }
    base.add(box(4.0, 1.1, 2.6, M.lstRed, 0, 0.6, 0), box(2.2, 0.5, 2.2, M.lstRed, 0, 1.3, 0));
  }
  az.add(base);

  // ---- Fixed parts: pad, rail, access tower (north of the telescope, next to the parked camera) ----
  const fixed = tagged(new THREE.Group(), 'base');
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(RAIL_R + 2.5, RAIL_R + 2.5, 0.6, 96), M.concrete);
  pad.position.y = -0.2; pad.receiveShadow = true;
  const rail = new THREE.Mesh(new THREE.TorusGeometry(RAIL_R, 0.22, 8, 200), M.lstRed);
  rail.rotation.x = Math.PI / 2; rail.position.y = 0.15;
  fixed.add(pad, rail);
  root.add(fixed);

  const ACCESS_Z = -37.5;
  const access = tagged(new THREE.Group(), 'access');
  {
    const H = 10.5, x0 = -4.5, x1 = 4.5, z0 = ACCESS_Z - 4.5, z1 = ACCESS_Z + 4.5, segs = [];
    for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1], [0, z0], [0, z1]]) segs.push([v(x, -0.5, z), v(x, H, z)]);
    for (const h of [3.5, 7, H])
      segs.push([v(x0, h, z0), v(x1, h, z0)], [v(x0, h, z1), v(x1, h, z1)], [v(x0, h, z0), v(x0, h, z1)], [v(x1, h, z0), v(x1, h, z1)]);
    for (let k = 0; k < 3; k++) {
      const a = k * 3.5, b = Math.min(H, a + 3.5);
      segs.push([v(x0, a, z0), v(0, b, z0)], [v(0, a, z0), v(x0, b, z0)], [v(x0, a, z0), v(x0, b, z1)], [v(x0, a, z1), v(x0, b, z0)]);
    }
    access.add(tubes(segs, 0.12, M.grey));
    access.add(box(9.4, 0.25, 9.4, M.grey, 0, H, ACCESS_Z));
    access.add(box(5, 2.8, 4.2, M.camera, -1.8, H + 1.55, z0 + 2.4));
    access.add(railing(x0 - 0.2, x1 + 0.2, z0 - 0.2, z1 + 0.2, H + 0.12, M.rail));
    access.add(box(4.2, 2.6, 3.5, M.camera, -2, 1.3, z0 + 2));
    access.add(box(10, 0.4, 10, M.concrete, 0, -0.2, ACCESS_Z));
    const flights = 4, fh = H / flights;
    for (let i = 0; i < flights; i++) {
      const za = i % 2 ? z1 - 0.8 : z0 + 0.8, zb = i % 2 ? z0 + 0.8 : z1 - 0.8;
      const a = v(x1 + 1.0, i * fh, za), b = v(x1 + 1.0, (i + 1) * fh, zb);
      const f = box(1.2, 0.15, a.distanceTo(b), M.grey, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
      f.rotation.x = Math.atan2(-(b.y - a.y), b.z - a.z); // aligns the box's local +Z with the flight
      access.add(f, box(1.4, 0.15, 1.4, M.grey, x1 + 1.0, (i + 1) * fh, zb));
    }
  }
  root.add(access);

  return {
    kind: 'LST', info: LST_INFO, root, az, el, pixels, pixPts: cameraFace.pts, camR: 1.2, pixPitch: CAM_PIX_PITCH, F, camZ: CAM_Z, dishZ: DISH_Z, pivotH: PIVOT_H,
    labelHeight: 46, slewRate: 9, // deg/s in azimuth: 180° in about 20 s
    parts: { mirrors, frame, arch },
    // ground footprints to flatten in the terrain: [x, z, radius] in root coordinates
    pads: [[0, 0, RAIL_R + 3], [0, ACCESS_Z, 7.5]],
  };
}
