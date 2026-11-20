"""Documented test dialogues. Never creates expected output from the C port."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
cases=[]
def case(name, values, rnd=0, note=''):
    name=name+'.txt'
    (ROOT/'tests/dialogues'/name).write_text('\n'.join(map(str,values))+'\n')
    cases.append({'name':name[:-4], 'input':'dialogues/'+name,'rnd':rnd,'note':note})
def setup(system=1,ship=1,load=('2,4',)):
    return ['NO','NO',system,ship,*load]
case('disengage',setup()+[8,'NO'])
case('instructions',['YES',1,1,'2,4',8,'NO'])
case('chart',['NO','YES',2,2,'1,1','3,2','4,2',8,'NO'])
case('load_validation',['NO','NO',1,4,1,'9,1','2,5','2,4',8,'NO'])
case('empty_weapons',setup(load=('4,8',))+[2,3,5,8,'NO'],note='Original empty-lance path fires instead of printing its warning.')
case('missile_depletion',setup()+[2,2,2,2,2,8,'NO'])
case('torpedo_depletion',setup(load=('4,8',))+[4]*9+[8,'NO'])
case('phaser_quirk',setup(load=('1,1','4,2'))+[1,1,8,'NO'],note='Original phaser exhaustion bypasses the drained message.')
case('lances',setup(load=('3,4',))+[3,3,3,3,3,8,'NO'])
case('self_destruct_cancel',setup()+[6,0,8,'NO'])
case('self_destruct',setup()+[6,1,'NO'])
case('velocity_limit',setup()+[7,20,8,'NO'])
case('proceed',setup()+[9,9,8,'NO'])
case('repeat_battle',setup()+[8,'YES',3,3,'5,1','4,5',5,8,'NO'])
case('field_persists',setup(3,3,('5,1','4,5'))+[5,8,'YES',1,1,'2,4',5,8,'NO'],note='N5 is not reset between battles in the original.')
case('fractional_selector',['NO','NO',1,1.9,'2,4',8,'NO'])
case('deneb',setup(2,2,('2,6',))+[2,2,8,'NO'])
case('arcturus',setup(3,3,('5,1','4,5'))+[5,4,8,'NO'])
case('fixed_half',setup()+[2,8,'NO'],0.5,'Controlled RND fixture: only RND(0) replaced by 0.5 in temporary BASIC copy.')
case('fixed_quarter',setup(2,2,('3,6',))+[3,9,8,'NO'],0.25,'Controlled RND fixture, temporary BASIC copy.')
case('fixed_high',setup(3,3,('5,1','4,5'))+[5,8,'NO'],0.75,'Controlled RND fixture, temporary BASIC copy.')
case('player_destroyed',setup()+[7,4]+[9]*9+['NO'],note='Full battle ending; expected log recorded independently in Vintage BASIC.')
case('enemy_destroyed',setup()+[7,6]+[2]*4+['NO'],note='Full battle ending; expected log recorded independently in Vintage BASIC.')
(ROOT/'tests/cases.json').write_text(json.dumps(cases,indent=2)+'\n')
