import * as THREE from 'three';
import { gsap } from 'gsap';

const vertexShader = `
  uniform float uTime;
  uniform float uCurl;
  uniform float uWind;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    float tip = uv.y * uv.y;
    p.x += sin(uTime * 0.7 + position.y * 1.6) * tip * uWind;
    p.z += sin(uv.x * 3.14159) * uCurl + sin(uTime * 0.5 + uv.y * 2.0) * tip * uWind * 0.25;
    vec4 localPosition = vec4(p, 1.0);
    #ifdef USE_INSTANCING
      localPosition = instanceMatrix * localPosition;
    #endif
    gl_Position = projectionMatrix * modelViewMatrix * localPosition;
  }
`;
const fragmentShader = `
  uniform vec3 uColor;
  varying vec2 vUv;
  float grain(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    float fiber = grain(floor(vUv * vec2(560.0, 340.0))) * 0.09;
    float light = 0.9 + sin(vUv.x * 3.14159) * 0.1 + fiber;
    gl_FragColor = vec4(uColor * light, 1.0);
    #include <colorspace_fragment>
  }
`;

export function mountPaperScene(container: HTMLElement) {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  });
  if (!gl) throw new Error('WebGL2 is unavailable');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    context: gl,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 40);
  camera.position.z = 12;
  const garden = new THREE.Group();
  garden.position.set(2.1, -3.9, 0);
  garden.scale.setScalar(0.65);
  scene.add(garden);
  const materials: THREE.ShaderMaterial[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const material = (color: string, curl: number, wind: number) => {
    const value = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uTime: { value: 0 },
        uCurl: { value: curl },
        uWind: { value: wind },
      },
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
    });
    materials.push(value);
    return value;
  };
  const addPaper = (
    width: number,
    height: number,
    color: string,
    x: number,
    y: number,
    z: number,
    rotation: number,
  ) => {
    const geometry = new THREE.PlaneGeometry(width, height, 22, 12);
    geometries.push(geometry);
    const positions = geometry.getAttribute('position');
    for (let i = 0; i < positions.count; i++) {
      const edge =
        Math.abs(positions.getX(i)) > width * 0.48 ||
        Math.abs(positions.getY(i)) > height * 0.48;
      if (edge)
        positions.setY(i, positions.getY(i) + Math.sin(i * 7.13) * 0.025);
    }
    const mesh = new THREE.Mesh(geometry, material(color, 0.18, 0.015));
    mesh.position.set(x, y, z);
    mesh.rotation.set(0.1, -0.13, rotation);
    garden.add(mesh);
  };
  addPaper(3.4, 0.85, '#d4ae89', -1.8, -0.3, -0.2, -0.15);
  addPaper(2.9, 0.95, '#adb08b', -0.2, -0.65, 0, 0.24);
  addPaper(2.4, 0.8, '#eadac0', 1.6, -0.6, 0.2, -0.14);
  const leaf = new THREE.PlaneGeometry(0.045, 2, 1, 14);
  geometries.push(leaf);
  const positions = leaf.getAttribute('position');
  const uvs = leaf.getAttribute('uv');
  for (let i = 0; i < positions.count; i++) {
    positions.setX(
      i,
      positions.getX(i) * (0.12 + Math.sin(uvs.getY(i) * Math.PI) * 0.88),
    );
    positions.setY(i, positions.getY(i) + 1);
  }
  const grass = new THREE.InstancedMesh(
    leaf,
    material('#879271', 0.1, 0.14),
    28,
  );
  const transform = new THREE.Object3D();
  for (let i = 0; i < grass.count; i++) {
    transform.position.set(
      -2.8 + i * 0.19,
      -0.6 + Math.sin(i * 2.1) * 0.12,
      0.4 + (i % 3) * 0.09,
    );
    transform.rotation.set(
      0,
      Math.sin(i * 0.8) * 0.3,
      Math.sin(i * 1.7) * 0.42,
    );
    transform.scale.setScalar(0.7 + (Math.sin(i * 4.7) + 1) * 0.25);
    transform.updateMatrix();
    grass.setMatrixAt(i, transform.matrix);
  }
  grass.instanceMatrix.needsUpdate = true;
  garden.add(grass);
  container.append(canvas);
  let disposed = false;
  let visible = true;
  let running = false;
  const state = { scroll: 0 };
  const scroll = gsap.to(state, {
    scroll: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: '#home',
      start: 'top top',
      end: 'bottom top',
      scrub: 0.6,
    },
  });
  const render = (time: number) => {
    materials.forEach((value) => {
      value.uniforms.uTime.value = time;
    });
    camera.position.x = state.scroll * 0.18;
    camera.position.y = state.scroll * 0.3;
    camera.zoom = 1 + state.scroll * 0.035;
    camera.updateProjectionMatrix();
    garden.rotation.y = -0.08 + state.scroll * 0.06;
    renderer.render(scene, camera);
  };
  const updateRunning = () => {
    const shouldRun = visible && !document.hidden && !disposed;
    if (shouldRun === running) return;
    running = shouldRun;
    if (running) gsap.ticker.add(render);
    else gsap.ticker.remove(render);
  };
  const resize = new ResizeObserver(() => {
    if (disposed) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    const aspect = width / height;
    camera.left = -5 * aspect;
    camera.right = 5 * aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  });
  resize.observe(container);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    updateRunning();
  });
  intersection.observe(container);
  document.addEventListener('visibilitychange', updateRunning);
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    gsap.ticker.remove(render);
    scroll.scrollTrigger?.kill();
    scroll.kill();
    resize.disconnect();
    intersection.disconnect();
    document.removeEventListener('visibilitychange', updateRunning);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    grass.dispose();
    geometries.forEach((value) => value.dispose());
    materials.forEach((value) => value.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };
  const onContextLost = (event: Event) => {
    event.preventDefault();
    container.dataset.scene = 'fallback';
    dispose();
  };
  canvas.addEventListener('webglcontextlost', onContextLost);
  container.dataset.scene = 'ready';
  updateRunning();
  return dispose;
}
