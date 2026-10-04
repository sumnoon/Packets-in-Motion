import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('every Maya pose exposes the same editable anatomical groups and pivots',()=>{
  for(const pose of ['front','three-quarter','side','calm','wave','worried','celebrating','pointing']){
    const svg=fs.readFileSync(`assets/maya/maya-${pose}.svg`,'utf8');
    for(const part of ['head','eyes','mouth','brows','torso','arm-left','arm-right','leg-left','leg-right'])assert.ok(svg.includes(`data-part="${part}"`),`${pose}: ${part}`);
    assert.match(svg,/data-pivot=/);assert.doesNotMatch(svg,/<(?:image|text|linearGradient|radialGradient|filter)\b/);assert.doesNotMatch(svg,/NaN|undefined/);
  }
});
test('sheet supplies all requested turnaround views, poses, expressions and talking mouths',()=>{
  const svg=fs.readFileSync('assets/maya/maya-character-sheet.svg','utf8');
  for(const name of ['front','three-quarter','side'])assert.ok(svg.includes(`id="turnaround-${name}"`));
  for(const name of ['calm','wave','worried','celebrating','pointing'])assert.ok(svg.includes(`id="pose-${name}"`));
  for(const name of ['neutral','smile','worried','surprised','delighted','thinking','blink'])assert.ok(svg.includes(`id="expression-${name}"`));
  for(const name of ['closed','small','wide'])assert.ok(svg.includes(`id="talk-${name}-mouth"`));
});
