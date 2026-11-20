#!/usr/bin/env python3
import argparse, difflib, hashlib, json, math, re, subprocess, sys, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
NUMBER=re.compile(r'[-+]?(?:\d+\.\d*|\.\d+|\d+)(?:[eE][-+]?\d+)?')
def compare(expected,actual):
    # Preserve words, punctuation and number order. Only terminal whitespace and
    # float32 decimal rendering/libm rounding (2e-6 relative) may differ.
    if re.sub(r'\s+',' ',NUMBER.sub('<N>',expected)).strip()!=re.sub(r'\s+',' ',NUMBER.sub('<N>',actual)).strip():
        return 'Text differs:\n'+''.join(difflib.unified_diff(expected.splitlines(True),actual.splitlines(True)))
    left,right=NUMBER.findall(expected),NUMBER.findall(actual)
    if len(left)!=len(right):return 'Number count differs'
    for i,(a,b) in enumerate(zip(left,right)):
        if not math.isclose(float(a),float(b),rel_tol=2e-6,abs_tol=1e-7):
            return 'Number %d differs: %s vs %s'%(i,a,b)
    return None

def main():
    p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--reference');p.add_argument('--node');a=p.parse_args()
    executable=(ROOT/a.exe).resolve()
    cases=json.loads((ROOT/'tests/cases.json').read_text())
    metadata=json.loads((ROOT/'tests/reference.json').read_text())
    assert hashlib.sha256((ROOT/'original/deepspace.bas').read_bytes()).hexdigest()==metadata['source_sha256']
    logdir=ROOT/'build/test-logs';logdir.mkdir(parents=True,exist_ok=True)
    for case in cases:
        expected_path=ROOT/'tests/expected'/(case['name']+'.txt')
        assert hashlib.sha256(expected_path.read_bytes()).hexdigest()==metadata['logs'][case['name']]
        expected=expected_path.read_text()
        data=(ROOT/'tests'/case['input']).read_text()
        if a.reference:
            with tempfile.TemporaryDirectory() as directory:
                source=ROOT/'original/deepspace.bas'
                if case['rnd']:
                    controlled=Path(directory)/'test.bas'
                    controlled.write_text(source.read_text().replace('RND(0)',str(case['rnd'])))
                    source=controlled
                ref=subprocess.run([str(Path(a.reference).resolve()),str(source)],input=data,text=True,capture_output=True,timeout=20)
                if ref.returncode or compare(expected,ref.stdout): raise AssertionError('Reference changed: '+case['name'])
        command=[str(executable),'--rnd',str(case['rnd'])]
        if a.node:command=[a.node,str(ROOT/'tests/run_wasm.mjs'),str(case['rnd'])]
        result=subprocess.run(command,input=data,text=True,capture_output=True,timeout=20)
        (logdir/(case['name']+('.wasm' if a.node else '.native')+'.txt')).write_text(result.stdout)
        error=compare(expected,result.stdout)
        if result.returncode or error:
            print('FAIL',case['name'],result.stderr,error or '',file=sys.stderr);return 1
        print('PASS',case['name'])
    print('%d dialogue tests passed against Vintage BASIC logs.'%len(cases))
    return 0
if __name__=='__main__':sys.exit(main())
