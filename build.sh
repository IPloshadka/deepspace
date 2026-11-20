#!/bin/sh
set -eu
cd "$(dirname "$0")"
if [ -n "${CC:-}" ]; then
    compiler=$CC
elif command -v gcc >/dev/null 2>&1; then
    compiler=gcc
else
    compiler=cc
fi
mkdir -p build
"$compiler" -std=c99 -O2 -Wall -Wextra -Wpedantic -ffp-contract=off src/game.c src/cli.c -lm -o build/deepspace
printf '%s\n' 'Build OK. Run: ./build/deepspace'
