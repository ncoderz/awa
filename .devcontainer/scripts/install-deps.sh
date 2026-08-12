#!/bin/sh
set -e

# Shared dependencies for building and running smarket.
# Sourced by both the devcontainer and CI runner Dockerfiles.
apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    libssl-dev \
    jq \
    bubblewrap \
    socat \
 && apt-get clean -y \
 && rm -rf /var/lib/apt/lists/*



