import HookScene from "./src/scenes/01-Hook";
import FixScene from "./src/scenes/02-Fix";
import LeadIn from "./src/components/LeadIn";

/**
 * Component playground registry for preview mode.
 */
export const playground = [
  {
    id: "LeadIn",
    component: LeadIn,
    defaultProps: { label: "Storyboard" },
    durationInFrames: 120,
  },
  {
    id: "Hook",
    component: HookScene,
    defaultProps: { headline: "You hit Tab. Nothing highlights." },
    durationInFrames: 90,
  },
  {
    id: "Fix",
    component: FixScene,
    defaultProps: { headline: "Focus rings make the path obvious." },
    durationInFrames: 120,
  },
];
