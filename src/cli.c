/* Terminal adapter. No POSIX APIs: standard C99 works on Windows as well. */
#include "deepspace.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <ctype.h>
#include <errno.h>
static int column;
void host_text(const char *s) {
    while(*s) { putchar(*s); column=(*s=='\n')?0:column+1; ++s; }
}
void host_tab(int target) {
    if(target<0) target=(column/14+1)*14;
    while(column<target) host_text(" ");
}
void host_number(float value) {
    char buffer[64]; int precision;
    /* Shortest decimal that round-trips to the same float32. */
    for(precision=1;precision<=9;++precision) {
        snprintf(buffer,sizeof buffer,"%.*g",precision,(double)value);
        if(strtof(buffer,NULL)==value) break;
    }
    if(value==truncf(value) && fabsf(value)<1e9f)
        snprintf(buffer,sizeof buffer,"%.0f",(double)value);
    if(value>=0) host_text(" ");
    if(buffer[0]=='0' && buffer[1]=='.') host_text(buffer+1);
    else if(buffer[0]=='-' && buffer[1]=='0' && buffer[2]=='.') {
        host_text("-");host_text(buffer+2);
    } else host_text(buffer);
    host_text(" ");
}
float host_pow(float a,float b) { return powf(a,b); }
static int number(char **cursor,float *value) {
    char *end; errno=0;
    *value=strtof(*cursor,&end);
    if(end==*cursor || !isfinite(*value) || errno==ERANGE) return 0;
    while(isspace((unsigned char)*end)) ++end;
    *cursor=end; return 1;
}
int main(int argc,char **argv) {
    float random=0;
    if(argc==3 && !strcmp(argv[1],"--rnd")) {
        char *p=argv[2];
        if(!number(&p,&random) || *p || random<0 || random>=1) {
            fprintf(stderr,"--rnd requires 0 <= value < 1\n");return 2;
        }
    } else if(argc!=1) {
        fprintf(stderr,"Usage: %s [--rnd VALUE]\n",argv[0]);return 2;
    }
    ds_reset(random);
    for(;;) {
        int status=ds_advance(); char line[1024]; float a=0,b=0;
        if(status==0) return 0;
        if(status<0) {
            fprintf(stderr,"\nBASIC arithmetic/runtime error %d at line %d.\n",ds_error(),ds_line());
            return 1;
        }
        for(;;) {
            char *p,*end;
            fflush(stdout);
            if(!fgets(line,sizeof line,stdin)) {
                fprintf(stderr,"\nInput ended at BASIC line %d.\n",ds_line());return 2;
            }
            if(!strchr(line,'\n') && !feof(stdin)) {
                int c;while((c=getchar())!='\n' && c!=EOF) {}
                host_text("!INPUT LINE TOO LONG - RETRY\n? ");continue;
            }
            p=line;while(isspace((unsigned char)*p)) ++p;
            end=p+strlen(p);while(end>p && isspace((unsigned char)end[-1])) --end;*end=0;
            if(status==3) {
                if(*p=='"' && end>p+1 && end[-1]=='"') { ++p;end[-1]=0; }
                if(strlen(p)>255) { host_text("!INPUT LINE TOO LONG - RETRY\n? ");continue; }
                ds_string(p);break;
            }
            if(!number(&p,&a)) { host_text("!NUMBER EXPECTED - RETRY INPUT LINE\n? ");continue; }
            if(status==2) {
                if(!*p) {
                    host_text("?? ");fflush(stdout);
                    if(!fgets(line,sizeof line,stdin)) return 2;
                    p=line;
                } else if(*p==',') ++p;
                else { host_text("!NUMBER EXPECTED - RETRY INPUT LINE\n? ");continue; }
                if(!number(&p,&b)) { host_text("!NUMBER EXPECTED - RETRY INPUT LINE\n? ");continue; }
            }
            if(*p) { host_text("!EXTRA INPUT - RETRY INPUT LINE\n? ");continue; }
            ds_numbers(a,b);break;
        }
    }
}
