#!/usr/bin/env python3
"""Record expected logs ONLY by executing BASIC in Vintage BASIC 1.0.3."""
import argparse, hashlib, json, subprocess, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--vintbas',required=True);a=p.parse_args()
exe=Path(a.vintbas).resolve()
original=ROOT/'original/deepspace.bas'
cases=json.loads((ROOT/'tests/cases.json').read_text())
metadata={'runtime':'Vintage BASIC 1.0.3', 'source_sha256':hashlib.sha256(original.read_bytes()).hexdigest(),
          'runtime_sha256':hashlib.sha256(exe.read_bytes()).hexdigest(),'logs':{}}
for case in cases:
    with tempfile.TemporaryDirectory() as tmp:
        source=original
        if case['rnd']!=0:
            source=Path(tmp)/'controlled.bas'
            source.write_text(original.read_text().replace('RND(0)',str(case['rnd'])))
        result=subprocess.run([str(exe),str(source)],input=(ROOT/'tests'/case['input']).read_bytes(),capture_output=True,timeout=15)
        if result.returncode or result.stderr:
            raise SystemExit(case['name']+': '+result.stderr.decode())
        if not result.stdout.endswith(b'TRY AGAIN LATER!\n'):
            raise SystemExit(case['name']+': dialogue did not finish normally')
        log=ROOT/'tests/expected'/(case['name']+'.txt')
        log.write_bytes(result.stdout)
        metadata['logs'][case['name']]=hashlib.sha256(result.stdout).hexdigest()
        print(case['name'],'recorded from BASIC')
(ROOT/'tests/reference.json').write_text(json.dumps(metadata,indent=2)+'\n')
