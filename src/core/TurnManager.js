export class TurnManager {
 constructor(game){this.game=game;this.busy=false;}
 perform(action){
  if(this.busy||!this.game.run)return false;
  this.busy=true;
  try{
   const previous=this.game.run;
   const outcome=this.game.resolveAction(action);
   if(!outcome)return false;
   if(this.game.run===previous && outcome==='stairs'){
    previous.turn++; // A new floor gives the player a safe first look.
   }else if(this.game.run===previous){
    previous.turn++;
    if(outcome==='move'){previous.steps++; if(previous.steps%5===0)previous.player.hunger=Math.max(0,previous.player.hunger-1);}
    if(previous.player.hunger===0&&previous.turn%3===0)this.game.hurt(previous.player,1);
    if(this.game.run&&previous.player.hp>0){this.game.companionTurn();this.game.enemyTurn();}
    if(this.game.run&&previous.player.hp<=0)this.game.finish(false);
    if(this.game.run){if(previous.player.hunger>0&&previous.turn%10===0)previous.player.hp=Math.min(previous.player.maxHp,previous.player.hp+1);this.game.reveal();}
   }
   this.game.persist();return true;
  }finally{this.busy=false;}
 }
}
