import {Enemy,SPECIES} from './Enemy.js';
import {item} from './Item.js';
export const WIDTH=35, HEIGHT=27;
export const key=(x,y)=>`${x},${y}`;
export const distance=(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));
export const DIRS=[{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0},{x:1,y:-1},{x:1,y:1},{x:-1,y:1},{x:-1,y:-1}];
export class DungeonGenerator {
 constructor(random=Math.random){this.random=random;}
 int(a,b){return a+Math.floor(this.random()*(b-a+1));}
 generate(floor){
  const tiles=Array.from({length:HEIGHT},()=>Array(WIDTH).fill(0));
  const rooms=[];
  // One room per partition; a spanning chain guarantees connectivity.
  for(let gy=0;gy<3;gy++) for(let gx=0;gx<3;gx++){
   const w=this.int(5,8),h=this.int(4,6),x=gx*11+this.int(1,10-w),y=gy*9+this.int(1,8-h);
   const r={x,y,w,h,cx:x+Math.floor(w/2),cy:y+Math.floor(h/2)}; rooms.push(r);
   for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)tiles[yy][xx]=1;
  }
  const connect=(a,b)=>{let x=a.cx,y=a.cy; while(x!==b.cx){tiles[y][x]=1;x+=Math.sign(b.cx-x);}while(y!==b.cy){tiles[y][x]=1;y+=Math.sign(b.cy-y);}tiles[y][x]=1;};
  const order=[0,1,2,5,4,3,6,7,8]; for(let i=1;i<order.length;i++)connect(rooms[order[i-1]],rooms[order[i]]);
  if(this.random()<.6)connect(rooms[1],rooms[4]); if(this.random()<.6)connect(rooms[4],rooms[7]);
  const start={x:rooms[0].cx,y:rooms[0].cy},stairs={x:rooms[8].cx,y:rooms[8].cy};
  const occupied=new Set([key(start.x,start.y),key(stairs.x,stairs.y)]);
  const place=(r)=>{for(let n=0;n<100;n++){const p={x:this.int(r.x,r.x+r.w-1),y:this.int(r.y,r.y+r.h-1)};const k=key(p.x,p.y);if(!occupied.has(k)){occupied.add(k);return p;}}return null;};
  const enemies=[], loot=[],chests=[];
  const types=Object.keys(SPECIES).filter(t=>SPECIES[t].from<=floor);
  let id=0;
  for(let i=1;i<rooms.length;i++){
   for(let j=0;j<(i%3===0?2:1);j++){const p=place(rooms[i]);if(p)enemies.push(new Enemy(types[this.int(0,types.length-1)],floor,p.x,p.y,`f${floor}e${id++}`));}
  }
  const pool=['potion','food','stone','meat','scroll','sword','shield'];
  for(let i=0;i<rooms.length;i++){
   const p=place(rooms[i]);if(p)loot.push({...p,...item(pool[this.int(0,pool.length-1)],this.int(1,1+Math.ceil(floor/2)))});
   if(i%3===1){const p=place(rooms[i]);if(p)chests.push({...p,opened:false});}
  }
  // Always offer food and healing early, with better gear deeper down.
  for(const type of ['food','potion']){const p=place(rooms[0]);if(p)loot.push({...p,...item(type)});}
  let house=null;
  if(floor>=3&&this.random()<.3){const roomIndex=this.int(3,7);house={roomIndex,triggered:false};for(let i=0;i<3;i++){const p=place(rooms[roomIndex]);if(p)loot.push({...p,...item(i===0?'scroll':'potion')});}const p=place(rooms[roomIndex]);if(p)chests.push({...p,opened:false});}
  return {tiles,rooms,start,stairs,enemies,loot,chests,house,seen:[],floor};
 }
}
export function walkable(d,x,y){return d.tiles[y]?.[x]===1;}
export function canStep(d,a,b,flying=false){
 if(!walkable(d,b.x,b.y))return false;
 const dx=b.x-a.x,dy=b.y-a.y;
 if(Math.abs(dx)>1||Math.abs(dy)>1)return false;
 // Flying crosses diagonal corners, never solid wall tiles.
 return flying||!dx||!dy||(walkable(d,a.x+dx,a.y)&&walkable(d,a.x,a.y+dy));
}
export function roomAt(d,p){return d.rooms.find(r=>p.x>=r.x&&p.x<r.x+r.w&&p.y>=r.y&&p.y<r.y+r.h);}
export function visibility(d,p){
 const visible=new Set(),r=roomAt(d,p);
 const add=(x,y)=>{if(x>=0&&y>=0&&x<WIDTH&&y<HEIGHT)visible.add(key(x,y));};
 if(r)for(let y=r.y-1;y<=r.y+r.h;y++)for(let x=r.x-1;x<=r.x+r.w;x++)add(x,y);
 for(let y=p.y-2;y<=p.y+2;y++)for(let x=p.x-2;x<=p.x+2;x++){
  // Corridor vision uses a short line-of-sight ray, stopping at walls.
  let xx=p.x,yy=p.y,dx=x-xx,dy=y-yy,n=Math.max(Math.abs(dx),Math.abs(dy));
  for(let i=0;i<=n;i++){const rx=Math.round(p.x+dx*i/(n||1)),ry=Math.round(p.y+dy*i/(n||1));add(rx,ry);if(!walkable(d,rx,ry))break;}
 }
 return visible;
}
