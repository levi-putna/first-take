# Three Robot

An 11-second WebGL clip: the [Three.js RobotExpressive](https://threejs.org/examples/#webgl_animation_skinning_morph) model walks along a ground plane. The second half zooms the camera out and pans around the robot.

The walk is **seeked from `useCurrentFrame()`** (`AnimationMixer.setTime`), not a `requestAnimationFrame` / `THREE.Clock` loop. That is what makes stills, scrubbing, and parallel capture land on the same pose.

Catalogue: [examples/README.md](../README.md).

## Preview

<video src="./preview.mp4" controls playsinline width="720"></video>

[Play preview](./preview.mp4)

## Tracks

| Track | Scenes |
|-------|--------|
| Main | One 330-frame (11s @ 30fps) robot walk; camera pull-out from the midpoint |

## Model credit

RobotExpressive by [Tomás Laulhé](https://www.patreon.com/quaternius), CC0. Modifications by Don McCurdy. Vendored from the [three.js examples](https://github.com/mrdoob/three.js/tree/r170/examples/models/gltf/RobotExpressive).

## Commands

```bash
pnpm first-take validate examples/three-robot/video.json
pnpm first-take still examples/three-robot/video.json --frame=0 --out=out/three-robot-0.png
pnpm first-take still examples/three-robot/video.json --frame=165 --out=out/three-robot-165.png
pnpm first-take still examples/three-robot/video.json --frame=329 --out=out/three-robot-329.png
pnpm first-take preview examples/three-robot/video.json
pnpm first-take render examples/three-robot/video.json --format=16x9 --concurrency=1 --silent
```

`--concurrency=1` keeps a single WebGL context during the first encode. Raise it once stills look correct.
