import test from 'node:test';
import assert from 'node:assert/strict';
import {installTouchGuards} from '../src/ui/TouchGuards.js';

function surface(doc, selector) {
 const target = {closest: selectors => selectors.split(', ').includes(selector) ? target : null};
 return (type, fingers = 0) => {
  const event = new Event(type, {cancelable:true});
  Object.defineProperties(event, {target:{value:target}, touches:{value:Array(fingers).fill({})}});
  doc.dispatchEvent(event);
  return event.defaultPrevented;
 };
}

test('town/adventure root and dialog suppress selection, callout and pinch', () => {
 const doc = new EventTarget();
 installTouchGuards(doc);
 for (const selector of ['#app', '#dialog']) {
  const dispatch = surface(doc, selector);
  for (const type of ['gesturestart','gesturechange','gestureend','contextmenu','selectstart','dragstart']) {
   assert.equal(dispatch(type), true, `${selector}: ${type}`);
  }
  for (const type of ['touchstart','touchmove']) assert.equal(dispatch(type, 2), true);
 }
});

test('single-finger scrolling, clicks, keyboard and unrelated surfaces remain native', () => {
 const doc = new EventTarget();
 const cleanup = installTouchGuards(doc);
 for (const selector of ['#app', '#dialog']) {
  const dispatch = surface(doc, selector);
  for (const type of ['touchstart','touchmove','touchend','pointerdown','pointerup','click','keydown']) {
   assert.equal(dispatch(type, 1), false, `${selector}: ${type}`);
  }
 }
 assert.equal(surface(doc, '#outside')('contextmenu'), false);
 assert.equal(surface(doc, '#outside')('touchmove', 2), false);
 cleanup();
 assert.equal(surface(doc, '#dialog')('gesturestart'), false);
 assert.equal(surface(doc, '#app')('touchmove', 2), false);
});
