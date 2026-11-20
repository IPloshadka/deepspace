// Real Wasm and app.mjs; a mock DOM verifies handlers, not browser rendering.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const elements=new Map();
for(const id of ['screen','answer','send','error','restart','save','state','hint','input-form'])elements.set('#'+id,{textContent:'',value:'',disabled:true,hidden:true,handlers:{},focus(){},addEventListener(name,fn){this.handlers[name]=fn;}});
let download;
globalThis.document={querySelector:id=>elements.get(id),createElement:()=>({click(){download={href:this.href,name:this.download};}})};
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
console.log('PASS page handlers: load, invalid input retry, split input, victory, transcript Blob, restart, arithmetic error recovery (mock DOM, actual Wasm).');
