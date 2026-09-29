#!/bin/sh
# chụp từng artboard 390x844 bằng Chrome headless
D="$(cd "$(dirname "$0")" && pwd -W)"
for f in "$@"; do
  "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
    --window-size=390,844 --virtual-time-budget=3000 --screenshot="$D/shots/$f.png" "file:///$D/project/$f.dc.html" >/dev/null 2>&1
done
