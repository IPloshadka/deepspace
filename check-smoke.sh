#!/bin/sh
# Quick portable checks: no Python, Node.js or make required.
set -eu
cd "$(dirname "$0")"
sh build.sh
for scenario in enemy_destroyed player_destroyed self_destruct repeat_battle; do
    ./build/deepspace < "tests/dialogues/$scenario.txt" > "build/smoke-$scenario.txt"
    case "$scenario" in
        enemy_destroyed) marker='ENEMY VESSEL DESTROYED' ;;
        player_destroyed) marker='YOUR VESSEL HAS BEEN DESTROYED' ;;
        self_destruct) marker='SELF DESTRUCT ACCOMPLISHED' ;;
        repeat_battle) marker='TRY AGAIN LATER!' ;;
    esac
    if ! grep -F "$marker" "build/smoke-$scenario.txt" >/dev/null; then
        printf 'FAIL %s\n' "$scenario"
        exit 1
    fi
    printf 'PASS %s\n' "$scenario"
done
printf '%s\n' '4 smoke checks passed. Full reference comparison: make test (Python 3 required).'
