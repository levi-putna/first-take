import { Easing, interpolate } from "@levi-putna/storyboard-core";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export type RobotWorld = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  mixer: THREE.AnimationMixer;
  root: THREE.Object3D;
};

/**
 * Build a WebGL renderer that keeps its drawing buffer for Playwright screenshots.
 */
export function createRobotRenderer({
  canvas,
  width,
  height,
}: {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}

/**
 * Lights, ground, and fog matching the Three.js skinning/morph example look.
 */
export function createRobotStage(): THREE.Scene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe0e0e0);
  scene.fog = new THREE.Fog(0xe0e0e0, 18, 70);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 3);
  dirLight.position.set(3, 10, 10);
  scene.add(dirLight);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshPhongMaterial({ color: 0xcbcbcb, depthWrite: false }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const grid = new THREE.GridHelper(200, 40, 0x000000, 0x000000);
  const gridMaterial = grid.material;
  if (!Array.isArray(gridMaterial)) {
    gridMaterial.opacity = 0.2;
    gridMaterial.transparent = true;
  }
  scene.add(grid);

  return scene;
}

/**
 * Load the RobotExpressive glTF and start the named clip (default Walking).
 */
export async function loadRobotModel({
  scene,
  src,
  clipName,
}: {
  scene: THREE.Scene;
  src: string;
  clipName: string;
}): Promise<{ mixer: THREE.AnimationMixer; root: THREE.Object3D }> {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(src);
  const root = gltf.scene;
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });
  scene.add(root);

  const mixer = new THREE.AnimationMixer(root);
  const clip =
    gltf.animations.find((item) => item.name === clipName) ??
    gltf.animations.find((item) => item.name === "Walking") ??
    gltf.animations[0];
  if (!clip) {
    throw new Error(`No animation clips in ${src}`);
  }
  const action = mixer.clipAction(clip);
  action.reset();
  action.setLoop(THREE.LoopRepeat, Infinity);
  action.setEffectiveWeight(1);
  action.setEffectiveTimeScale(1);
  action.play();

  return { mixer, root };
}

/**
 * Follow-cam for the first half; zoom out and orbit around the robot in the second.
 */
function placeRobotCamera({
  camera,
  frame,
  durationInFrames,
  robotZ,
}: {
  camera: THREE.PerspectiveCamera;
  frame: number;
  durationInFrames: number;
  robotZ: number;
}): void {
  const followX = 6.2;
  const followY = 3.6;
  const followZ = 8.4;
  const followRadius = Math.hypot(followX, followZ);
  const followAngle = Math.atan2(followX, followZ);
  const half = durationInFrames / 2;
  const last = Math.max(half + 1, durationInFrames - 1);
  const orbit = interpolate(frame, [half, last], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const radius = followRadius + orbit * 7.4;
  const angle = followAngle + orbit * 0.95;
  const height = followY + orbit * 2.8;

  camera.position.set(
    Math.sin(angle) * radius,
    height,
    robotZ + Math.cos(angle) * radius,
  );
  camera.lookAt(0, 1.1, robotZ);
}

/**
 * Seek the walk cycle and camera from the composition frame, then draw once.
 */
export function seekAndDrawRobot({
  world,
  frame,
  fps,
  width,
  height,
  durationInFrames,
  metresPerSecond,
}: {
  world: RobotWorld;
  frame: number;
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  metresPerSecond: number;
}): void {
  const seconds = frame / fps;
  const z = seconds * metresPerSecond;

  world.root.position.set(0, 0, z);
  // Seek the Walking clip (do not pause the action: paused makes setTime a no-op).
  world.mixer.setTime(seconds);

  world.camera.aspect = width / height;
  world.camera.updateProjectionMatrix();
  placeRobotCamera({
    camera: world.camera,
    frame,
    durationInFrames,
    robotZ: z,
  });

  world.renderer.setSize(width, height, false);
  world.renderer.render(world.scene, world.camera);
  world.renderer.getContext().finish();
}

/**
 * Dispose GPU resources when the scene unmounts.
 */
export function disposeRobotWorld({ world }: { world: RobotWorld }): void {
  world.mixer.stopAllAction();
  world.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      for (const material of materials) {
        material.dispose();
      }
    }
  });
  world.renderer.dispose();
}
