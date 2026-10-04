import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('engineer assets preserve identity, editable anatomy and matching pose dimensions',()=>{
  for(const pose of ['front','three-quarter','side','typing','thinking','pointing','celebrating']){
    const svg=fs.readFileSync(`assets/engineer/engineer-${pose}.svg`,'utf8');
    for(const part of ['head','eyes','mouth','brows','glasses','torso','arm-left','arm-right','leg-left','leg-right'])assert.ok(svg.includes(`data-part="${part}"`),`${pose}: ${part}`);
    assert.match(svg,/viewBox="0 0 260 350"/);assert.match(svg,/#b98461/);assert.match(svg,/#34d399/);
    assert.doesNotMatch(svg,/<(?:image|text|linearGradient|radialGradient|filter)\b/);assert.doesNotMatch(svg,/NaN|undefined/);
  }
  for(const face of ['neutral','focused','thinking','concerned','delighted','blink']){
    const svg=fs.readFileSync(`assets/engineer/engineer-face-${face}.svg`,'utf8');
    assert.match(svg,/data-part="glasses"/);assert.match(svg,/#b98461/);
  }
});
test('engineer sheet contains requested views, poses, expressions and both portraits',()=>{
  const svg=fs.readFileSync('assets/engineer/engineer-character-sheet.svg','utf8');
  for(const name of ['front','three-quarter','side'])assert.ok(svg.includes(`id="turnaround-${name}"`));
  for(const name of ['typing','thinking','pointing','celebrating'])assert.ok(svg.includes(`id="pose-${name}"`));
  for(const name of ['neutral','focused','thinking','concerned','delighted','blink'])assert.ok(svg.includes(`id="expression-${name}"`));
  for(const who of ['maya','engineer']){
    assert.ok(svg.includes(`id="avatar-${who}"`));
    const portrait=fs.readFileSync(`assets/${who}/${who}-avatar.svg`,'utf8');
    assert.match(portrait,/viewBox="0 0 150 160"/);assert.match(portrait,/data-part="head"/);assert.match(portrait,/data-part="torso"/);
  }
});
