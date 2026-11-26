"""Assert actual ELF class and CPU architecture before executing test binaries."""
import argparse
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('binary',type=Path);p.add_argument('bits',type=int,choices=[32,64]);a=p.parse_args()
header=a.binary.read_bytes()[:20]
assert header[:4]==b'\x7fELF', 'not an ELF executable'
assert header[4]=={32:1,64:2}[a.bits], 'ELF bitness differs from requested build'
assert header[5]==1, 'expected little-endian x86 ELF'
machine=int.from_bytes(header[18:20],'little')
assert machine=={32:3,64:62}[a.bits], 'wrong ELF CPU type'
print('VERIFIED ELF%d, CPU %s, little-endian: %s'%(a.bits,'i386' if a.bits==32 else 'x86_64',a.binary))
