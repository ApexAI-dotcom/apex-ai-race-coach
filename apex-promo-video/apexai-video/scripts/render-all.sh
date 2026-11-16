#!/usr/bin/env bash
# Rendus finaux : H.264 CRF 16, yuv420p (plage vidéo, BT.709), images intermédiaires PNG sans perte, 60 i/s.
set -euo pipefail
cd "$(dirname "$0")/.."
OPTS="--codec=h264 --crf=16 --image-format=png --pixel-format=yuv420p --color-space=bt709 --concurrency=2 --log=error"
npx remotion render ApexAI-16x9 out/apexai-promo-16x9.mp4 $OPTS
npx remotion render ApexAI-9x16 out/apexai-promo-9x16.mp4 $OPTS
npx remotion still Thumbnail out/thumbnail-1280x720.png --log=error
node scripts/export-cuesheets.mjs
echo "RENDER-ALL-DONE"
