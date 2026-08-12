#!/usr/bin/env bash
set -euo pipefail

export MISE_YES=1
export MISE_VERBOSE=1

# Fix ownership on volume-backed dirs (volumes mount as root on first creation).
sudo chown -R vscode:vscode /home/vscode 2>/dev/null || true
sudo chown -R vscode:vscode ${CONTAINER_WORKSPACE_FOLDER} 2>/dev/null || true


mise install
mise exec -- npm install

