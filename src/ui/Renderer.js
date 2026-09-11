import {WIDTH,HEIGHT,key} from '../core/DungeonGenerator.js';
import {ITEMS} from '../core/Item.js';
import {SPECIES} from '../core/Enemy.js';
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
// Original procedural character drawings. No external artwork is required.
export function character(c,x,y,size,type='hero',ally=false){
 c.save();c.translate(x,y);c.scale(size/40,size/40);ellipse(c,0,13,15,5,'#071c244d');
 if(type==='hero'){
  ellipse(c,-6,11,4,5,'#463c31');ellipse(c,6,11,4,5,'#463c31');ellipse(c,0,2,10,12,'#e98747');ellipse(c,-10,1,4,7,'#ffc58c');ellipse(c,10,1,4,7,'#ffc58c');ellipse(c,0,-10,11,10,'#ffcf9c');
  ellipse(c,0,-16,13,5,'#ffe29a');ellipse(c,0,-20,9,6,'#efc969');c.fillStyle='#9b7435';c.fillRect(-9,-19,18,3);ellipse(c,-4,-9,1.5,2,'#233e32');ellipse(c,4,-9,1.5,2,'#233e32');c.strokeStyle='#b2684b';c.beginPath();c.arc(0,-6,3,0,Math.PI);c.stroke();c.fillStyle='#fff1ae';c.fillRect(-3,0,6,7);
 }else if(type==='slime'){
  ellipse(c,0,1,15,13,SPECIES[type].color);ellipse(c,-6,-5,5,3,'#a4edff');ellipse(c,-5,1,2,3,'#163f50');ellipse(c,5,1,2,3,'#163f50');ellipse(c,0,6,3,2,'#207992');
 }else{
  const color=SPECIES[type].color;
  if(type==='ptera'){poly(c,[[-4,1],[-22,-12],[-16,8],[0,8]],color);poly(c,[[4,1],[22,-12],[16,8],[0,8]],color);}
  else{poly(c,[[-5,8],[-22,0],[-17,12],[0,13]],color);ellipse(c,-6,12,4,5,color);ellipse(c,7,12,4,5,color);}
  ellipse(c,0,3,type==='ankylo'?15:11,11,color);ellipse(c,5,-8,10,9,color);ellipse(c,12,-5,7,5,color);
  if(type==='ankylo'){ellipse(c,-3,0,11,8,'#aa8040');for(let i=-1;i<2;i++)poly(c,[[i*7-6,-3],[i*7-2,-12],[i*7+2,-3]],'#ffe99c');ellipse(c,-19,7,5,5,'#e9b853');}
  if(type==='raptor'){poly(c,[[-8,-3],[-9,-11],[-2,-5]],'#377f45');ellipse(c,9,4,5,3,color);}
  if(type==='ptera')poly(c,[[11,-9],[23,-4],[12,-1]],'#ffd578');
  ellipse(c,8,-10,3.5,4,'#fffbe3');ellipse(c,9,-10,1.7,2.5,'#25383e');ellipse(c,16,-6,1,1,'#334a3d');
 }
 if(ally){c.font='bold 12px sans-serif';c.textAlign='center';c.fillStyle='#ffdf70';c.fillText('♥',0,-28);}
 c.restore();
}
export class Renderer{
 constructor(canvas,mini,game){this.canvas=canvas;this.mini=mini;this.game=game;this.effects=[];this.animating=false;this.resizeObserver=new ResizeObserver(()=>this.draw());this.resizeObserver.observe(canvas);}
 fit(canvas){const rect=canvas.getBoundingClientRect();const dpr=Math.min(devicePixelRatio||1,2);if(!rect.width||!rect.height)return null;canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);return {c,w:rect.width,h:rect.height};}
 draw(){const r=this.game.run;if(!r)return;const fit=this.fit(this.canvas);if(!fit)return;const {c,w,h}=fit,d=r.dungeon,p=r.player;const tile=Math.max(25,Math.min(48,w/11,h/9));const ox=w/2-(p.x+.5)*tile,oy=h/2-(p.y+.5)*tile;this.transform={tile,ox,oy};c.fillStyle='#142d2b';c.fillRect(0,0,w,h);const seen=new Set(d.seen),vis=this.game.visible;
  for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++){const sx=ox+x*tile,sy=oy+y*tile;if(sx> w||sy>h||sx+tile<0||sy+tile<0||!seen.has(key(x,y)))continue;const lit=vis.has(key(x,y));if(d.tiles[y][x]){c.fillStyle=lit?((x+y)%2?'#83a169':'#8aa96e'):'#344f3e';c.fillRect(sx,sy,tile+.4,tile+.4);c.strokeStyle=lit?'#75935f':'#304a39';c.strokeRect(sx,sy,tile,tile);if(lit&&(x*7+y*3)%13===0){ellipse(c,sx+tile*.3,sy+tile*.6,2,1,'#bdd087');}}else{c.fillStyle=lit?'#3a684b':'#233e32';c.fillRect(sx,sy,tile+.4,tile+.4);c.fillStyle=lit?'#5b8158':'#2c4736';c.fillRect(sx+2,sy+2,tile-4,tile*.3);}}
  const center=o=>({x:ox+(o.x+.5)*tile,y:oy+(o.y+.5)*tile});
  if(seen.has(key(d.stairs.x,d.stairs.y))){const s=center(d.stairs);c.fillStyle='#f5df8a';c.fillRect(s.x-tile*.35,s.y-tile*.35,tile*.7,tile*.7);c.strokeStyle='#8a7742';c.lineWidth=3;for(let i=0;i<4;i++){c.beginPath();c.moveTo(s.x-tile*.25,s.y-tile*.22+i*tile*.14);c.lineTo(s.x+tile*.25-i*tile*.08,s.y-tile*.22+i*tile*.14);c.stroke();}if(r.floor===10){c.font=`${tile*.6}px sans-serif`;c.textAlign='center';c.fillText('🏆',s.x,s.y+tile*.2);}}
  c.textAlign='center';c.textBaseline='middle';c.font=`${tile*.58}px sans-serif`;
  for(const i of d.loot)if(vis.has(key(i.x,i.y))){const s=center(i);c.fillText(ITEMS[i.type].icon,s.x,s.y);}
  for(const box of d.chests)if(vis.has(key(box.x,box.y))){const s=center(box);c.fillText(box.opened?'▫️':'🎁',s.x,s.y);}
  const actors=[...d.enemies.filter(e=>vis.has(key(e.x,e.y))),...(r.companion?[r.companion]:[]),p].sort((a,b)=>a.y-b.y);
  for(const a of actors){const s=center(a);character(c,s.x,s.y,tile*.88,a===p?'hero':a.type,a===r.companion);if(a!==p&&a.hp<a.maxHp){c.fillStyle='#283e30';c.fillRect(s.x-tile*.35,s.y+tile*.38,tile*.7,3);c.fillStyle=a===r.companion?'#ffdc78':'#ff9d83';c.fillRect(s.x-tile*.35,s.y+tile*.38,tile*.7*a.hp/a.maxHp,3);}}
  const s=center(p);poly(c,[[s.x+p.facing.x*tile*.47+p.facing.y*4,s.y+p.facing.y*tile*.47-p.facing.x*4],[s.x+p.facing.x*tile*.6,s.y+p.facing.y*tile*.6],[s.x+p.facing.x*tile*.47-p.facing.y*4,s.y+p.facing.y*tile*.47+p.facing.x*4]],'#fff5b1');
  const now=performance.now();this.effects=this.effects.filter(e=>now-e.time<650);for(const e of this.effects){const s=center(e);c.globalAlpha=1-(now-e.time)/650;c.font='bold 21px sans-serif';c.strokeStyle='#27342a';c.lineWidth=3;c.strokeText(e.text,s.x,s.y-20-(now-e.time)/25);c.fillStyle='#fff1b1';c.fillText(e.text,s.x,s.y-20-(now-e.time)/25);}c.globalAlpha=1;
  const mf=this.fit(this.mini);if(mf){const m=mf.c,tw=mf.w/WIDTH,th=mf.h/HEIGHT;m.clearRect(0,0,mf.w,mf.h);for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++)if(d.tiles[y][x]&&seen.has(key(x,y))){m.fillStyle='#789b76';m.fillRect(x*tw,y*th,tw,th);}if(seen.has(key(d.stairs.x,d.stairs.y))){m.fillStyle='#ffe17a';m.fillRect(d.stairs.x*tw-1,d.stairs.y*th-1,4,4);}m.fillStyle='#fff';m.fillRect(p.x*tw-1,p.y*th-1,4,4);}
 }
 effect(e){if(e.type==='damage'){this.effects.push({...e,time:performance.now()});if(!this.animating){this.animating=true;const frame=()=>{this.draw();if(this.effects.length&&this.game.run)requestAnimationFrame(frame);else this.animating=false;};requestAnimationFrame(frame);}}}
}
export function townArt(canvas){const c=canvas.getContext('2d');const w=canvas.width=700,h=canvas.height=240;c.fillStyle='#244d39';c.fillRect(0,0,w,h);ellipse(c,350,210,310,100,'#3e7046');for(let i=0;i<15;i++)ellipse(c,i*55,45,32,48,i%2?'#326342':'#2b5a3d');ellipse(c,560,38,25,25,'#ffd76e');character(c,335,140,115,'hero');character(c,210,160,90,'raptor',true);character(c,460,160,100,'ankylo',true);character(c,570,100,70,'ptera',true);c.fillStyle='#e4ce7c';c.font='bold 15px sans-serif';c.textAlign='center';c.fillText('地下10階の おたからを さがそう！',350,219);}
