// Headless isolated Chromium: no access to any user's browser profile.
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../build/browser/package.json',import.meta.url));
const {chromium}=require('playwright');
const root=new URL('../',import.meta.url).pathname;
const server=spawn(process.env.PYTHON||'python3',['-m','http.server','8765','--bind','127.0.0.1','--directory','web'],{cwd:root,stdio:'ignore'});
let browser;
try {
  for(let i=0;i<80;i++){
    try { const response=await fetch('http://127.0.0.1:8765/index.html');if(response.ok)break;}catch{}
    if(i===79)throw Error('HTTP server unavailable');
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  await fs.mkdir(new URL('../build/screenshots/',import.meta.url),{recursive:true});
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765');await page.waitForFunction(()=>!document.querySelector('#answer').disabled);
  for(const value of ['NO','NO','1','1','2,4','7','6','2','2','2','2','NO']){
    await page.locator('#answer').fill(value);await page.locator('#answer').press('Enter');
  }
  assert.match(await page.locator('#screen').innerText(),/ENEMY VESSEL DESTROYED/);
  await page.screenshot({path:root+'build/screenshots/desktop.png',fullPage:true});
  const download=page.waitForEvent('download');await page.locator('#save').click();
  await (await download).saveAs(root+'build/screenshots/dialogue.txt');
  await page.locator('#restart').click();
  for(const label of ['Нет','Нет','Orion','Разведчик','Трюм: ракеты','8 · Выход','Нет'])await page.locator('#choices').getByRole('button',{name:label,exact:true}).click();
  assert.equal(await page.locator('#answer').isDisabled(),true);
  await page.selectOption('#display-mode','retro');await page.screenshot({path:root+'build/screenshots/retro.png',fullPage:true});
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const touch=await mobile.newPage();touch.on('pageerror',e=>errors.push(e.message));
  await touch.goto('http://127.0.0.1:8765');await touch.waitForFunction(()=>!document.querySelector('#answer').disabled);
  for(const label of ['Нет','Нет','Orion','Разведчик','Трюм: ракеты','8 · Выход','Нет'])await touch.locator('#choices').getByRole('button',{name:label,exact:true}).tap();
  assert.equal(await touch.locator('#answer').isDisabled(),true);
  assert.equal(await touch.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await touch.screenshot({path:root+'build/screenshots/touch.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS real Chromium: keyboard victory, mouse-only game, touch-only game, download, reset, mobile layout, modern and retro screenshots.');
} finally {if(browser)await browser.close();server.kill();}
