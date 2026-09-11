export const ITEMS = {
 potion: {name:'げんきジュース',icon:'🧃',description:'HPを25回復するよ。'},
 sword: {name:'たんけんソード',icon:'🗡️',description:'装備すると攻撃力アップ。'},
 shield: {name:'まもりの盾',icon:'🛡️',description:'装備すると受けるダメージが減るよ。'},
 food: {name:'ふわふわパン',icon:'🍞',description:'おなかが45回復するよ。'},
 stone: {name:'まんまる石',icon:'🪨',description:'向いている方向へ投げて攻撃！'},
 scroll: {name:'ぴかぴか巻物',icon:'📜',description:'見えている敵に12ダメージ。3ターンお休みさせるよ。'},
 meat: {name:'恐竜の肉',icon:'🍖',description:'となりの恐竜に使うと75%で仲間に！ 食べるとおなか20回復。'}
};
export function item(type, power=1) { return {type,power}; }
export function label(i) { return ITEMS[i.type].name + (['sword','shield'].includes(i.type)?` +${i.power}`:''); }
