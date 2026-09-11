// Keep browser gestures out of every game screen, including the modal top layer.
// Single-finger scrolling and native click/keyboard activation remain untouched.
export function installTouchGuards(doc) {
 const inGame = e => Boolean(e.target?.closest?.('#app, #dialog'));
 const prevent = e => { if (inGame(e) && e.cancelable) e.preventDefault(); };
 const preventPinch = e => { if (e.touches.length > 1) prevent(e); };
 const listeners = [
  ['gesturestart', prevent], ['gesturechange', prevent], ['gestureend', prevent],
  ['touchstart', preventPinch], ['touchmove', preventPinch],
  ['contextmenu', prevent], ['selectstart', prevent], ['dragstart', prevent],
 ];
 for (const [type, handler] of listeners) doc.addEventListener(type, handler, {passive:false});
 return () => { for (const [type, handler] of listeners) doc.removeEventListener(type, handler); };
}
