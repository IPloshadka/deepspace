#ifndef DEEPSPACE_H
#define DEEPSPACE_H
/* Pure C engine, shared by the native executable and WebAssembly. */
void host_text(const char *text);
void host_number(float value);
void host_tab(int column);
float host_pow(float base, float exponent);
/* reset uses the last RND value: Vintage BASIC starts RND(0) at zero. */
void ds_reset(float last_random);
int ds_advance(void); /* 0=end, 1=number, 2=two numbers, 3=string, -1=error */
void ds_numbers(float first, float second);
void ds_string(const char *text);
int ds_line(void);
int ds_error(void);
#endif
