/* Independent unit/model assertions + seeded state-machine fuzzing.
 * No test expectations are read from generated C source. */
#include "../src/deepspace.h"
#include <assert.h>
#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
static uint32_t digest;
static uint32_t hash_byte(uint32_t x, unsigned char b) { return (x ^ b) * UINT32_C(16777619); }
void host_text(const char *s) { while(*s) digest=hash_byte(digest,(unsigned char)*s++); }
void host_number(float value) { unsigned char bytes[sizeof value]; unsigned i;memcpy(bytes,&value,sizeof value);for(i=0;i<sizeof value;i++)digest=hash_byte(digest,bytes[i]); }
void host_tab(int column) { digest=hash_byte(digest,(unsigned char)column); }
float host_pow(float base,float exponent) { return powf(base,exponent); }
static int answer_string(const char *s) { ds_string(s);return ds_advance(); }
static int answer(float a,float b) { ds_numbers(a,b);return ds_advance(); }
static void start(int system,int ship,int weapon,int count) {
    digest=UINT32_C(2166136261);ds_reset(0);
    assert(ds_advance()==3);assert(ds_line()==170);
    assert(answer_string("NO")==3);assert(ds_line()==610);
    assert(answer_string("NO")==1);assert(ds_line()==810);
    assert(answer((float)system,0)==1);assert(ds_line()==920);
    assert(answer((float)ship,0)==2);assert(ds_line()==990);
    assert(answer((float)weapon,(float)count)==1);assert(ds_line()==1200);
}
static void unit_tests(void) {
    int ship,system,i;
    const int torpedoes[]={0,8,12,15};
    for(ship=1;ship<=3;ship++)for(system=1;system<=3;system++) {
        start(system,ship,4,torpedoes[ship]);
        assert(ds_value(DS_TORPEDOES)==torpedoes[ship]);
        assert(ds_value(DS_RANGE)==500);assert(ds_value(DS_VELOCITY)==0);
        for(i=1;i<=torpedoes[ship];i++) {
            assert(answer(4,0)==1);assert(ds_line()==1200);
            assert(ds_value(DS_TORPEDOES)==torpedoes[ship]-i);
        }
        { float before=ds_value(DS_ENEMY_DAMAGE);
          assert(answer(4,0)==1);assert(ds_value(DS_TORPEDOES)==0);
          assert(ds_value(DS_ENEMY_DAMAGE)==before); }
        assert(answer(8,0)==3);assert(answer_string("NO")==0);
    }
    start(1,1,2,4);assert(answer(2,0)==1);
    /* At R=500, RND=0: D=(2*20*(500/500)^1.5)/5 = 8. */
    assert(fabsf(ds_value(DS_ENEMY_DAMAGE)-8)<0.00001f);
    assert(ds_value(DS_MISSILES)==3);
    ds_reset(0);assert(ds_value(DS_MISSILES)==0);assert(ds_value(DS_ENEMY_DAMAGE)==0);
    assert(ds_advance()==3);assert(ds_line()==170);
    puts("PASS core: 9 loadout/depletion models, no damage from empty torpedoes, missile damage formula, full reset, I/O states");
}
static uint32_t next(uint32_t *seed) { *seed=*seed*UINT32_C(1664525)+UINT32_C(1013904223);return *seed; }
static uint32_t session(uint32_t seed) {
    int step,status;float random=(next(&seed)%4)*0.25f;
    digest=UINT32_C(2166136261);ds_reset(random);status=ds_advance();
    for(step=0;step<200 && status>0;step++) {
        uint32_t pick=next(&seed);
        assert(status>=1 && status<=3);
        if(status==3) status=answer_string((pick%5)==0?"YES":"NO");
        else if(ds_line()==810 || ds_line()==920)status=answer((float)(pick%3+1),0);
        else if(ds_line()==990) {
            int capacity=ds_value(DS_SHIP)==1?16:ds_value(DS_SHIP)==2?24:30;
            /* Includes invalid selections / quantities as well as a terminating loadout. */
            if(pick%4==0)status=answer((float)(pick%12-2.0),-1);
            else status=answer(4,(float)(capacity/2));
        } else if(ds_line()==1390)status=answer((float)((int)(pick%41)-20),0);
        else if(ds_line()==1670)status=answer((float)(pick%2),0);
        else status=answer((float)((int)(pick%14)-2),0);
    }
    assert(status>=-1 && status<=3);
    if(status==-1) assert(ds_error()!=0);
    for(step=DS_RANGE;step<=DS_FIELD;step++) host_number(ds_value(step));
    digest=hash_byte(digest,(unsigned char)(status+1));
    return digest;
}
int main(int argc,char **argv) {
    if(argc==2 && !strcmp(argv[1],"--fuzz")) {
        uint32_t seed;
        for(seed=1;seed<=2000;seed++) {
            uint32_t first=session(seed);
            (void)session(seed+UINT32_C(271828)); /* disturb previous state */
            assert(first==session(seed)); /* reset + deterministic replay property */
        }
        puts("PASS fuzz: 2000 seeds, 6000 bounded sessions, reset/replay determinism and valid protocol/error states");
    } else unit_tests();
    return 0;
}
