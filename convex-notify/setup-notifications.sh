#!/bin/zsh
# One-time setup: installs the robot-request notifier as a LaunchAgent so
# native notifications work automatically — at login, forever, no terminal.
#
#   ./setup-notifications.sh <your-user-id>       e.g. ./setup-notifications.sh rush
set -euo pipefail

USER_ID="${1:-}"
[[ -n "$USER_ID" ]] || { echo "usage: ./setup-notifications.sh <your-user-id>"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUN="$(command -v bun || echo "$HOME/.bun/bin/bun")"
[[ -x "$BUN" ]] || { echo "bun is required — install from https://bun.sh"; exit 1; }

LABEL="com.convexnotify.watcher"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
mkdir -p "$HOME/Library/LaunchAgents"

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array>
    <string>$BUN</string>
    <string>$SCRIPT_DIR/notify-watcher.ts</string>
  </array>
  <key>EnvironmentVariables</key><dict>
    <key>CONVEX_DEPLOYMENT_URL</key><string>https://hushed-pony-700.convex.cloud</string>
    <key>VOICEOS_USER_ID</key><string>$USER_ID</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/convex-notify-watcher.log</string>
  <key>StandardErrorPath</key><string>/tmp/convex-notify-watcher.log</string>
</dict></plist>
EOF

launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"
echo "Notifier installed and running as $USER_ID (log: /tmp/convex-notify-watcher.log)"
echo "To remove: launchctl unload $PLIST && rm $PLIST"
