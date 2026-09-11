const KEY='jo-adventure-v1';
export class SaveManager {
 constructor(storage=globalThis.localStorage){this.storage=storage;this.error='';}
 load(){try{const raw=this.storage.getItem(KEY);if(!raw)return null;const data=JSON.parse(raw);if(data.version!==1||!data.town||!Number.isFinite(data.town.coins)||!Array.isArray(data.town.storage))throw Error('save');if(data.run&&(!data.run.player||!Array.isArray(data.run.dungeon?.tiles)||!Array.isArray(data.run.player.inventory)))throw Error('run');return data;}catch{this.error='セーブを読み込めなかったよ。新しい冒険を始められるよ。';return null;}}
 save(game){try{this.storage.setItem(KEY,JSON.stringify({version:1,town:game.town,run:game.run,result:game.result}));this.error='';return true;}catch{this.error='保存できなかったよ。ブラウザの空き容量を確認してね。';return false;}}
}
