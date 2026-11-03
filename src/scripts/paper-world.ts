import * as THREE from 'three';
import { gsap } from 'gsap';
interface WorldState {
  travel: number;
  progress: number;
}

export function mountWorld(container: HTMLElement, state: WorldState) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2', {
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  });
  if (!context) throw new Error('WebGL2 unavailable');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    context,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor('#f5eddf', 1);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#f5eddf', 16, 65);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 180);
  scene.add(new THREE.HemisphereLight('#fff8e8', '#c7bda4', 1.8));
  const sunlight = new THREE.DirectionalLight('#fff6df', 1.1);
  sunlight.position.set(-12, 22, 10);
  scene.add(sunlight);
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const pixels = new Uint8Array(64 * 64 * 4);
  for (let i = 0; i < 64 * 64; i++) {
    const value =
      222 + Math.floor((((Math.sin(i * 73.13) * 43758.5) % 1) + 1) * 14);
    pixels.set([value, value, value, 255], i * 4);
  }
  const grain = new THREE.DataTexture(pixels, 64, 64);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.repeat.set(40, 40);
  grain.magFilter = THREE.LinearFilter;
  grain.needsUpdate = true;
  const paper = (color: string) => {
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 1,
      map: grain,
      side: THREE.DoubleSide,
    });
    materials.push(mat);
    return mat;
  };
  const colors = ['#efe4cd', '#b5b98f', '#dfc99f', '#e9d9bb'];
  const terrain = paper('#eee3cc');
  const groundGeometry = new THREE.PlaneGeometry(150, 220);
  geometries.push(groundGeometry);
  const ground = new THREE.Mesh(groundGeometry, terrain);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.17, -60);
  scene.add(ground);
  const route = (t: number) =>
    new THREE.Vector3(Math.sin(t * 0.86) * 4.8, 0.03, -t * 14);
  const curve = new THREE.CatmullRomCurve3(
    Array.from({ length: 12 }, (_, i) => route(i - 1)),
  );
  const roadPositions: number[] = [];
  const roadIndices: number[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= 240; i++) {
    const p = curve.getPoint(i / 240);
    const side = curve
      .getTangent(i / 240)
      .cross(up)
      .normalize()
      .multiplyScalar(1.5);
    roadPositions.push(
      p.x + side.x,
      0.09,
      p.z + side.z,
      p.x - side.x,
      0.09,
      p.z - side.z,
    );
    if (i < 240) {
      const j = i * 2;
      roadIndices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
    }
  }
  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(roadPositions, 3),
  );
  roadGeo.setIndex(roadIndices);
  roadGeo.computeVertexNormals();
  geometries.push(roadGeo);
  scene.add(new THREE.Mesh(roadGeo, paper('#fff8e9')));
  const patchMaterials = colors.map(paper);
  for (let i = -1; i <= 10; i++) {
    const center = route(i);
    for (let side = -1; side <= 1; side += 2) {
      const shape = new THREE.Shape();
      for (let j = 0; j < 16; j++) {
        const angle = (j / 16) * Math.PI * 2;
        const radius = 1 + Math.sin(j * 7.1 + i) * 0.09;
        const x = Math.cos(angle) * 5.7 * radius;
        const y = Math.sin(angle) * 6.3 * radius;
        if (j === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      shape.closePath();
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 0.05,
        bevelEnabled: false,
      });
      geometries.push(geometry);
      const patch = new THREE.Mesh(
        geometry,
        patchMaterials[(i + 5 + (side === 1 ? 1 : 0)) % 4],
      );
      patch.rotation.x = -Math.PI / 2;
      patch.rotation.z = Math.sin(i) * 0.22;
      patch.position.set(
        center.x + side * 6.6,
        0.02 + (i % 3) * 0.025,
        center.z,
      );
      scene.add(patch);
    }
  }
  // The small raised paper folds mark the stops without competing with the previews.
  const foldGeo = new THREE.PlaneGeometry(1.2, 1.9, 1, 1);
  geometries.push(foldGeo);
  for (let i = 0; i < 9; i++) {
    const center = route(i);
    for (let j = 0; j < 3; j++) {
      const fold = new THREE.Mesh(foldGeo, patchMaterials[(i + j) % 4]);
      fold.position.set(
        center.x + (i % 2 ? 1 : -1) * (4.8 + j * 0.7),
        0.6,
        center.z - j * 0.4,
      );
      fold.rotation.set(-0.35, Math.sin(i) * 0.3, (j - 1) * 0.15);
      scene.add(fold);
    }
  }
  const leafGeometry = new THREE.PlaneGeometry(0.22, 1.8, 1, 10);
  leafGeometry.translate(0, 0.9, 0);
  geometries.push(leafGeometry);
  const leafPositions = leafGeometry.getAttribute('position');
  const uv = leafGeometry.getAttribute('uv');
  for (let i = 0; i < leafPositions.count; i++)
    leafPositions.setX(
      i,
      leafPositions.getX(i) * (0.1 + Math.sin(uv.getY(i) * Math.PI) * 0.9),
    );
  const leavesMaterial = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { time: { value: 0 } },
    vertexShader: `uniform float time;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;float phase=instanceMatrix[3].x*.7+instanceMatrix[3].z*.2;p.x+=sin(time*.8+phase)*uv.y*uv.y*.2;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(p,1.);}`,
    fragmentShader:
      `varying vec2 vUv;void main(){gl_FragColor=vec4(mix(vec3(.42,.47,.29),vec3(.65,.68,.45),vUv.y),1.);#include <colorspace_fragment>}`.replace(
        ';#include',
        ';\n#include',
      ),
  });
  materials.push(leavesMaterial);
  const leaves = new THREE.InstancedMesh(leafGeometry, leavesMaterial, 180);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 180; i++) {
    const station = Math.floor(i / 20);
    const center = route(station);
    const side = i % 2 ? 1 : -1;
    dummy.position.set(
      center.x + side * (2.9 + (i % 7) * 0.6),
      0.08,
      center.z + Math.sin(i * 6.2) * 4,
    );
    dummy.rotation.set(0, 0.3 * Math.sin(i), 0.35 * Math.sin(i * 2.3));
    dummy.scale.setScalar(0.3 + (i % 5) * 0.07);
    dummy.updateMatrix();
    leaves.setMatrixAt(i, dummy.matrix);
  }
  leaves.instanceMatrix.needsUpdate = true;
  scene.add(leaves);
  container.append(canvas);
  let disposed = false;
  let running = false;
  const target = new THREE.Vector3();
  const render = (time: number) => {
    const center = route(state.travel);
    camera.position.set(center.x - 1, 8.3, center.z + 12);
    target.set(center.x, 0.1, center.z - 0.2);
    camera.lookAt(target);
    leavesMaterial.uniforms.time.value = time;
    renderer.render(scene, camera);
  };
  const visibility = () => {
    const play = !document.hidden && !disposed;
    if (play === running) return;
    running = play;
    if (play) gsap.ticker.add(render);
    else gsap.ticker.remove(render);
  };
  const resize = new ResizeObserver(() => {
    if (disposed) return;
    const w = container.clientWidth,
      h = container.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  });
  resize.observe(container);
  document.addEventListener('visibilitychange', visibility);
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    gsap.ticker.remove(render);
    resize.disconnect();
    document.removeEventListener('visibilitychange', visibility);
    canvas.removeEventListener('webglcontextlost', lost);
    leaves.dispose();
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    grain.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };
  const lost = (event: Event) => {
    event.preventDefault();
    container.dataset.world = 'fallback';
    dispose();
  };
  canvas.addEventListener('webglcontextlost', lost);
  container.dataset.world = 'ready';
  visibility();
  return dispose;
}
