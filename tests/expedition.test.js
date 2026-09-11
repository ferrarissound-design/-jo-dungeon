import test from 'node:test';
import assert from 'node:assert/strict';
import {GameState} from '../src/core/GameState.js';
import {SaveManager} from '../src/core/SaveManager.js';
import {canStep,distance,DIRS,key} from '../src/core/DungeonGenerator.js';
test('20 full combat expeditions reach floor ten and win',()=>{
let victories=0;const records=[];
for(let seed=1;seed<=20;seed++){
 let s=seed;const rand=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};
 const g=new GameState(new SaveManager({getItem:()=>null,setItem:()=>{}}),rand);g.start();let steps=0;
 while(g.run&&steps++<4000){const r=g.run,p=r.player,d=r.dungeon;let action;
 const use=(type)=>p.inventory.findIndex(i=>i.type===type);
 if(p.hp<p.maxHp*.6&&use('potion')>=0)action={type:'item',index:use('potion'),mode:'use'};
 else if(p.hunger<55&&use('food')>=0)action={type:'item',index:use('food'),mode:'use'};
 else {let gear=p.inventory.findIndex(i=>['sword','shield'].includes(i.type)&&i.power>p.equipment[i.type].power);
 if(gear>=0)action={type:'item',index:gear,mode:'use'};
 else {const adjacent=d.enemies.find(e=>distance(p,e)===1&&canStep(d,p,e));
 if(adjacent)action={type:'move',dx:adjacent.x-p.x,dy:adjacent.y-p.y};
 else if(g.at(p,d.stairs))action={type:'inspect'};
 else {const queue=[{x:p.x,y:p.y,first:null}],seen=new Set([key(p.x,p.y)]); let q=null; for(let n=0;n<queue.length&&!q;n++){for(const v of DIRS){const a=queue[n],b={x:a.x+v.x,y:a.y+v.y},k=key(b.x,b.y);if(seen.has(k)||!canStep(d,a,b))continue;if(g.at(b,d.stairs)){q=a.first||b;break;}seen.add(k);queue.push({...b,first:a.first||b});}}if(!q)break;action={type:'move',dx:q.x-p.x,dy:q.y-p.y};}}}
 g.turns.perform(action);g.events=[];
 }
 if(g.result?.clear)victories++;records.push({seed,floor:g.result?.floor||g.run?.floor,clear:g.result?.clear,steps});
}
assert.equal(victories,20,JSON.stringify(records));
});
