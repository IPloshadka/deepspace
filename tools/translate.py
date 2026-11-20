#!/usr/bin/env python3
"""Reproducible, deliberately narrow BASIC -> C translation for Deepspace.
Not a general BASIC compiler. Fails on unsupported syntax instead of guessing.
The committed C output builds without Python and is the game's implementation.
"""
import json
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'original/deepspace.bas').read_text()
lines=[(int(n),s) for n,s in (line.split(' ',1) for line in source.splitlines() if line.strip())]
variables=sorted(set(re.findall(r'\b[A-Z][0-9]?\b',re.sub(r'"[^"]*"','',source))))
variables=[v for v in variables if v not in ['I','M','R','X']] + ['M','R']
# Derive numeric names from expression scanning, excluding string names.
used=set(); strings={'I$':0,'M$':1,'R$':2}
def parts(text, delimiters):
    result=[]; start=0; quoted=False; depth=0
    for i,c in enumerate(text):
        if c=='"': quoted=not quoted
        if quoted: continue
        if c=='(': depth+=1
        if c==')': depth-=1
        if c in delimiters and depth==0:
            result.append((text[start:i].strip(),c));start=i+1
    result.append((text[start:].strip(),''))
    return result
class Expr:
    def __init__(self,s):
        self.t=re.findall(r'RND\(0\)|[A-Z][0-9]?\$?|(?:\d+(?:\.\d*)?|\.\d+)|[()+*/^<>=-]',s)
        if ''.join(self.t)!=s.replace(' ',''): raise ValueError('Bad expression '+s)
        self.i=0
    def parse(self,level=0):
        if self.i>=len(self.t): raise ValueError('Missing operand')
        t=self.t[self.i]; self.i+=1
        if t=='(':
            left=self.parse(); assert self.t[self.i]==')';self.i+=1
        elif t in ('-','+'):
            left='('+t+self.parse(4)+')'
        elif t=='RND(0)': left='random_value'
        elif re.match(r'[A-Z]',t): used.add(t);left='v.'+t.lower()
        else: left=t+'f' if '.' in t else t+'.0f'
        priorities={'=':1,'>':1,'<':1,'+':2,'-':2,'*':3,'/':3,'^':4}
        while self.i<len(self.t) and priorities.get(self.t[self.i],-1)>=level:
            op=self.t[self.i];self.i+=1;p=priorities[op]
            right=self.parse(p if op=='^' else p+1)
            if op=='^': left='power('+left+', '+right+')'
            elif op=='/':left='divide('+left+', '+right+')'
            else:left='('+left+' '+('==' if op=='=' else op)+' '+right+')'
        return left

def expr(s):
    parser=Expr(s); result=parser.parse(); assert parser.i==len(parser.t),s
    return result

code=[]; input_cases={}
for j,(number,line) in enumerate(lines):
    nxt=lines[j+1][0] if j+1<len(lines) else 0
    statements=[]; terminated=False
    for statement,_ in parts(line,':'):
        if statement.startswith('REM'): break
        if statement.startswith('PRINT'):
            content=statement[5:].strip()
            if not content: statements.append('host_text("\\n");');continue
            for item,sep in parts(content,';,'):
                if item:
                    if item.startswith('"'): statements.append('host_text('+json.dumps(item[1:-1])+');')
                    elif item.startswith('TAB('): statements.append('host_tab((int)'+expr(item[4:-1])+');')
                    else:statements.append('host_number('+expr(item)+');')
                if sep==',':statements.append('host_tab(-1);')
            if not content.endswith((';',',')):statements.append('host_text("\\n");')
        elif statement.startswith('INPUT '):
            fields=statement[6:].split(',');kind=3 if fields[0].endswith('$') else len(fields)
            input_cases[number]=fields
            statements+=['host_text("? ");','input_line=%d; pc=%d; return %d;'%(number,nxt,kind)]
            terminated=True
        elif statement.startswith('GOTO '):
            statements.append('pc=%d; break;'%int(statement[5:]));terminated=True
        elif statement.startswith('IF '):
            condition,target=statement[3:].split(' THEN ')
            m=re.fullmatch(r'([A-Z]\$)="([^"]*)"',condition)
            test='same(strings[%d], %s)'%(strings[m[1]],json.dumps(m[2])) if m else expr(condition)
            condition_code=test[1:-1] if test.startswith('(') and test.endswith(')') else test
            statements.append('if (%s) { pc=%d; break; }'%(condition_code,int(target)))
        elif statement.startswith('ON '):
            name,targets=statement[3:].split(' GOTO ')
            targets=list(map(int,targets.split(',')))
            # Vintage BASIC truncates the ON selector toward zero.
            statements.append('choice=on_index(%s);'%expr(name))
            statements.append('switch(choice) { '+ ' '.join('case %d: pc=%d; break;'%(i+1,t) for i,t in enumerate(targets))+' default: pc=%d; break; }'%nxt)
            statements.append('break;');terminated=True
        elif statement=='END':statements.append('pc=0; return 0;');terminated=True
        else:
            name,value=statement.split('=',1);used.add(name)
            statements.append('v.%s=%s;'%(name.lower(),expr(value)))
    if not terminated:statements.append('pc=%d; break;'%nxt)
    code.append('        case %d: /* BASIC %d */\n            '%(number,number)+'\n            '.join(statements))
header='''/* Generated by tools/translate.py from original/deepspace.bas.
 * Each case retains its BASIC line number for audit/debugging.
 * Arithmetic is float32, matching Vintage BASIC 1.0.3.
 */
#include "deepspace.h"
#include <float.h>
static struct { float %s; } v;
static char strings[3][256];
static int pc, input_line, current_line, failure, choice;
static float random_value;
static int same(const char *a,const char *b) {
    while (*a && *a==*b) { ++a; ++b; }
    return *a==*b;
}
static float divide(float a,float b) {
    if (b==0) { failure=2; return 0; }
    return a/b;
}
static float power(float a,float b) {
    float answer=host_pow(a,b);
    if (answer != answer || answer > FLT_MAX || answer < -FLT_MAX) { failure=1; return 0; }
    return answer;
}
static int on_index(float x) {
    if (x!=x || x<0 || x>255) { failure=3; return 0; }
    /* Vintage BASIC truncates toward zero. */
    return (int)x;
}
void ds_reset(float r) {
    unsigned char *p=(unsigned char *)&v;
    unsigned int i;
    for(i=0;i<sizeof v;++i) p[i]=0;
    for(i=0;i<3;++i) strings[i][0]=0;
    pc=100; input_line=0; failure=0; current_line=0; random_value=r;
}
int ds_line(void) { return current_line; }
int ds_error(void) { return failure; }
'''%(', '.join(v.lower() for v in sorted(used)))
numeric=['void ds_numbers(float a,float b) {','    (void)b;','    switch(input_line) {']
string=['void ds_string(const char *text) {','    int slot=-1; unsigned int i=0;','    switch(input_line) {']
for line,fields in input_cases.items():
    if fields[0].endswith('$'):string.append('    case %d: slot=%d; break;'%(line,strings[fields[0]]))
    else:numeric.append('    case %d: '%line+' '.join('v.%s=%s;'%(f.lower(),['a','b'][i]) for i,f in enumerate(fields))+' break;')
numeric+=['    default: failure=4; break;','    }','    input_line=0;','}']
string+=['    default: failure=4; return;','    }','    while(text[i] && i<255) { strings[slot][i]=text[i]; ++i; }','    strings[slot][i]=0; input_line=0;','}']
body='''int ds_advance(void) {
    unsigned int budget=100000;
    if(input_line) return -1;
    while(pc && budget>0) {
        --budget;
        if(failure) return -1;
        current_line=pc;
        switch(pc) {
'''+ '\n'.join(code)+'''
        default: failure=4; return -1;
        }
    }
    if(!budget && pc) { failure=5; return -1; }
    return failure ? -1 : 0;
}
'''
(ROOT/'src/game.c').write_text(header+'\n'.join(numeric+string)+'\n'+body)
print('Generated',len(lines),'BASIC line cases; numeric variables:',len(used))
