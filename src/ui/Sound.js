export class Sound {
 constructor(){this.enabled=false;this.context=null;}
 toggle(){this.enabled=!this.enabled;if(this.enabled)this.play('level');return this.enabled;}
 play(type){if(!this.enabled)return;try{const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;this.context??=new Audio();this.context.resume().catch(()=>{});const ctx=this.context;const notes={attack:[180,100],defeat:[400,600,800],pickup:[700,1000],level:[440,554,659,880],stairs:[330,440,660],damage:[140,90],house:[190,190,120]}[type];if(!notes)return;notes.forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+i*.07;o.type=type==='damage'?'triangle':'sine';o.frequency.value=f;g.gain.setValueAtTime(.065,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+.13);});}catch{}}
}
