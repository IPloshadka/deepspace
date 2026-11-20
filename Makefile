CC ?= cc
PYTHON ?= python3
ZIG ?= zig
CFLAGS ?= -std=c99 -O2 -Wall -Wextra -Wpedantic -ffp-contract=off
SOURCES = src/game.c src/cli.c
ifeq ($(OS),Windows_NT)
EXE = .exe
else
EXE =
endif
.PHONY: all run test reference-test web windows linux linux-x86 clean regenerate serve test-web
all: build/deepspace$(EXE)
build:
	mkdir -p build
build/deepspace$(EXE): $(SOURCES) src/deepspace.h | build
	$(CC) $(CFLAGS) $(SOURCES) -lm -o $@
run: all
	./build/deepspace$(EXE)
regenerate:
	$(PYTHON) tools/translate.py
test: all
	$(PYTHON) tests/test_dialogues.py --exe build/deepspace$(EXE)
test-web:
	$(PYTHON) tests/test_dialogues.py --exe web/deepspace.wasm --node node
reference-test: all
	$(PYTHON) tests/test_dialogues.py --exe build/deepspace$(EXE) --reference "$(VINTBAS)"
web: | build
	$(ZIG) build-exe -target wasm32-freestanding -O ReleaseSmall -fno-entry --import-symbols --export=ds_reset --export=ds_advance --export=ds_numbers --export=ds_string --export=ds_line --export=ds_error --export=ds_input_buffer --export-memory -femit-bin=web/deepspace.wasm -cflags -std=c99 -ffp-contract=off -fno-builtin -- src/game.c src/web_bridge.c
windows: | build
	$(ZIG) cc -target x86_64-windows-gnu $(CFLAGS) $(SOURCES) -lm -o build/deepspace-windows.exe
linux: | build
	$(ZIG) cc -target x86_64-linux-musl -static $(CFLAGS) $(SOURCES) -lm -o build/deepspace-linux
linux-x86: | build
	$(ZIG) cc -target x86-linux-musl -static $(CFLAGS) $(SOURCES) -lm -o build/deepspace-linux-x86
serve:
	$(PYTHON) -m http.server 8000 --directory web
clean:
	rm -rf build
