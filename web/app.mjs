import {createGame} from './engine.mjs';
import {renderPanel,choices} from './panel.mjs';
const screen=document.querySelector('#screen'),input=document.querySelector('#answer'),send=document.querySelector('#send'),error=document.querySelector('#error');
const restart=document.querySelector('#restart'),save=document.querySelector('#save');
const choicePanel=document.querySelector('#choices'),battlePanel=document.querySelector('#battle-panel'),displayMode=document.querySelector('#display-mode');
let game, transcript='';
function draw(){
  const mode=displayMode.value;
  document.body.classList.toggle('retro',mode==='retro');
  document.body.classList.toggle('terminal-only',mode==='terminal');
  battlePanel.innerHTML=renderPanel(game.values,mode==='retro');
  choicePanel.replaceChildren();
  if(game.status>0)for(const [value,label] of choices(game.line,game.values[4])){
    const button=document.createElement('button');button.type='button';button.textContent=label;
    button.addEventListener('click',()=>submit(value));choicePanel.append(button);
  }
}
function submit(value){
  if(!game||game.status<=0)return;
  screen.textContent+=value+'\n';transcript+=value+'\n';input.value='';
  try{game.submit(value);update();}catch(e){failed(e);}
}
displayMode.addEventListener('change',()=>{if(game)draw();});
const hints={170:'Введите YES для инструкции или NO для быстрого старта.',610:'Показать список команд? YES / NO.',810:'Система: 1 — Orion, 2 — Deneb, 3 — Arcturus.',920:'Корабль: 1 — разведчик, 2 — крейсер, 3 — линкор.',990:'Тип оружия и количество через запятую. Например: 2,4.',1200:'Команда боя: число от 1 до 9. Для выхода — 8.',1390:'Изменение относительной скорости. Например: 2.',1670:'1 подтверждает самоуничтожение; другое число отменяет.',2760:'Ещё один бой? YES / NO.'};
function update(){const active=game.status>0;input.disabled=send.disabled=!active;document.querySelector('#state').textContent=active?'ОЖИДАЕТ ОТВЕТА':'СЕАНС ЗАВЕРШЁН';document.querySelector('#hint').textContent=active?(hints[game.line]||'Введите ответ.'):'Можно сохранить диалог или начать заново.';screen.scrollTop=screen.scrollHeight; draw(); if(active && !window.matchMedia('(pointer: coarse)').matches)input.focus();}
function failed(e){error.hidden=false;error.textContent=e.message;input.disabled=send.disabled=true;document.querySelector('#state').textContent='ОШИБКА';choicePanel.replaceChildren();}
try{const response=await fetch('deepspace.wasm');if(!response.ok)throw new Error('Не найден deepspace.wasm. Выполните make web.');game=await createGame(await response.arrayBuffer(),text=>{screen.textContent+=text;transcript+=text;});game.start();restart.disabled=save.disabled=false;update();}catch(e){failed(e);}
document.querySelector('#input-form').addEventListener('submit',e=>{e.preventDefault();submit(input.value);});
restart.addEventListener('click',()=>{screen.textContent='';transcript='';error.hidden=true;input.value='';try{game.start();update();}catch(e){failed(e);}});
save.addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([transcript],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='deepspace-dialogue.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
