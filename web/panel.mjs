// Presentation only: read-only C state. No game formulas or rules live here.
const bounded=(x,max)=>Number.isFinite(x)?Math.max(0,Math.min(max,x)):0;
const label=x=>Number.isFinite(x)?Number(x.toFixed(2)).toString():'—';
export function renderPanel(values,retro=false){
  const [range,velocity,own,enemy]=values;
  const x=140+bounded(range,1500)/1500*420;
  const color=retro?'#73ff77':'#d7f589';
  const grid=Array.from({length:12},(_,i)=>`<path d="M${i*60} 0V180"/>`).join('');
  return `<svg viewBox="0 0 640 220" role="img" aria-label="Схема боя: дистанция ${label(range)}, повреждения вашего корабля ${label(own)}, противника ${label(enemy)}">
  <rect width="640" height="220" fill="${retro?'#021006':'#0b1422'}"/>
  <g stroke="${retro?'#12391b':'#1d3048'}" stroke-width="1">${grid}<path d="M0 50H640M0 100H640M0 150H640"/></g>
  <path d="M76 100H${x}" stroke="${color}" stroke-dasharray="4 6"/>
  <g fill="${color}" transform="translate(64 100)"><path d="M-22 -16L24 0L-22 16L-12 0Z"/></g>
  <g fill="#ffad8e" opacity="${enemy>99?0.25:1}" transform="translate(${x} 100)"><path d="M24 -18L-24 0L24 18L14 0Z"/></g>
  <g fill="${color}" font-family="monospace" font-size="13"><text x="16" y="24">RANGE ${label(range)} · VELOCITY ${label(velocity)}</text>
  <text x="16" y="175">YOUR DAMAGE ${label(own)}</text><text x="340" y="175">ENEMY DAMAGE ${label(enemy)}</text></g>
  <rect x="16" y="188" width="280" height="10" fill="#263345"/><rect x="16" y="188" width="${bounded(own,100)*2.8}" height="10" fill="${color}"/>
  <rect x="340" y="188" width="280" height="10" fill="#263345"/><rect x="340" y="188" width="${bounded(enemy,100)*2.8}" height="10" fill="#ffad8e"/></svg>`;
}
export function choices(line,ship){
  if([170,610,2760].includes(line))return [['YES','Да'],['NO','Нет']];
  if(line===810)return [['1','Orion'],['2','Deneb'],['3','Arcturus']];
  if(line===920)return [['1','Разведчик'],['2','Крейсер'],['3','Линкор']];
  if(line===990){const capacity=ship===1?16:ship===2?24:30;return [...(capacity%4===0?[[`2,${capacity/4}`,'Трюм: ракеты']]:[]),[`4,${capacity/2}`,'Трюм: торпеды']];}
  if(line===1200)return [['1','1 · Фазер'],['2','2 · Ракета'],['3','3 · Lance'],['4','4 · Торпеда'],['5','5 · Поле'],['6','6 · Самоуничтожение'],['7','7 · Скорость'],['8','8 · Выход'],['9','9 · Движение']];
  if(line===1390)return [['0','Без изменения'],['1','+1'],['2','+2'],['-1','−1']];
  if(line===1670)return [['1','Подтвердить'],['0','Отменить']];
  return [];
}
