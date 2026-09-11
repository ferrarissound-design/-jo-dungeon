export const SPECIES={
 slime:{name:'ぷるりん',hp:10,attack:3,defense:0,xp:5,color:'#58c9ec',from:1},
 raptor:{name:'ピコラプトル',hp:15,attack:6,defense:0,xp:8,color:'#73d77a',from:2},
 ankylo:{name:'まるよろい',hp:21,attack:5,defense:3,xp:11,color:'#e9b853',from:4},
 ptera:{name:'そらひらり',hp:16,attack:5,defense:1,xp:10,color:'#c396f4',from:6}
};
export class Enemy {
 constructor(type,floor,x,y,id) {
  const s=SPECIES[type]; Object.assign(this,{type,x,y,id,hp:s.hp+floor-1,maxHp:s.hp+floor-1,attack:s.attack+Math.floor(floor/3),defense:s.defense,xp:s.xp,asleep:0});
 }
}
