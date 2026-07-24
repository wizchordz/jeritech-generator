#!/bin/bash
set -e

export CI=true

pnpm install --no-frozen-lockfile
