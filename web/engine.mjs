// I/O adapter only: all game rules and state transitions execute in C/Wasm.
export function formatNumber(value) {
  let text;
  for (let p = 1; p <= 9; p++) {
    text = Number(value.toPrecision(p)).toString();
    if (Math.fround(Number(text)) === value) break;
  }
  if (Number.isInteger(value) && Math.abs(value) < 1e9) text = value.toFixed(0);
  text = text.replace(/^0\./, '.').replace(/^-0\./, '-.');
  return (value >= 0 ? ' ' : '') + text + ' ';
}
export async function createGame(bytes, onText) {
  let wasm, column = 0, status = 0, first = null;
  const decoder = new TextDecoder();
  const emit = text => {
    for (const c of text) column = c === '\n' ? 0 : column + 1;
    onText(text);
  };
  const readString = pointer => {
    const memory = new Uint8Array(wasm.memory.buffer);
    let end = pointer;
    while (memory[end]) end++;
    return decoder.decode(memory.subarray(pointer, end));
  };
  const imports = { env: {
    host_text: pointer => emit(readString(pointer)),
    host_number: value => emit(formatNumber(value)),
    host_tab: target => {
      if (target < 0) target = (Math.floor(column / 14) + 1) * 14;
      if (target > column) emit(' '.repeat(target - column));
    },
    host_pow: (a, b) => Math.fround(Math.pow(a, b))
  }};
  const { instance } = await WebAssembly.instantiate(bytes, imports);
  wasm = instance.exports;
  const advance = () => {
    status = wasm.ds_advance();
    if (status < 0) throw new Error(`BASIC arithmetic/runtime error ${wasm.ds_error()} at line ${wasm.ds_line()}.`);
    return status;
  };
  return {
    start(random = 0) {
      if (!Number.isFinite(random) || random < 0 || random >= 1) throw new Error('Invalid RND value');
      column = 0; first = null; wasm.ds_reset(random); return advance();
    },
    get status() { return status; },
    get line() { return wasm.ds_line(); },
    submit(input) {
      if (!status) return 0;
      const text = input.trim();
      if (status === 3) {
        const value = text.startsWith('"') && text.endsWith('"') ? text.slice(1, -1) : text;
        const encoded = new TextEncoder().encode(value);
        if (encoded.length > 255) throw new Error('Input is too long');
        const pointer = wasm.ds_input_buffer();
        const memory = new Uint8Array(wasm.memory.buffer);
        memory.set(encoded, pointer); memory[pointer + encoded.length] = 0;
        wasm.ds_string(pointer);
      } else {
        const fields = text.split(',').map(x => x.trim());
        const valid = x => /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(x) && Number.isFinite(Math.fround(Number(x)));
        if (fields.some(x => !valid(x))) {
          first = null; emit('!NUMBER EXPECTED - RETRY INPUT LINE\n? '); return status;
        }
        if (status === 2 && fields.length === 1 && first === null) {
          first = Number(fields[0]); emit('?? '); return status;
        }
        let values = fields.map(Number);
        if (first !== null) { values.unshift(first); first = null; }
        if (values.length !== status) {
          emit('!EXTRA INPUT - RETRY INPUT LINE\n? '); return status;
        }
        wasm.ds_numbers(values[0], values[1] || 0);
      }
      return advance();
    }
  };
}
