import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./studio.css";

(window as unknown as { __STORYBOARD_ASSET_BASE__: string }).__STORYBOARD_ASSET_BASE__ =
  "/";

createRoot(document.getElementById("root")!).render(<App />);
