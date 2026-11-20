import { readFileSync } from 'node:fs';
import { createGame } from '../web/engine.mjs';
const data = readFileSync(0, 'utf8').split(/\r?\n/);
const game = await createGame(readFileSync(new URL('../web/deepspace.wasm', import.meta.url)), s => process.stdout.write(s));
game.start(Number(process.argv[2] || 0));
let i = 0;
while (game.status && i < data.length) game.submit(data[i++]);
if (game.status) { process.stderr.write('Input exhausted\n'); process.exitCode = 2; }
