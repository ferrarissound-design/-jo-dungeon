export class Player {
 constructor(town) {
  this.x=0; this.y=0; this.hp=this.maxHp=40+town.training*3;
  this.level=1; this.xp=0; this.attack=7; this.defense=1; this.hunger=100;
  this.facing={x:0,y:1}; this.equipment=structuredClone(town.equipment);
  this.inventory=[{type:'potion',power:1},{type:'food',power:1},{type:'meat',power:1}];
 }
 static attack(p) {return p.attack+(p.equipment.sword?.power||0);}
 static defense(p) {return p.defense+(p.equipment.shield?.power||0);}
 static threshold(p) {return p.level*10;}
}
