// Local regression check: bun run verify-game.cjs (bundled Playwright, no install).
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
const {chromium} = require(path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],network=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>network.push(r.url()));
  await page.goto(pathToFileURL(path.resolve(__dirname,'index.html')).href);
  await page.getByRole('button',{name:'開始返工',exact:true}).click();
  for(let i=0;i<4;i++)await page.locator('#dialogbuttons button').click();
  const jumps=await page.evaluate(()=>{
   const results=[];soundOn=false;
   for(const dt of [1/120,1/60,.035])for(const p of getPlatforms())for(const approach of [false,true]){
    startChapter(false);cleared=true;player.x=approach?p.x-50:p.x+p.w/2;pressed.add('Space');if(approach)keys.add('KeyD');let landed=false;
    for(let frame=0;frame<Math.ceil(1.5/dt);frame++){update(dt);pressed.clear();if(player.grounded&&Math.abs(player.y+28-p.y)<1){landed=true;break}}
    results.push({desk:p.x,dt,approach,landed});keys.clear();
   }return results;
  });
  assert(jumps.every(j=>j.landed),JSON.stringify(jumps));
  const score=await page.evaluate(()=>midiTracks.map(t=>({notes:t.notes.length,duration:t.duration,drums:t.notes.filter(n=>n.channel===9).length,valid:t.notes.every(n=>Number.isFinite(n.time)&&Number.isFinite(n.duration)&&n.duration>0)})));
  assert(score.length===2&&score.every(t=>t.valid&&t.notes>100&&t.duration>50&&t.drums>0),'Complete embedded MIDI arrangements');
  const playback=await page.evaluate(()=>{soundOn=true;mode='play';bossSpawned=false;cleared=false;music();const normal=musicTrack;bossSpawned=true;music();const boss=musicTrack;document.getElementById('sound').click();const muted=!soundOn;document.getElementById('sound').click();return{normal,boss,muted,resumed:soundOn,audio:audio.state}});
  assert.deepEqual(playback,{normal:0,boss:1,muted:true,resumed:true,audio:'running'});
  await page.evaluate(()=>{chapter=2;startChapter(false);player.inv=0;player.dash=0;hurt(99999,1)});
  await page.locator('#deathbuttons button').first().click();
  assert(await page.evaluate(()=>mode==='play'&&player.hp===stats.maxHp),'Death retry');
  const saved=await page.evaluate(()=>validSave(JSON.parse(localStorage.getItem(SAVE_KEY))));assert(saved,'Checkpoint survives');
  for(let ch=0;ch<5;ch++){await page.evaluate(ch=>{chapter=ch;startChapter(false);spawnEnemy('',750,true);player.x=480;toastTime=0},ch);await page.screenshot({path:path.join(process.env.USERPROFILE,'.codex/visualizations/2026/09/30/01a0f2ad-9828-7c61-9de2-02d9dc740f9f',`revised-floor-${ch}.png`)});}
  assert(network.every(url=>url.startsWith('file:')),'No runtime network requests');assert.deepEqual(errors,[],'No browser errors');
  console.log('PASS: 18 actual platform jumps, two complete MIDI scores, normal/Boss music, mute/resume, death retry, checkpoint, five room renders, offline network and console.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
