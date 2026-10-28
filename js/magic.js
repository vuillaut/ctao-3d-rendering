// MAGIC telescope (not part of CTAO, shown for context). Simplified: 17 m parabolic dish of
// square facets, carbon-fibre frame, single arch to the camera, lattice mount on a rail.
// Dimensions other than the 17 m dish and f = 17 m are estimates.

const MAGIC_INFO = {
  mirrors: ['MAGIC mirror', '17 m parabolic dish made of square facets, f = 17 m. MAGIC is a two-telescope system that predates CTAO and observes jointly with LST-1.'],
  frame: ['MAGIC dish frame', 'Lightweight carbon-fibre tube space frame, the design the LST frame was derived from.'],
  arch: ['MAGIC camera arch', 'A single arch carries the camera at the focus, braced by cables to the dish.'],
  camera: ['MAGIC camera', 'Round camera at the focal plane, about 17 m from the dish.'],
  mount: ['MAGIC mount', 'Steel azimuth frame running on bogies on a circular rail.'],
};

function buildMAGIC(M) {
  const F = 17, R = 8.5, PIVOT_H = 9.5, DISH_Z = -1.0, CAM_Z = DISH_Z - F;
  const surfZ = (x, y) => DISH_Z - (x * x + y * y) / (4 * F);
  const root = new THREE.Group(), az = new THREE.Group(), el = new THREE.Group();
  el.position.y = PIVOT_H;
  az.add(el); root.add(az);

  // ---- Square facets ----
  const mirrors = tagged(new THREE.Group(), 'mirrors');
  {
    const pts = [];
    for (let i = -9; i <= 9; i++) for (let j = -9; j <= 9; j++) {
      const x = i * 1.0, y = j * 1.0;
      if (Math.hypot(x, y) < R - 0.4 && Math.hypot(x, y) > 0.6) pts.push([x, y]);
    }
    const geo = new THREE.BoxGeometry(0.96, 0.96, 0.04);
    const facets = new THREE.InstancedMesh(geo, M.mirror, pts.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), focus = v(0, 0, CAM_Z);
    pts.forEach(([x, y], i) => {
      const p = v(x, y, surfZ(x, y));
      q.setFromUnitVectors(v(0, 0, -1), v(0, 0, -1).add(focus.clone().sub(p).normalize()).normalize());
      facets.setMatrixAt(i, m.compose(p, q, v(1, 1, 1)));
    });
    facets.castShadow = true;
    mirrors.add(facets);
  }
  el.add(mirrors);

  // ---- Frame ----
  const frame = tagged(new THREE.Group(), 'frame');
  {
    const N = 24, radii = [1.5, 4, 6.5, R], segs = [];
    const node = (r, k, back) => {
      const a = k / N * Math.PI * 2, x = r * Math.cos(a), y = r * Math.sin(a);
      return v(x, y, surfZ(x, y) + 0.25 + (back ? 1.6 * (1 - 0.4 * r / R) : 0));
    };
    radii.forEach((r, ri) => {
      for (let k = 0; k < N; k++) {
        segs.push([node(r, k, 0), node(r, k + 1, 0)], [node(r, k, 1), node(r, k + 1, 1)], [node(r, k, 0), node(r, k, 1)], [node(r, k, 0), node(r, k + 1, 1)]);
        if (ri) segs.push([node(radii[ri - 1], k, 0), node(r, k, 0)], [node(radii[ri - 1], k, 1), node(r, k, 1)], [node(radii[ri - 1], k, 1), node(r, k, 0)]);
      }
    });
    for (const s of [-1, 1]) for (const dk of [-2, 0, 2]) segs.push([v(s * 9.4, 0, 0), node(R, (s > 0 ? 0 : N / 2) + dk, 1)]);
    frame.add(tubes(segs, 0.045, M.cfrp));
    frame.add(tubes([[v(-9.8, 0, 0), v(-8.8, 0, 0)], [v(8.8, 0, 0), v(9.8, 0, 0)]], 0.35, M.grey));
    // elevation arc under the dish
    const arc = [];
    for (let i = 0; i < 40; i++) {
      const a0 = (-100 + 190 * i / 40) * Math.PI / 180, a1 = (-100 + 190 * (i + 1) / 40) * Math.PI / 180;
      arc.push([v(0, 9 * Math.sin(a0), 9 * Math.cos(a0)), v(0, 9 * Math.sin(a1), 9 * Math.cos(a1))]);
    }
    frame.add(tubes(arc, 0.18, M.grey));
  }
  el.add(frame);

  // ---- Arch, cables, camera ----
  const arch = tagged(new THREE.Group(), 'arch');
  {
    // In the vertical plane of the optical axis (local y-z), from the top and bottom of the rim,
    // with a near-parabolic profile and the camera at the vertex.
    const footZ = surfZ(0, 8.4), topZ = CAM_Z - 0.7, archPts = [];
    for (let i = 0; i <= 40; i++) {
      const s = -1 + 2 * i / 40, u = 1 - s * s;
      archPts.push(v(0, 8.4 * s * (1 + 0.25 * u), footZ + (topZ - footZ) * u));
    }
    const curve = new THREE.CatmullRomCurve3(archPts);
    arch.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 160, 0.16, 10, false), M.grey));
    const pts = [];
    for (let i = 1; i <= 6; i++) {
      const t = 0.08 + 0.36 * i / 6;
      for (const leg of [t, 1 - t]) {
        const p = curve.getPointAt(leg);
        for (const s of [1, -1]) {
          const a = (leg < 0.5 ? 270 : 90) + s * (40 + 15 * i);
          const x = R * Math.cos(a * Math.PI / 180), y = R * Math.sin(a * Math.PI / 180);
          pts.push(p, v(x, y, surfZ(x, y)));
        }
      }
    }
    arch.add(lines(pts, M.rope));
  }
  el.add(arch);
  const camera = tagged(new THREE.Group(), 'camera');
  {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.4, 32), M.camera);
    body.rotation.x = Math.PI / 2; body.position.z = CAM_Z - 0.7; body.castShadow = true;
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.75, 32), M.dark);
    face.position.z = CAM_Z + 0.01;
    camera.add(body, face);
  }
  el.add(camera);

  // ---- Mount ----
  const mount = tagged(new THREE.Group(), 'mount');
  {
    const segs = [];
    for (const s of [-1, 1]) segs.push(...lattice(s * 10.0, s * 11.6, 5, 2, 0.9, PIVOT_H - 0.6, 4));
    for (const z of [-5, 5]) segs.push([v(-10, 0.9, z), v(10, 0.9, z)]);
    segs.push([v(-10, 0.9, 0), v(10, 0.9, 0)]);
    mount.add(tubes(segs, 0.12, M.grey));
    for (const s of [-1, 1]) mount.add(box(1.6, 1.4, 1.6, M.grey, s * 10.3, PIVOT_H, 0));
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2 + Math.PI / 6;
      const b = box(1.2, 0.9, 1.8, M.grey, 11.3 * Math.cos(a), 0.45, 11.3 * Math.sin(a));
      b.rotation.y = -a;
      mount.add(b);
    }
  }
  az.add(mount);
  const fixed = tagged(new THREE.Group(), 'mount');
  {
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(13, 13, 0.6, 72), M.concrete);
    pad.position.y = -0.2; pad.receiveShadow = true;
    const rail = new THREE.Mesh(new THREE.TorusGeometry(11.3, 0.16, 8, 160), M.grey);
    rail.rotation.x = Math.PI / 2; rail.position.y = 0.12;
    fixed.add(pad, rail);
  }
  root.add(fixed);

  return {
    kind: 'MAGIC', info: MAGIC_INFO, root, az, el, pixels: null, F, camZ: CAM_Z, dishZ: DISH_Z, pivotH: PIVOT_H,
    labelHeight: 30, slewRate: 7, parts: { mirrors, frame, arch },
    pads: [[0, 0, 14]],
  };
}
