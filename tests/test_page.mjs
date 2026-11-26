// Real Wasm and app.mjs; a mock DOM verifies handlers, not browser rendering.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const elements=new Map();
for(const id of ['screen','answer','send','error','restart','save','state','hint','input-form','choices','battle-panel','display-mode','retro-panel'])elements.set('#'+id,{textContent:'',value:'',disabled:true,hidden:true,handlers:{},getContext(){return {createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}};},children:[],replaceChildren(){this.children=[];},append(child){this.children.push(child);},focus(){},addEventListener(name,fn){this.handlers[name]=fn;}});
let download;
globalThis.window={matchMedia:()=>({matches:true})};
globalThis.document={body:{classList:{toggle(){}}},querySelector:id=>elements.get(id),createElement:()=>({handlers:{},addEventListener(name,fn){this.handlers[name]=fn;},click(){if(this.download)download={href:this.href,name:this.download};else this.handlers.click();}})};
globalThis.fetch=async()=>({ok:true,arrayBuffer:()=>fs.readFile(new URL('../web/deepspace.wasm',import.meta.url))});
await import('../web/app.mjs');
const el=id=>elements.get('#'+id);
const send=value=>{assert.equal(el('answer').disabled,false);el('answer').value=value;el('input-form').handlers.submit({preventDefault(){}});};
const restart=()=>el('restart').handlers.click();
assert.match(el('screen').textContent,/DO YOU WISH INSTRUCTIONS/);
for(const value of ['NO','NO','bad','1','1','2','4','7','6','2','2','2','2','NO'])send(value);
assert.match(el('screen').textContent,/NUMBER EXPECTED/);
assert.match(el('screen').textContent,/ENEMY VESSEL DESTROYED/);
assert.equal(el('answer').disabled,true);
el('save').handlers.click();assert.equal(download.name,'deepspace-dialogue.txt');
// Node's native fetch can read a Blob URL; preserve it separately from our fixture fetch.
const blobText=await (await (await import('node:buffer')).resolveObjectURL(download.href)).text();
assert.match(blobText,/ENEMY VESSEL DESTROYED/);
restart();assert.equal(el('error').hidden,true);assert.doesNotMatch(el('screen').textContent,/ENEMY VESSEL DESTROYED/);
for(const value of ['NO','NO','1','1','2,4','7','-1','9']) {
 if(el('answer').disabled)break;
 send(value);
}
assert.equal(el('error').hidden,false);assert.equal(el('answer').disabled,true);
restart();assert.equal(el('answer').disabled,false);assert.equal(el('error').hidden,true);
// Complete a session exclusively using pointer/touch-compatible buttons.
const click=value=>{const button=el('choices').children.find(x=>x.textContent.includes(value));assert.ok(button,value);button.click();};
click('Нет');click('Нет');click('Orion');click('Разведчик');click('Трюм: ракеты');click('8 · Выход');click('Нет');
assert.equal(el('answer').disabled,true);
assert.match(el('battle-panel').innerHTML,/<svg/);
el('display-mode').value='retro';el('display-mode').handlers.change();
assert.match(el('battle-panel').innerHTML,/#73ff77/);
console.log('PASS pointer/touch button workflow and modern/retro SVG generation (mock DOM).');
console.log('PASS page handlers: load, invalid input retry, split input, victory, transcript Blob, restart, arithmetic error recovery (mock DOM, actual Wasm).');

const {retroPixels,PALETTE,WIDTH,HEIGHT}=await import('../web/retro.mjs');
const pixels=retroPixels([500,0,20,60]);assert.equal(pixels.length,320*200*4);
const allowed=new Set(PALETTE.map(c=>c.join(',')));
for(let i=0;i<pixels.length;i+=4){assert.equal(pixels[i+3],255);assert.ok(allowed.has(Array.from(pixels.slice(i,i+3)).join(',')));}
assert.equal(WIDTH,320);assert.equal(HEIGHT,200);
console.log('PASS retro framebuffer: 320x200 pixels, palette constraint, opaque RGBA.');
