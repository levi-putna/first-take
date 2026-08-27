import { useLayoutEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  cancelRender,
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from "@levi-putna/storyboard-core";
import { staticFile } from "@levi-putna/storyboard-media";
import * as THREE from "three";
import {
  createRobotRenderer,
  createRobotStage,
  disposeRobotWorld,
  loadRobotModel,
  seekAndDrawRobot,
  type RobotWorld,
} from "../components/robotWorld.js";

/**
 * Eleven-second WebGL clip: RobotExpressive walks along a ground plane.
 * The second half zooms the camera out and pans around the robot.
 *
 * Motion is seeked from `useCurrentFrame()` (`mixer.setTime`), not a wall-clock
 * Three.js loop, so stills and parallel capture stay on the right pose.
 */
export default function RobotWalk({
  clipName = "Walking",
  metresPerSecond = 1.15,
}: {
  clipName?: string;
  metresPerSecond?: number;
}) {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<RobotWorld | null>(null);
  const frameRef = useRef(frame);
  const [loadHandle] = useState(() => delayRender("RobotExpressive.glb"));
  const [ready, setReady] = useState(false);

  frameRef.current = frame;

  // Load the glTF once; delay capture until the first seeked draw.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      cancelRender(new Error("RobotWalk canvas was not mounted"));
      return;
    }

    const renderer = createRobotRenderer({ canvas, width, height });
    const scene = createRobotStage();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    let cancelled = false;

    void loadRobotModel({
      scene,
      src: staticFile("assets/models/RobotExpressive.glb"),
      clipName,
    })
      .then((model) => {
        if (cancelled) return;
        const world: RobotWorld = {
          renderer,
          scene,
          camera,
          mixer: model.mixer,
          root: model.root,
        };
        worldRef.current = world;
        seekAndDrawRobot({
          world,
          frame: frameRef.current,
          fps,
          width,
          height,
          durationInFrames,
          metresPerSecond,
        });
        setReady(true);
        continueRender(loadHandle);
      })
      .catch((error: unknown) => {
        if (!cancelled) cancelRender(error);
      });

    return () => {
      cancelled = true;
      continueRender(loadHandle);
      const world = worldRef.current;
      if (world) {
        disposeRobotWorld({ world });
        worldRef.current = null;
      } else {
        renderer.dispose();
      }
    };
  }, [clipName, durationInFrames, fps, loadHandle, metresPerSecond]);

  // Seek mixer + camera from the current frame, then draw before screenshot.
  useLayoutEffect(() => {
    const world = worldRef.current;
    if (!ready || !world) return;
    const handle = delayRender(`RobotDraw:${frame}`);
    seekAndDrawRobot({
      world,
      frame,
      fps,
      width,
      height,
      durationInFrames,
      metresPerSecond,
    });
    continueRender(handle);
  }, [frame, fps, width, height, durationInFrames, metresPerSecond, ready]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#e0e0e0" }}>
      {/* WebGL stage: sized from video config, not CSS animation */}
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />
    </AbsoluteFill>
  );
}
