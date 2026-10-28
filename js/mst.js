// CTAO Medium-Sized Telescope (MST) model. See MST_summary.md for the numbers.
// buildMST(M) returns { root, az, el, ... }; root sits at ground level on the tower axis.

const MST_INFO = {
  mirrors: ['Mirror facets (86)', 'Hexagonal spherical facets, 1.2 m flat-to-flat, on a 12 m dish following a 19.2 m sphere (modified Davies-Cotton, f = 16 m). Each facet has alignment actuators on its back.'],
  frame: ['Dish structure', 'Red steel box girders in a triangular pattern, braced by grey tubes running back to the elevation bearings.'],
  quad: ['Quadrupod', 'Four steel legs from the dish rim to the camera frame, braced with X-members and cables. It holds the 2.5 t camera 16 m from the dish centre.'],
  camera: ['MST camera', 'NectarCAM or FlashCam, interchangeable. Shown here: a NectarCAM-like face of 1855 pixels.'],
  counter: ['Counterweight', 'A heavy box on a truss arm behind the dish that balances the camera around the elevation axle.'],
  head: ['Head and azimuth bearing', 'Turns on the azimuth bearing at the top of the tower and carries the elevation axle.'],
  tower: ['Tower', 'Steel cylinder about 9 m high and 2 m across, with three floors of electrical cabinets, the azimuth drive and lubrication. About 86 t for the whole telescope.'],
  shelter: ['Service shelter', 'Roofed area at the tower foot with cabinets.'],
};

function buildMST(M) {
  const F = 16, DISH_RC = 19.2, N_FACETS = 86, FACET_FLAT = 1.2;
  const TOWER_H = 9, TOWER_R = 1.0;
  const PIVOT_H = 10.4, PIVOT_Z = -0.6, DISH_Z = -2.2, AXLE_X = 1.5, NODE_D = 2.0;
  const CAM_Z = DISH_Z - F, CAM_HALF = 1.4;
  const surfZ = (x, y) => DISH_Z - (DISH_RC - Math.sqrt(DISH_RC * DISH_RC - x * x - y * y));

  const root = new THREE.Group(), az = new THREE.Group(), el = new THREE.Group();
  el.position.set(0, PIVOT_H, PIVOT_Z);
  az.add(el); root.add(az);

  // ---- Mirrors (centre position left open) ----
  const facetPts = hexGrid(FACET_FLAT, N_FACETS, true);
  const facetR = FACET_FLAT / Math.sqrt(3) * 0.975;
  const facetGeo = new THREE.CylinderGeometry(facetR, facetR, 0.05, 6);
  facetGeo.rotateX(Math.PI / 2);
  const focus = v(0, 0, CAM_Z);
  const mirrors = tagged(new THREE.Group(), 'mirrors');
  {
    const facets = new THREE.InstancedMesh(facetGeo, [M.mirrorBack, M.mirrorBack, M.mirror], facetPts.length);
    const actuators = new THREE.InstancedMesh(unitBox, M.grey, facetPts.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion();
    facetPts.forEach(([x, y], i) => {
      const p = v(x, y, surfZ(x, y));
      const n = v(0, 0, -1).add(focus.clone().sub(p).normalize()).normalize();
      q.setFromUnitVectors(v(0, 0, -1), n);
      m.compose(p, q, v(1, 1, 1));
      facets.setMatrixAt(i, m);
      m.compose(p.clone().addScaledVector(n, -0.15), q, v(0.35, 0.2, 0.22));
      actuators.setMatrixAt(i, m);
    });
    facets.castShadow = facets.receiveShadow = true;
    mirrors.add(facets, actuators);
  }
  el.add(mirrors);

  // ---- Dish structure ----
  const frame = tagged(new THREE.Group(), 'frame');
  const gridNode = (i, j, dz = 0.45) => {
    const x = NODE_D * (i + j / 2), y = NODE_D * j * Math.sqrt(3) / 2;
    return v(x, y, surfZ(x, y) + dz);
  };
  const hexDist = (i, j) => Math.max(Math.abs(i), Math.abs(j), Math.abs(i + j));
  const RING = 3;
  {
    const girders = [], braces = [];
    for (let j = -RING; j <= RING; j++)
      for (let i = -RING; i <= RING; i++) {
        if (hexDist(i, j) > RING) continue;
        for (const [di, dj] of [[1, 0], [0, 1], [-1, 1]])
          if (hexDist(i + di, j + dj) <= RING) girders.push([gridNode(i, j), gridNode(i + di, j + dj)]);
      }
    for (let j = -2; j <= 2; j++)
      for (let i = -2; i <= 2; i++) {
        if (hexDist(i, j) > 2) continue;
        const b = gridNode(i, j, 1.55);
        for (const [di, dj] of [[0, 0], [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]])
          if (hexDist(i + di, j + dj) <= RING && (di || dj || hexDist(i, j) % 2 === 0)) braces.push([b, gridNode(i + di, j + dj)]);
      }
    for (let j = -RING; j <= RING; j++)
      for (let i = -RING; i <= RING; i++) {
        if (hexDist(i, j) !== RING) continue;
        const n = gridNode(i, j);
        braces.push([n, v((n.x >= 0 ? 1 : -1) * AXLE_X, 0, 0)]);
      }
    frame.add(tubes(girders, 0.13, M.mstRed, true));
    frame.add(tubes(braces, 0.06, M.grey));
    frame.add(tubes([[v(-AXLE_X - 0.3, 0, 0), v(AXLE_X + 0.3, 0, 0)]], 0.3, M.mstRed));
    for (const s of [-1, 1]) frame.add(tubes([[v(s * AXLE_X, 0, 0), gridNode(s, 0, 1.55)], [v(s * AXLE_X, 0, 0), gridNode(0, s, 1.55)], [v(s * AXLE_X, 0, 0), gridNode(-s, s, 1.55)]], 0.16, M.mstRed, true));
  }
  el.add(frame);

  // ---- Quadrupod ----
  const quad = tagged(new THREE.Group(), 'quad');
  {
    const feet = [30, 150, 210, 330].map(d => {
      const a = d * Math.PI / 180, x = 5.3 * Math.cos(a), y = 5.3 * Math.sin(a);
      return v(x, y, surfZ(x, y) + 0.3);
    });
    const top = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([sx, sy]) => v(sx * (CAM_HALF + 0.1), sy * (CAM_HALF + 0.1), CAM_Z - 0.2));
    const at = (k, t) => feet[k].clone().lerp(top[k], t);
    const legs = [], bracing = [], f = [], cab = [];
    for (let k = 0; k < 4; k++) legs.push([feet[k], top[k]]);
    const levels = [0.38, 0.7, 1];
    levels.forEach((t, li) => {
      for (let k = 0; k < 4; k++) {
        const k2 = (k + 1) % 4;
        bracing.push([at(k, t), at(k2, t)]);
        if (li > 0) { const t0 = levels[li - 1]; bracing.push([at(k, t0), at(k2, t)], [at(k2, t0), at(k, t)]); }
      }
    });
    quad.add(tubes(legs, 0.14, M.mstRed), tubes(bracing, 0.07, M.mstRed));
    for (let k = 0; k < 4; k++) f.push([top[k], top[(k + 1) % 4]]);
    quad.add(tubes(f, 0.12, M.mstRed, true));
    for (let k = 0; k < 4; k++) cab.push(top[k], feet[(k + 1) % 4], at(k, 0.38), feet[(k + 2) % 4]);
    quad.add(lines(cab, M.cable));
  }
  el.add(quad);

  // ---- Camera ----
  const camera = tagged(new THREE.Group(), 'camera');
  camera.add(box(2 * CAM_HALF, 2 * CAM_HALF, 1.2, M.camera, 0, 0, CAM_Z - 0.65));
  camera.add(box(2.6, 2.6, 0.06, M.dark, 0, 0, CAM_Z - 0.02));
  camera.add(box(2 * CAM_HALF - 0.3, 2 * CAM_HALF - 0.3, 0.4, M.camera, 0, 0, CAM_Z - 1.45));
  const pixels = addCameraFace(camera, CAM_Z, M);
  el.add(camera);

  // ---- Counterweight on a ladder arm, offset to clear the tower ----
  const counter = tagged(new THREE.Group(), 'counter');
  {
    const X = -2.4, end = v(X, -1.4, 5.0);
    const roots = [gridNode(-1, 0, 1.55).setX(X), gridNode(-1, -1, 0.45).setX(X)];
    const railA = [roots[0], end.clone().add(v(0, 0.55, -0.6))], railB = [roots[1], end.clone().add(v(0, -0.55, -0.6))];
    const rungs = [];
    for (let t = 0.15; t < 1; t += 0.17) rungs.push([railA[0].clone().lerp(railA[1], t), railB[0].clone().lerp(railB[1], t)]);
    counter.add(tubes([railA, railB], 0.18, M.mstRed, true), tubes(rungs, 0.08, M.mstRed, true));
    counter.add(tubes([[railA[1], v(-AXLE_X, 0, 0)], [railB[1], gridNode(-3, 0)], [railA[1], gridNode(0, -3)], [railA[0], v(-AXLE_X, 0, 0)]], 0.06, M.grey));
    const w = box(1.7, 2.3, 1.5, M.mstRed, end.x, end.y, end.z);
    w.quaternion.setFromUnitVectors(v(0, 0, 1), end.clone().sub(roots[0].clone().lerp(roots[1], 0.5)).normalize());
    counter.add(w);
  }
  el.add(counter);

  // ---- Head (turns with azimuth) ----
  const head = tagged(new THREE.Group(), 'head');
  head.add(box(2.4, 0.9, 2.2, M.mstRed, 0, TOWER_H + 0.55, PIVOT_Z * 0.5));
  for (const s of [-1, 1]) head.add(box(0.7, 1.3, 1.1, M.mstRed, s * (AXLE_X + 0.15), PIVOT_H - 0.4, PIVOT_Z));
  {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.2, 40), M.dark);
    ring.position.y = TOWER_H + 0.05;
    head.add(ring);
  }
  az.add(head);

  // ---- Fixed: tower, pad, shelter ----
  const tower = tagged(new THREE.Group(), 'tower');
  {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(TOWER_R, TOWER_R * 1.02, TOWER_H, 48), M.mstRed);
    t.position.y = TOWER_H / 2;
    t.castShadow = t.receiveShadow = true;
    tower.add(t, box(0.9, 2.1, 0.12, M.mstRed, 0, 1.25, TOWER_R + 0.01));
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.25, 48), M.dark);
    flange.position.y = 0.12;
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 0.6, 64), M.concrete);
    pad.position.y = -0.25; pad.receiveShadow = true;
    tower.add(flange, pad);
  }
  root.add(tower);

  const shelter = tagged(new THREE.Group(), 'shelter');
  {
    const x0 = -6.5, x1 = -2.2, z0 = 1.5, z1 = 4.5, h = 2.8, posts = [];
    for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) posts.push([v(x, -0.3, z), v(x, h, z)]);
    shelter.add(tubes(posts, 0.06, M.grey));
    shelter.add(box(x1 - x0 + 0.6, 0.08, z1 - z0 + 0.6, M.grey, (x0 + x1) / 2, h, (z0 + z1) / 2));
    shelter.add(box(0.9, 2.0, 0.7, M.camera, -5.6, 1.0, 3.6), box(0.9, 1.6, 0.7, M.camera, -4.6, 0.8, 3.6), box(0.9, 2.2, 0.7, M.camera, -3.6, 1.1, 3.6));
    shelter.add(box(x1 - x0 + 1, 0.5, z1 - z0 + 1, M.concrete, (x0 + x1) / 2, -0.2, (z0 + z1) / 2));
  }
  root.add(shelter);

  return {
    kind: 'MST', info: MST_INFO, root, az, el, pixels, F, camZ: CAM_Z, dishZ: DISH_Z, pivotH: PIVOT_H,
    labelHeight: 30, slewRate: 4, // illustrative; MSTs slew more slowly than LSTs
    parts: { mirrors, frame, quad },
    pads: [[0, 0, 5], [-4.3, 3, 4.5]],
  };
}
