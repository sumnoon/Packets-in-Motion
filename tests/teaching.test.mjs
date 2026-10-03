import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {loadPage,ROOT} from './harness.mjs';
const page=loadPage(),lessons=page.get('chapters'),quiz=page.get('QUIZ');
const captions=id=>lessons.find(c=>c.id===id).beats.map(b=>b[2]).join(' ');
test('Raft teaches isolated stale leadership, log eligibility and current-term commitment',()=>{
  const text=captions('consensus');for(const p of [/same term/,/last-entry term first, then index/,/old-term requests/,/current term/,/older-term entry alone is insufficient/])assert.match(text,p);
  assert.ok(quiz.Advanced.make.questions.some(q=>q.ch==='consensus'&&/current.term/i.test(q.why)));
});
test('quorum overlap is qualified in captions, goal and quiz',()=>{
  for(const text of [captions('quorums'),page.get('CHAL').quorums.goal,quiz.Data.make.questions.find(q=>q.ch==='quorums').why])assert.match(text,/linearizability/);
  assert.match(captions('quorums'),/fallback nodes/);assert.match(captions('quorums'),/replicas retain acknowledged versions/);
});
test('schema costs and failed saga recovery remain explicit',()=>{
  assert.match(captions('sql-nosql'),/constant default without rewriting rows/);assert.match(captions('sql-nosql'),/clock_timestamp/);assert.match(captions('sql-nosql'),/Neither label alone/);
  assert.ok(quiz.Data.make.questions.some(q=>q.ch==='sql-nosql'&&q.why.includes('volatile')));
  for(const p of [/Persist saga progress/,/manual intervention/,/irreversible/,/does not guarantee automatic recovery/])assert.match(captions('transactions'),p);
  assert.ok(quiz.Advanced.make.questions.some(q=>q.ch==='transactions'&&q.why.includes('manual')));
});
test('every vector-clock sorting answer matches strict componentwise precedence',()=>{
  const p=loadPage();vm.runInContext('sortGame=o=>o',p.context);vm.runInContext(fs.readFileSync(path.join(ROOT,'src/challenges/conflicts.js'),'utf8'),p.context);
  const {cards}=p.get('CHAL').conflicts.make,seen=new Set();for(const card of cards){const [a,b]=[...card.t.matchAll(/\[([^\]]+)\]/g)].map(m=>m[1].split(',').map(s=>+s.split(':')[1]));
    const precedes=(x,y)=>x.every((n,i)=>n<=y[i])&&x.some((n,i)=>n<y[i]);const answer=a.every((n,i)=>n===b[i])?'eq':precedes(a,b)?'xy':precedes(b,a)?'yx':'c';assert.equal(card.b,answer,card.t);seen.add(answer);}
  assert.equal(seen.size,4);assert.match(captions('conflicts'),/at least one is strictly smaller/);
});
