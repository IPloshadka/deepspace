/* WebAssembly keeps the exact C engine and asks JavaScript only for I/O/pow. */
static char buffer[256];
char *ds_input_buffer(void) { return buffer; }
