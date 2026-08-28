#!/usr/bin/env node
/**
 * Gate 5: one ElevenLabs timestamped synthesis for the approved body script,
 * then scene timings from the alignment.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const project = path.join(root, "examples/about-first-take");
const fps = 30;
const leadInFrames = 120;
const leadOutFrames = 4;

const scenes = [
  {
    id: "01",
    title: "Hook",
    narration:
      'Most AI video tools give you a finished clip. If something is wrong, you regenerate it and hope the next version is better. <break time="0.4s" /> First Take works differently.',
  },
  {
    id: "02",
    title: "What it is",
    narration:
      'It is a code-based video editor, designed from the ground up so your coding agent can create and edit alongside you. <break time="0.3s" /> Describe the video you want. Ask your agent to build the scenes, create graphics, add overlays, animate elements, cut footage, adjust timing, or make another pass.',
  },
  {
    id: "03",
    title: "The project",
    narration:
      'The video is the project. <break time="0.3s" /> Scenes are React components. The timeline is JSON. Your images, video and audio sit alongside the rest of the source. <break time="0.3s" /> That means your agent can work on a video the same way it works on your application: reading the project, making precise edits, previewing the result and iterating on your direction.',
  },
  {
    id: "04",
    title: "In the repo",
    narration:
      'Build an explainer video alongside the feature it documents. Create launch content in the same repo as your product. Update a screen recording when the UI changes. Commit the video with the code that changed it. <break time="0.4s" /> And because the composition is code, the same project can publish to landscape, portrait or square without rebuilding the video from scratch.',
  },
  {
    id: "05",
    title: "Real media",
    narration:
      'You are not limited to generated motion graphics either. <break time="0.3s" /> Drop in video, audio and images. Cut them. Trim them. Position them anywhere. <break time="0.3s" /> A talking head in the corner. A screen recording full frame. A still behind the type. Product UI with animated callouts. Music underneath. <break time="0.3s" /> Your agent can create the graphics and animation around all of it.',
  },
  {
    id: "06",
    title: "Direct the pass",
    narration:
      'You start with the vision. <break time="0.25s" /> Your agent does the editing. <break time="0.3s" /> Then you open the preview studio, watch it back and direct the next pass. <break time="0.4s" /> Make this section faster. <break time="0.25s" /> Highlight the new button. <break time="0.25s" /> Add a title here. <break time="0.25s" /> Turn this into a vertical version. <break time="0.25s" /> Replace this screen with the latest UI. <break time="0.4s" /> Those become edits to the project, not another roll of the dice.',
  },
  {
    id: "07",
    title: "The studio",
    narration:
      'And when you want to work manually, the studio is there too. <break time="0.3s" /> Details on the right. The stage in the middle. The timeline underneath. <break time="0.3s" /> Scrub the playhead. Double-click a clip to isolate it. Tweak a prop in the sidebar. Add a track. Drag a clip. Undo a change. <break time="0.3s" /> The files remain the source of truth, so every manual change is there for the next agent pass.',
  },
  {
    id: "08",
    title: "Land",
    narration:
      'You stay the director. <break time="0.25s" /> Your agent does the work. <break time="0.25s" /> And your video stays editable. <break time="0.4s" /> First Take is the video toolchain for coding agents.',
  },
];

const fullText = scenes.map((scene) => scene.narration).join(" ");

/**
 * Load KEY=value pairs from the repo .env without printing secrets.
 */
function loadEnv({ filePath }) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    const hash = value.indexOf(" #");
    if (hash !== -1) value = value.slice(0, hash).trim();
    value = value.replace(/^["']|["']$/g, "");
    env[key] = value;
  }
  return env;
}

/**
 * Map each scene's narration onto alignment character clocks.
 * This model kept `<break>` tags in `alignment.characters`, so match the sent
 * text as-is rather than stripping tags first.
 */
function computeSceneTimings({ scenes: sceneList, fullScript, alignment }) {
  const joined = alignment.characters.join("");
  let cursor = 0;
  const timings = [];

  for (const scene of sceneList) {
    const startIndex = joined.indexOf(scene.narration, cursor);
    if (startIndex === -1) {
      throw new Error(
        `Scene ${scene.id} narration not found in alignment at or after ${cursor}`,
      );
    }
    const endIndex = startIndex + scene.narration.length - 1;
    timings.push({
      id: scene.id,
      title: scene.title,
      audioStartSeconds: alignment.character_start_times_seconds[startIndex],
      audioEndSeconds: alignment.character_end_times_seconds[endIndex],
      charStart: startIndex,
      charEnd: endIndex,
      narration: scene.narration,
    });
    cursor = endIndex + 1;
  }

  for (let i = 0; i < timings.length; i++) {
    const start = timings[i].audioStartSeconds;
    const end =
      i < timings.length - 1
        ? timings[i + 1].audioStartSeconds
        : timings[i].audioEndSeconds;
    const tail = i === timings.length - 1 ? leadOutFrames : 0;
    timings[i].durationInFrames =
      Math.round((end - start) * fps) + tail;
  }

  return { timings, strippedLength: fullScript.length, alignedLength: joined.length };
}

const env = { ...loadEnv({ filePath: path.join(root, ".env") }), ...process.env };
const apiKey = env.ELEVENLABS_API_KEY;
const voiceId = env.ELEVENLABS_VOICE_ID ?? "MiueK1FXuZTCItgbQwPu";
const modelId = env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2";

const audioDir = path.join(project, "assets/audio");
const metaDir = path.join(project, "audio");
fs.mkdirSync(audioDir, { recursive: true });
fs.mkdirSync(metaDir, { recursive: true });

const mp3Path = path.join(audioDir, "narration.mp3");
const alignmentPath = path.join(metaDir, "alignment.json");
const fromAlignment = process.argv.includes("--from-alignment");

let alignment;
if (fromAlignment) {
  if (!fs.existsSync(alignmentPath)) {
    console.error("Missing audio/alignment.json");
    process.exit(1);
  }
  alignment = JSON.parse(fs.readFileSync(alignmentPath, "utf8"));
  console.log("Recomputing timings from existing alignment (no API call)");
} else {
  if (!apiKey) {
    console.error("ELEVENLABS_API_KEY is missing");
    process.exit(1);
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`;
  console.log(`Synthesising ${fullText.length} chars with ${modelId}…`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      text: fullText,
      model_id: modelId,
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.75,
        style: 0.15,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`ElevenLabs ${response.status}: ${body.slice(0, 800)}`);
    process.exit(1);
  }

  const payload = await response.json();
  if (!payload.audio_base64 || !payload.alignment) {
    console.error("Response missing audio_base64 or alignment");
    process.exit(1);
  }

  fs.writeFileSync(mp3Path, Buffer.from(payload.audio_base64, "base64"));
  fs.writeFileSync(alignmentPath, `${JSON.stringify(payload.alignment, null, 2)}\n`);
  alignment = payload.alignment;
}

const { timings, strippedLength, alignedLength } = computeSceneTimings({
  scenes,
  fullScript: fullText,
  alignment,
});

const last = timings[timings.length - 1];
const voSeconds = last.audioEndSeconds;
const voFrames = Math.round(voSeconds * fps);
const totalFrames = leadInFrames + voFrames + leadOutFrames;

const timingsPath = path.join(metaDir, "timings.json");
fs.writeFileSync(
  timingsPath,
  `${JSON.stringify(
    {
      fps,
      leadInFrames,
      leadOutFrames,
      voSeconds,
      totalFrames,
      strippedLength,
      alignedLength,
      scenes: timings,
    },
    null,
    2,
  )}\n`,
);

console.log(`Wrote ${mp3Path}`);
console.log(`VO ${voSeconds.toFixed(2)}s | total ${totalFrames} frames (${(totalFrames / fps).toFixed(2)}s)`);
console.log(`alignment chars ${alignedLength} vs stripped script ${strippedLength}`);
for (const row of timings) {
  console.log(
    `${row.id.padEnd(4)} ${row.title.padEnd(18)} ${row.audioStartSeconds.toFixed(2).padStart(7)}–${row.audioEndSeconds.toFixed(2).padEnd(7)}  ${String(row.durationInFrames).padStart(4)}f`,
  );
}
