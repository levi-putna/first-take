#!/usr/bin/env bash
# Generate short synthetic MP3 tones for audio-mix fixture (committed; re-run only if regenerating).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/examples/audio-mix/assets/audio"
mkdir -p "$OUT"

# Intro jingle: short beep ~2s
ffmpeg -y -f lavfi -i "sine=frequency=660:duration=2" -q:a 9 "$OUT/intro-jingle.mp3" </dev/null
# Soft bed: low tone ~8s (looped in engine)
ffmpeg -y -f lavfi -i "sine=frequency=220:duration=8" -q:a 9 "$OUT/bed-loop.mp3" </dev/null
# Narration stand-in: mid tone ~3s
ffmpeg -y -f lavfi -i "sine=frequency=440:duration=3" -q:a 9 "$OUT/narration.mp3" </dev/null

echo "Wrote fixture audio to $OUT"
