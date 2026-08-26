import TypewriterScene from "./src/scenes/01-Typewriter";
import FloatingBoxesScene from "./src/scenes/02-FloatingBoxes";
import PulseCircleScene from "./src/scenes/03-PulseCircle";
import SlideFadeScene from "./src/scenes/04-SlideFade";
import StaggerListScene from "./src/scenes/05-StaggerList";
import SpringBounceScene from "./src/scenes/06-SpringBounce";
import ProgressFillScene from "./src/scenes/07-ProgressFill";
import RotateCounterScene from "./src/scenes/08-RotateCounter";

/**
 * Component playground registry for preview mode.
 */
export const playground = [
  {
    id: "Typewriter",
    component: TypewriterScene,
    defaultProps: {
      line1: "Motion should be frame-driven.",
      line2: "Never wall-clock CSS animation.",
    },
    durationInFrames: 120,
  },
  {
    id: "FloatingBoxes",
    component: FloatingBoxesScene,
    defaultProps: {},
    durationInFrames: 120,
  },
  {
    id: "PulseCircle",
    component: PulseCircleScene,
    defaultProps: {},
    durationInFrames: 90,
  },
  {
    id: "SlideFade",
    component: SlideFadeScene,
    defaultProps: { headline: "Slide in from the left" },
    durationInFrames: 90,
  },
  {
    id: "StaggerList",
    component: StaggerListScene,
    defaultProps: {},
    durationInFrames: 105,
  },
  {
    id: "SpringBounce",
    component: SpringBounceScene,
    defaultProps: {},
    durationInFrames: 90,
  },
  {
    id: "ProgressFill",
    component: ProgressFillScene,
    defaultProps: {},
    durationInFrames: 90,
  },
  {
    id: "RotateCounter",
    component: RotateCounterScene,
    defaultProps: {},
    durationInFrames: 90,
  },
];
