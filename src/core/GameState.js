import {Player} from './Player.js';
import {Enemy,SPECIES} from './Enemy.js';
import {ITEMS,label,item} from './Item.js';
import {DungeonGenerator,canStep,walkable,roomAt,visibility,key,distance,DIRS} from './DungeonGenerator.js';
import {TurnManager} from './TurnManager.js';
export const CAPACITY=16;
export class GameState {
 constructor(save,random=Math.random){
  this.save=save;this.random=random;this.generator=new DungeonGenerator(random);this.events=[];
  const data=save.load();this.town=data?.town||{coins:0,points:0,eggs:0,training:0,best:0,clears:0,storage:[],dinosaurs:[],selected:null,equipment:{sword:item('sword',1),shield:item('shield',1)}};
  this.run=data?.run||null;this.result=data?.result||null;this.turns=new TurnManager(this);if(this.run)this.reveal();
 }
 persist(){this.save.save(this);}
 log(text){if(this.run){this.run.messages.push(text);this.run.messages=this.run.messages.slice(-20);}this.events.push({type:'message',text});}
 event(type,p={},text=''){this.events.push({type,x:p.x,y:p.y,text});}
 start(){
  if(this.run)return;
  this.result=null;this.run={floor:1,turn:0,steps:0,coins:0,eggs:0,recruited:[],player:new Player(this.town),companion:null,dungeon:null,messages:[]};
  const pet=this.town.dinosaurs.find(d=>d.id===this.town.selected);
  if(pet){const e=new Enemy(pet.type,1,0,0,'ally');e.maxHp+=pet.level*4;e.hp=e.maxHp;e.attack+=pet.level;this.run.companion=e;}
  this.enterFloor(1);this.log('矢印で歩こう！ 敵のほうへ進むと攻撃するよ。');this.persist();
 }
 enterFloor(floor){
  const r=this.run;r.floor=floor;r.dungeon=this.generator.generate(floor);Object.assign(r.player,r.dungeon.start);
  if(r.companion){const p=DIRS.map(v=>({x:r.player.x+v.x,y:r.player.y+v.y})).find(p=>canStep(r.dungeon,r.player,p));Object.assign(r.companion,p);r.companion.hp=Math.min(r.companion.maxHp,r.companion.hp+8);}
  r.player.hp=Math.min(r.player.maxHp,r.player.hp+6);this.log(`地下${floor}階！ 階段を見つけよう。`);this.event('stairs',r.player);this.reveal();
 }
 reveal(){const r=this.run;this.visible=visibility(r.dungeon,r.player);r.dungeon.seen=[...new Set([...r.dungeon.seen,...this.visible])];}
 at(a,b){return a.x===b.x&&a.y===b.y;}
 enemyAt(p){return this.run.dungeon.enemies.find(e=>this.at(e,p));}
 resolveAction(a){
  const r=this.run,p=r.player,d=r.dungeon;
  if(a.type==='move'){
   const dx=Math.sign(a.dx),dy=Math.sign(a.dy);if(!dx&&!dy)return false;p.facing={x:dx,y:dy};const q={x:p.x+dx,y:p.y+dy};
   if(!canStep(d,p,q)){this.log('そちらは壁だよ。');return false;}
   const e=this.enemyAt(q);if(e){this.hit(p,e,Player.attack(p));return 'attack';}
   if(r.companion&&this.at(r.companion,q))Object.assign(r.companion,{x:p.x,y:p.y});
   Object.assign(p,q);this.pickup();this.triggerHouse();return 'move';
  }
  if(a.type==='attack'){
   const q={x:p.x+p.facing.x,y:p.y+p.facing.y};const e=this.enemyAt(q);
   if(e&&canStep(d,p,q))this.hit(p,e,Player.attack(p));else{this.log('ぶんっ！ 前に敵がいると当たるよ。');this.event('attack',p);}return 'attack';
  }
  if(a.type==='wait'){this.log('1ターン待った。');return 'wait';}
  if(a.type==='inspect'){
   if(this.at(p,d.stairs)){if(r.floor===10)this.finish(true);else this.enterFloor(r.floor+1);return 'stairs';}
   const chest=d.chests.find(c=>!c.opened&&this.at(c,p));if(chest){chest.opened=true;r.coins+=15+r.floor*3;if(this.random()<.25){r.eggs++;this.log('恐竜のタマゴを見つけた！');}const type=['potion','scroll','sword','shield'][Math.floor(this.random()*4)];d.loot.push({x:p.x,y:p.y,...item(type,1+Math.ceil(r.floor/2))});this.log('宝箱をあけた！ コインと道具を発見！');this.pickup();this.event('pickup',p);return 'inspect';}
   if(d.loot.some(i=>this.at(i,p))){this.pickup();return 'inspect';}this.log('ここには何もないよ。');return false;
  }
  if(a.type==='item')return this.useItem(a.index,a.mode);
  return false;
 }
 pickup(){const r=this.run,p=r.player,d=r.dungeon;for(let n=d.loot.length-1;n>=0;n--){const i=d.loot[n];if(this.at(i,p)){if(p.inventory.length>=CAPACITY){this.log('かばんがいっぱい！ 道具を使うか置こう。');break;}p.inventory.push(item(i.type,i.power));d.loot.splice(n,1);this.log(`${label(i)}をひろった！`);this.event('pickup',p);}}if(this.at(p,d.stairs))this.log(r.floor===10?'ゴールだ！「足元」で宝を持ち帰ろう！':'階段だ！「足元」で次の階へ。');if(d.chests.some(c=>!c.opened&&this.at(c,p)))this.log('宝箱だ！「足元」であけよう。');}
 hurt(target,amount){target.hp=Math.max(0,target.hp-amount);this.event('damage',target,`−${amount}`);}
 hit(attacker,target,power){
  const p=this.run.player;const defense=target===p?Player.defense(p):target.defense;
  const damage=Math.max(1,power-defense);this.hurt(target,damage);this.event('attack',target);
  if(target===p)this.log(`${SPECIES[attacker.type].name}から ${damage}ダメージ！`);
  if(target.hp<=0&&target!==p&&target!==this.run.companion)this.kill(target);
 }
 kill(e){const r=this.run;r.dungeon.enemies=r.dungeon.enemies.filter(x=>x!==e);r.player.xp+=e.xp;r.coins+=3+r.floor;this.log(`${SPECIES[e.type].name}をたおした！`);this.event('defeat',e);while(r.player.xp>=Player.threshold(r.player)){r.player.xp-=Player.threshold(r.player);r.player.level++;r.player.maxHp+=5;r.player.hp=Math.min(r.player.maxHp,r.player.hp+14);r.player.attack+=2;if(r.player.level%2===0)r.player.defense++;this.log(`レベル${r.player.level}！ 強くなった！`);this.event('level',r.player);}}
 useItem(index,mode){
  const r=this.run,p=r.player,i=p.inventory[index];if(!i||!['use','throw','drop'].includes(mode))return false;
  const remove=()=>p.inventory.splice(index,1);
  if(mode==='drop'){if(r.dungeon.loot.some(o=>this.at(o,p))){this.log('足元にはもう道具があるよ。');return false;}r.dungeon.loot.push({x:p.x,y:p.y,...i});remove();this.log(`${label(i)}を置いた。`);return 'item';}
  if(mode==='throw'){
   let q={x:p.x,y:p.y},target=null;for(let n=0;n<6;n++){const next={x:q.x+p.facing.x,y:q.y+p.facing.y};if(!canStep(r.dungeon,q,next))break;q=next;target=this.enemyAt(q);if(target)break;}
   remove();if(target){if(i.type==='meat'&&target.type!=='slime')this.tame(target);else this.hit(p,target,i.type==='stone'?14:5);}
   else{r.dungeon.loot.push({...q,...i});this.log('道具を投げた。');}return 'item';
  }
  if(['sword','shield'].includes(i.type)){const old=p.equipment[i.type];p.equipment[i.type]=i;remove();if(old)p.inventory.push(old);this.log(`${label(i)}を装備した！`);return 'item';}
  if(i.type==='stone'){this.log('石は「投げる」で使おう。');return false;}
  if(i.type==='potion'){p.hp=Math.min(p.maxHp,p.hp+25);this.log('HPが回復した！');}
  if(i.type==='food'){p.hunger=Math.min(100,p.hunger+45);this.log('おなかがいっぱい！');}
  if(i.type==='scroll'){for(const e of [...r.dungeon.enemies])if(this.visible.has(key(e.x,e.y))){e.asleep=3;this.hurt(e,12);if(e.hp<=0)this.kill(e);}this.log('ぴかーっ！ 敵が目を回している！');this.event('level',p);}
  if(i.type==='meat'){
   const front={x:p.x+p.facing.x,y:p.y+p.facing.y};const e=this.enemyAt(front);
   if(e&&e.type!=='slime'&&canStep(r.dungeon,p,e))this.tame(e);else{p.hunger=Math.min(100,p.hunger+20);this.log('恐竜の肉を食べた。おなか回復！');}
  }
  remove();this.event('pickup',p);return 'item';
 }
 tame(e){const r=this.run;if(this.random()<.75){r.dungeon.enemies=r.dungeon.enemies.filter(o=>o!==e);e.hp=e.maxHp;r.companion=e;if(!r.recruited.includes(e.type))r.recruited.push(e.type);this.log(`${SPECIES[e.type].name}が仲間になった！ 前の仲間は町で待っているよ。`);this.event('level',e);}else{e.asleep=2;this.log('お肉は食べたけど、まだ仲良くなれなかった。');}}
 occupied(p,except){const r=this.run;return (r.player!==except&&this.at(r.player,p))||(r.companion&&r.companion!==except&&this.at(r.companion,p))||r.dungeon.enemies.some(e=>e!==except&&this.at(e,p));}
 nextStep(actor,target){
  const d=this.run.dungeon,queue=[{x:actor.x,y:actor.y,first:null}],seen=new Set([key(actor.x,actor.y)]);
  for(let n=0;n<queue.length&&n<950;n++){const cur=queue[n];for(const v of DIRS){const p={x:cur.x+v.x,y:cur.y+v.y};const k=key(p.x,p.y);if(seen.has(k)||!canStep(d,cur,p,actor.type==='ptera'))continue;
    if(this.at(p,target))return cur.first||p;
    if(this.occupied(p,actor))continue;seen.add(k);queue.push({...p,first:cur.first||p});}}
  return null;
 }
 companionTurn(){const r=this.run,c=r.companion;if(!c)return;const target=r.dungeon.enemies.filter(e=>distance(c,e)<=6).sort((a,b)=>distance(c,a)-distance(c,b))[0];
  if(target&&distance(c,target)===1&&canStep(r.dungeon,c,target,c.type==='ptera')){this.hit(c,target,c.attack+3);return;}
  if(c.type==='ankylo'&&r.turn%2)return;
  if(!target&&distance(c,r.player)<=1)return;
  const moves=c.type==='raptor'?2:1;
  for(let n=0;n<moves;n++){
   if(distance(c,target||r.player)<=1)break;
   const step=this.nextStep(c,target||r.player);
   if(!step||this.occupied(step,c))break;
   Object.assign(c,step);
  }
 }
 enemyTurn(){const r=this.run;for(const e of [...r.dungeon.enemies]){
  if(r.player.hp<=0)break;if(e.asleep>0){e.asleep--;continue;}
  const c=r.companion;const target=c&&distance(e,c)<distance(e,r.player)?c:r.player;
  if(distance(e,target)===1&&canStep(r.dungeon,e,target,e.type==='ptera')){this.hit(e,target,e.attack);if(c&&c.hp<=0){r.companion=null;this.log('仲間は町へひと足先に帰ったよ。');}continue;}
  if(e.type==='ankylo'&&r.turn%2)continue;
  const sameRoom=roomAt(r.dungeon,e)&&roomAt(r.dungeon,e)===roomAt(r.dungeon,target);
  if(distance(e,target)>7&&!sameRoom)continue;
  const moves=e.type==='raptor'&&r.turn%3===0?2:1;
  for(let i=0;i<moves;i++){const step=this.nextStep(e,target);if(!step||this.occupied(step,e))break;Object.assign(e,step);}
 }}
 triggerHouse(){const r=this.run,h=r.dungeon.house;if(!h||h.triggered||roomAt(r.dungeon,r.player)!==r.dungeon.rooms[h.roomIndex])return;h.triggered=true;const room=r.dungeon.rooms[h.roomIndex];const spots=[];for(let y=room.y;y<room.y+room.h;y++)for(let x=room.x;x<room.x+room.w;x++)if(!this.occupied({x,y})&&distance({x,y},r.player)>1&&!this.at({x,y},r.dungeon.stairs))spots.push({x,y});for(let i=0;i<Math.min(5,spots.length);i++){const p=spots.splice(Math.floor(this.random()*spots.length),1)[0];const e=new Enemy(i%2?'raptor':'slime',r.floor,p.x,p.y,`house${r.turn}-${i}`);e.asleep=2;r.dungeon.enemies.push(e);}this.log('モンスターハウス！ 巻物でピンチをチャンスに！');this.event('house',r.player);}
 finish(clear){
  const r=this.run,t=this.town;const coins=clear?r.coins:Math.ceil(r.coins*.6),points=r.floor*5+(clear?50:0);
  t.coins+=coins;t.points+=points;t.eggs+=r.eggs;t.best=Math.max(t.best,r.floor);if(clear)t.clears++;
  const rescued=r.player.inventory.slice(0,clear?CAPACITY:3);t.storage.push(...rescued);t.equipment=structuredClone(r.player.equipment);
  for(const type of r.recruited)if(!t.dinosaurs.some(d=>d.type===type))t.dinosaurs.push({id:type,type,level:1});
  this.result={clear,floor:r.floor,coins,points,eggs:r.eggs,items:rescued.length};this.run=null;this.persist();
 }
 townAction(type,index){
  if(this.run)return false;const t=this.town;
  if(type==='equip'){const i=t.storage[index];if(!i||!['sword','shield'].includes(i.type))return false;const old=t.equipment[i.type];t.equipment[i.type]=i;t.storage.splice(index,1);if(old)t.storage.push(old);}
  else if(type==='buy'){if(t.coins<20)return false;t.coins-=20;t.storage.push(item('potion'));}
  else if(type==='train'){const cost=30+t.training*20;if(t.points<cost||t.training>=10)return false;t.points-=cost;t.training++;}
  else if(type==='hatch'){if(t.eggs<1)return false;t.eggs--;const types=['raptor','ankylo','ptera'];const type=types[Math.floor(this.random()*3)];const pet=t.dinosaurs.find(d=>d.type===type);if(pet)pet.level++;else t.dinosaurs.push({id:type,type,level:1});}
  else if(type==='select'){t.selected=t.dinosaurs[index]?.id||null;}
  else if(type==='petTrain'){const pet=t.dinosaurs[index];if(!pet||t.coins<30)return false;t.coins-=30;pet.level++;}
  else return false;this.persist();return true;
 }
 pack(index){if(!this.run||this.run.turn!==0||this.run.floor!==1||this.run.player.inventory.length>=CAPACITY)return false;const i=this.town.storage[index];if(!i)return false;this.run.player.inventory.push(i);this.town.storage.splice(index,1);this.persist();return true;}
}
