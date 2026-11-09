import * as THREE from 'three';

export function createAirportWorld(
  paper: (color: string) => THREE.MeshBasicMaterial,
) {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const geo = <T extends THREE.BufferGeometry>(geometry: T) => {
    geometries.push(geometry);
    return geometry;
  };
  const cream = paper('#faf1df'),
    sand = paper('#d6bc91'),
    olive = paper('#84936b'),
    rust = paper('#a95135');
  const rising: { mesh: THREE.Mesh; height: number; base: number }[] = [];
  const box = (
    w: number,
    h: number,
    d: number,
    x: number,
    z: number,
    material: THREE.Material,
    base = 0,
  ) => {
    const mesh = new THREE.Mesh(geo(new THREE.BoxGeometry(w, h, d)), material);
    mesh.position.set(x, 0.2 + base + h / 2, z);
    group.add(mesh);
    rising.push({ mesh, height: h, base });
    return mesh;
  };
  const base = new THREE.Mesh(geo(new THREE.PlaneGeometry(11, 6.2)), cream);
  base.rotation.x = -Math.PI / 2;
  base.position.y = 0.18;
  group.add(base);
  const runway = new THREE.Mesh(geo(new THREE.PlaneGeometry(8, 0.45)), olive);
  runway.rotation.x = -Math.PI / 2;
  runway.position.set(-0.5, 0.205, -2);
  group.add(runway);
  box(5.8, 1.15, 0.04, 0, 1.1, cream);
  box(5.8, 1.15, 0.04, 0, -1.1, sand);
  box(0.04, 1.15, 2.2, -2.9, 0, sand);
  box(0.04, 1.15, 2.2, 2.9, 0, olive);
  for (let i = 0; i < 8; i++)
    box(0.36, 0.28, 0.025, (i - 3.5) * 0.67, 1.13, olive, 0.5);
  const roofs: { pivot: THREE.Group; sign: number }[] = [];
  for (const sign of [-1, 1]) {
    const pivot = new THREE.Group();
    const roofGeometry = geo(new THREE.PlaneGeometry(6.05, 1.25));
    roofGeometry.translate(0, 0.625, 0);
    pivot.add(new THREE.Mesh(roofGeometry, sign === 1 ? sand : cream));
    group.add(pivot);
    roofs.push({ pivot, sign });
  }
  box(2.6, 0.6, 0.8, -3.8, -0.7, sand);
  box(2.6, 0.6, 0.8, 3.8, -0.7, cream);
  box(0.38, 2.8, 0.38, 3.8, 1.1, olive);
  box(0.9, 0.45, 0.9, 3.8, 1.1, sand, 2.8);
  const route = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4, 0.24, 1.7),
    new THREE.Vector3(-1.4, 0.24, 0.9),
    new THREE.Vector3(0.5, 0.24, 0.2),
    new THREE.Vector3(2.6, 0.24, -1.1),
  ]);
  const routeGeometry = geo(
    new THREE.BufferGeometry().setFromPoints(route.getPoints(60)),
  );
  const lineMaterial = new THREE.LineBasicMaterial({
    color: '#a44c32',
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });
  group.add(new THREE.Line(routeGeometry, lineMaterial));
  const markerGeometry = geo(new THREE.CircleGeometry(0.085, 12));
  const markers = Array.from({ length: 18 }, (_, i) => {
    const mesh = new THREE.Mesh(markerGeometry, rust);
    const p = route.getPoint(i / 17);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(
      p.x + Math.sin(i * 2.1) * 0.14,
      0.26,
      p.z + Math.cos(i * 1.8) * 0.12,
    );
    group.add(mesh);
    return mesh;
  });
  const planeVertices = [
    0, 0, -0.9, -0.65, 0, 0.55, 0, 0.12, 0.18, 0, 0, -0.9, 0, 0.12, 0.18, 0.65,
    0, 0.55, 0, 0.12, 0.18, -0.08, -0.04, 0.65, 0.08, -0.04, 0.65,
  ];
  const planeGeometry = geo(new THREE.BufferGeometry());
  planeGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(planeVertices, 3),
  );
  const uv: number[] = [];
  for (let i = 0; i < planeVertices.length; i += 3)
    uv.push(
      (planeVertices[i] + 0.65) / 1.3,
      (planeVertices[i + 2] + 0.9) / 1.55,
    );
  planeGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  planeGeometry.computeVertexNormals();
  const plane = new THREE.Mesh(planeGeometry, cream);
  group.add(plane);
  const flight = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-6, 2.4, 3),
    new THREE.Vector3(-1, 4, -3),
    new THREE.Vector3(3, 1, -2.2),
  );
  let previousEntry = -1,
    previousExit = -1;
  let status = 'flat';
  const update = (entry: number, exit: number) => {
    entry = THREE.MathUtils.clamp(entry, 0, 1);
    exit = THREE.MathUtils.clamp(exit, 0, 1);
    if (entry === previousEntry && exit === previousExit) return status;
    previousEntry = entry;
    previousExit = exit;
    const ease = (v: number) => v * v * (3 - 2 * v);
    const rise = ease(entry) * (1 - ease(exit));
    for (const item of rising) {
      item.mesh.scale.y = Math.max(0.001, rise);
      item.mesh.position.y = 0.2 + (item.base + item.height / 2) * rise;
    }
    for (const roof of roofs) {
      roof.pivot.position.y = 0.2 + 1.2 * rise;
      roof.pivot.rotation.x = roof.sign * (Math.PI - (rise * Math.PI) / 2);
    }
    const flow = THREE.MathUtils.clamp((entry - 0.45) / 0.5, 0, 1) * (1 - exit);
    routeGeometry.setDrawRange(0, Math.floor(61 * flow));
    markers.forEach((marker, i) =>
      marker.scale.setScalar(THREE.MathUtils.clamp(flow * 18 - i, 0, 1)),
    );
    const t = THREE.MathUtils.clamp(entry / 0.7, 0, 1);
    plane.position.copy(flight.getPoint(t));
    const tangent = flight.getTangent(t);
    plane.rotation.set(
      0,
      Math.atan2(-tangent.x, -tangent.z),
      Math.sin(t * Math.PI) * 0.25,
    );
    plane.visible = entry >= 0.2 && exit < 0.7;
    status =
      exit > 0.01
        ? 'folding'
        : entry < 0.02
          ? 'flat'
          : entry < 0.99
            ? 'rising'
            : 'open';
    return status;
  };
  return {
    group,
    update,
    dispose() {
      geometries.forEach((g) => g.dispose());
      lineMaterial.dispose();
      group.clear();
    },
  };
}
