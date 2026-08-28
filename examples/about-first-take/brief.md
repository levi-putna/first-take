# About First Take

Planning brief for the product about video. Later gates read this file rather than re-deriving these decisions.

## Episode

| Field | Value |
|-------|-------|
| Working title | About First Take |
| Slug | `about-first-take` |
| Project path | `examples/about-first-take/` |
| Audience | Developers and creators who already use AI agents (Cursor, Claude Code, Codex, Copilot) and want video they can actually revise |
| Delivery context | Website / GitHub / product about. Watched with sound on. |
| Target length | **173 seconds** (4s lead-in + 168.6s VO). From ElevenLabs alignment. |
| Word budget | ~429 spoken words @ 140 wpm |
| Voice | ElevenLabs `MiueK1FXuZTCItgbQwPu` (`eleven_multilingual_v2`) |
| Primary objective | Make it clear that First Take is a code-based video editor for coding agents, that the video is a project, and that you stay the director |
| Takeaway | After this, a viewer can say First Take is a code-based video editor for coding agents, that video, audio and images sit in the source and can be cut, trimmed and placed, and that direction becomes edits to the project, not another roll of the dice |

## Theme / angle

Most AI video tools give you a finished clip. If something is wrong, you regenerate and hope. First Take is a code-based video editor so your coding agent can create and edit alongside you. The video is the project. You stay the director.

This is the *content* theme, not the visual theme. Visual direction follows `DESIGN.md`: plum canvas, magenta accent, Radio Canada Big / Inter, calm and precise. Not hype. Not cinematic AI spectacle.

## Must land

If the viewer remembers only these, the video succeeded:

1. First Take is a code-based video editor, designed so your coding agent can create and edit alongside you. The video is the project: React scenes, a JSON timeline, and images, video and audio in the source, the same way the agent works on an application.
2. You are not limited to generated motion graphics. Drop in video, audio and images. Cut them. Trim them. Position them. The agent can build graphics and animation around that. The same project can publish to landscape, portrait or square.
3. You stay the director. Describe the video, preview, and direct the next pass, or work in the studio. Those become edits to the project, not another roll of the dice. The files remain the source of truth.

## Production mode

Hybrid explainer:

- **Most of the runtime** is component scenes with continuous ElevenLabs narration.
- **One studio beat (~32s)** uses real footage on three overlapping tracks: talking head, screen recording of the preview studio, and a mouse / keyboard overlay.

Real footage is not the body of the explanation. The VO still carries the teaching. The capture proves the editor is a real product.

## Formats

| Use case | Aspect ratio | Resolution | id |
|----------|--------------|------------|----|
| Website, GitHub, about page | 16:9 | 1920×1080 | `16x9` |

Single format. Live captures are harder to reframe. A 9:16 cut can be added later if needed.

## Audience / tone

- Australian English
- Second person (`you`)
- Capable, calm, precise. Direct. Not a demo hype reel, not a brochure
- Contractions are fine. Agenda dumps and "in this video we will cover" are not

## Features this production uses

The about video should demonstrate the product while explaining it:

- Multi-track timeline (graphics, screen, presenter PIP, mouse / keyboard)
- Real `<Video />` clips with trim via `startFrom`
- Picture-in-picture talking head
- Frame-driven motion (`interpolate` / `useCurrentFrame`)
- In-scene fade from the loop beat into the studio capture
- Brand lead-in (logo lockup)
- Later: spanning audio mix (jingle, bed, narration)

## Live capture (placeholders now)

Drop replacements over the labelled holds. Keep the same filenames, or update `src` props in `video.json`.

| Track | File | What to record | Notes |
|-------|------|----------------|-------|
| Presenter | `assets/clips/presenter.mp4` | You, talking through the studio beat (or sitting with the product). ~32s minimum, 45s+ is safer. | Visual only. Clip audio is muted under ElevenLabs. Webcam 16:9 or 4:3 is fine; it is cropped to PIP. |
| Screen | `assets/clips/screen.mp4` | Preview studio: `hello-explainer` or this project. Scrub, isolate a clip, edit a prop, save, add/drag a track, undo. | 1920×1080, 16:9. Mute the studio. Aim for ~32s of clean action that matches beat 7 of the script. |
| Mouse and keyboard | `assets/clips/cursor-keys.mp4` | Cursor + keycaps for the same actions, aligned to the screen take. | Record on **black** (or transparent). The overlay uses mix-blend `screen` so black drops out. Same duration as the screen take. |

Do not capture your own VO on these clips unless you later want a VO-silent variant. Narration is synthesised in Gate 5.

## Nice to know (cut first)

- Full CLI flag catalogue
- Schema field-by-field
- The macOS editor
- Comparison with Remotion internals

## Leave out or later

- A full tutorial of every studio control
- Generated-video (Veo) scenes
- A 9:16 / 1:1 cut

## Series audio

Default on: ~4s intro jingle on the lead-in, soft looping bed under VO, narration delayed by 120 frames. Created / approved at Gate 4. Mix wired at Gate 5/7. Not generated in this step.

## Env

| Variable | Status |
|----------|--------|
| `ELEVENLABS_API_KEY` | Set |
| `ELEVENLABS_VOICE_ID` | Set to `MiueK1FXuZTCItgbQwPu` |
| `ELEVENLABS_MODEL_ID` | `eleven_multilingual_v2` |
| `AI_GATEWAY_API_KEY` | Set (available if Gate 3/4/7 needs generated images or posters). This production prefers components + real footage. |

## Open questions

- Confirm 16:9 only, or add a vertical cut later
- Confirm the studio capture should use `hello-explainer` (or this project) as the file on screen
- Confirm talking-head is studio-beat only (current plan), not PIP for the whole video
