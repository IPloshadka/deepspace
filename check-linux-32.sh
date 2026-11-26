#!/bin/sh
# Verify and EXECUTE a 32-bit Linux game; also works on 64-bit Linux with IA32 support.
set -eu
cd "$(dirname "$0")"
program=${1:-bin/deepspace-linux-x86}
if [ ! -f "$program" ]; then
    printf 'File not found: %s\nUse the universal Linux archive, or pass a 32-bit executable path.\n' "$program"
    exit 1
fi
class=$(od -An -tu1 -j4 -N1 "$program" | tr -d ' \n')
if [ "$class" != 1 ]; then echo 'FAIL: not an ELF32 file'; exit 1; fi
chmod +x "$program"
case "$program" in /*) ;; *) program="./$program" ;; esac
"$program" --platform
mkdir -p build
"$program" < tests/dialogues/enemy_destroyed.txt > build/linux32-victory.txt
grep -F 'ENEMY VESSEL DESTROYED' build/linux32-victory.txt
printf '%s\n' 'PASS: ELF32 game executed and completed the victory dialogue.'
