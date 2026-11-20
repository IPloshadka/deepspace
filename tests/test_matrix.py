import sys,subprocess,tempfile,random,argparse
from pathlib import Path
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root/'tests'))
from test_dialogues import compare
parser=argparse.ArgumentParser(description='36 additional seeded dialogues against Vintage BASIC; 27 use controlled RND replacements.')
parser.add_argument('--reference',required=True)
ref=Path(parser.parse_args().reference).resolve()
rng=random.Random(20261120);count=0
with tempfile.TemporaryDirectory() as d:
 for rnd in [0,.25,.5,.75]:
  source=root/'original/deepspace.bas'
  if rnd:
   source=Path(d)/'controlled.bas';source.write_text((root/'original/deepspace.bas').read_text().replace('RND(0)',str(rnd)))
  for system in [1,2,3]:
   for ship in [1,2,3]:
    values=['NO','NO',system,ship,'4,'+str({1:8,2:12,3:15}[ship]),7,2]+[rng.choice([1,2,3,4,5,9]) for _ in range(12)]+[8,'NO']
    data='\n'.join(map(str,values))+'\n'
    baseline=subprocess.run([str(ref),str(source)],input=data,text=True,capture_output=True,timeout=10)
    native=subprocess.run([str(root/'build/deepspace'),'--rnd',str(rnd)],input=data,text=True,capture_output=True,timeout=10)
    wasm=subprocess.run(['node',str(root/'tests/run_wasm.mjs'),str(rnd)],input=data,text=True,capture_output=True,timeout=10)
    for name,result in [('native',native),('wasm',wasm)]:
     error=compare(baseline.stdout,result.stdout)
     if baseline.returncode or result.returncode or error:
      print('FAIL',rnd,system,ship,name,baseline.stderr,result.stderr,error);sys.exit(1)
    count+=1
print('PASS',count,'additional scenarios: all 9 system/ship pairs at RND 0, .25, .5, .75; native + Wasm vs Vintage BASIC; seed 20261120.')
