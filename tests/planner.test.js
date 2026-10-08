const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../planner.js');

test('2–64 teams: exact byes, highest seeds, N−1 matches, increasing points, no court overlaps', () => {
  for (let n=2; n<=64; n++) for (const courts of [1,2,4,16]) {
    const slots=P.initialSlots(n),plan=P.plan(slots,1440,courts);
    assert.equal(plan.schedule.length,n-1);
    const byes=plan.rounds[0].filter(m=>m.bye);
    assert.equal(byes.length,slots.length-n);
    assert.deepEqual(byes.map(m=>m.winner.seed).sort((a,b)=>a-b),Array.from({length:byes.length},(_,i)=>i+1));
    assert.equal(plan.overhead,0);
    assert.ok(plan.scheduled<=1440);
    for(let r=1;r<plan.points.length;r++) {assert.ok(plan.points[r]>plan.points[r-1]);assert.ok(plan.ds[r]>plan.ds[r-1]);}
    for(const m of plan.schedule){assert.equal(m.end-m.start,m.duration);assert.ok(m.court<=courts);}
    for(let c=1;c<=courts;c++){const ms=plan.schedule.filter(m=>m.court===c);for(let i=1;i<ms.length;i++)assert.ok(ms[i].start>=ms[i-1].end);}
    for(let r=1;r<plan.rounds.length;r++)assert.ok(Math.min(...plan.schedule.filter(m=>m.r===r).map(m=>m.start))>=Math.max(...plan.schedule.filter(m=>m.r===r-1).map(m=>m.end)));
  }
});

test('short windows scale targets down and insufficient time is rejected', () => {
  for(let n=2;n<=64;n++)for(const courts of [1,2,4]) {
    const slots=P.initialSlots(n);
    const min=P.plan(slots,1440,courts).minimum;
    if(min>15)assert.throws(()=>P.plan(slots,min-1,courts),/at least/);
    for(const minutes of [Math.max(15,min),Math.max(15,min+30),1440]){const p=P.plan(slots,minutes,courts);assert.ok(p.scheduled<=minutes);assert.ok(p.points[0]>=5);assert.ok(p.points.at(-1)<=21);}
  }
});

test('winners advance, completed bracket has a champion, changing an upstream winner invalidates descendants', () => {
  const slots=P.initialSlots(5),winners={};
  let rounds=P.build(slots,winners);
  for(let r=0;r<rounds.length;r++){
    rounds=P.build(slots,winners);
    for(const m of rounds[r])if(!m.bye)winners[m.id]=m.pair[0].team.id;
  }
  assert.equal(P.build(slots,winners).at(-1)[0].winner.id,'t1');
  const final=P.build(slots,winners).at(-1)[0];winners[final.id]=final.pair[1].team.id;
  assert.equal(P.build(slots,winners).at(-1)[0].winner.id,final.pair[1].team.id);
  delete winners.r1m1;
  assert.equal(P.build(slots,winners).at(-1)[0].winner,null);
});

test('bye swaps retain the bracket topology; invalid empty opening matches are rejected', () => {
  const slots=P.initialSlots(12);
  [slots[0],slots[1]]=[slots[1],slots[0]];
  assert.equal(P.plan(slots,240,2).schedule.length,11);
  const invalid=P.initialSlots(12);[invalid[0],invalid[5]]=[invalid[5],invalid[0]];
  assert.throws(()=>P.plan(invalid,240,2),/Every opening match/);
});

test('invalid scheduling inputs are rejected', () => {
  for(const courts of [0,-1,1.5,17])assert.throws(()=>P.plan(P.initialSlots(4),120,courts));
  for(const minutes of [NaN,0,14,1.5,1441])assert.throws(()=>P.plan(P.initialSlots(4),minutes,2));
});


test('timeline checkpoints identify the round in progress and exact round boundaries', () => {
  const plan=P.plan(P.initialSlots(12),240,2);
  const timeline=P.timeline(plan,240);
  assert.deepEqual(timeline.ticks.map(t=>t.minute),[0,30,60,90,120,150,180,210,240]);
  assert.deepEqual(timeline.stages.map(s=>[s.start,s.end]),[[0,28],[28,60],[60,77],[77,95]]);
  assert.equal(timeline.ticks.find(t=>t.minute===30).round,1);
  assert.equal(timeline.ticks.find(t=>t.minute===90).round,3);
  assert.equal(timeline.ticks.find(t=>t.minute===120).finished,true);
  const boundary={rounds:[[],[]],schedule:[{r:0,start:0,end:30},{r:1,start:30,end:60}],scheduled:60};
  assert.equal(P.timeline(boundary,60).ticks.find(t=>t.minute===30).round,1);
  assert.equal(P.timeline(boundary,60).ticks.at(-1).finished,true);
});

test('short and partial event windows have readable checkpoints', () => {
  assert.deepEqual(P.timeline(P.plan(P.initialSlots(2),15,1),15).ticks.map(t=>t.minute),[0,15]);
  assert.deepEqual(P.timeline(P.plan(P.initialSlots(2),31,1),31).ticks.map(t=>t.minute),[0,30]);
});


test('buffer is excluded from the play budget and point targets never exceed 21', () => {
  for(const n of [2,12,32,64])for(const percent of [0,10,25,50]){
    const p=P.plan(P.initialSlots(n),480,4,{},percent);
    assert.equal(p.buffer,Math.ceil(480*percent/100));
    assert.equal(p.playBudget,480-p.buffer);
    assert.ok(p.points.every(x=>x<=21));
    assert.equal(p.scheduled+p.slack+p.buffer,480);
    assert.ok(p.schedule.every(m=>m.end<=p.playBudget));
  }
  assert.throws(()=>P.plan(P.initialSlots(4),15,1,{},50),/at least/);
  assert.throws(()=>P.plan(P.initialSlots(4),120,1,{},51),/buffer/);
});
