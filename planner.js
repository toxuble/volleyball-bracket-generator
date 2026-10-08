(function (root) {
  'use strict';
  function seedOrder(size) { let order = [1, 2]; while (order.length < size) { const n = order.length * 2 + 1; order = order.flatMap(x => [x, n - x]); } return order; }
  function roundName(r, rounds) { const left = rounds-r; return left===1?'Championship':left===2?'Semifinals':left===3?'Quarterfinals':`Round of ${2**left}`; }
  function initialSlots(n) { const p=2**Math.ceil(Math.log2(n)); return seedOrder(p).map(seed=>seed<=n?{id:`t${seed}`, name:`Team ${String(seed).padStart(2,'0')}`,seed}:null); }
  function build(slots, winners) {
    const rounds=[]; let entrants=slots.map(t=>t?{team:t,label:t.name,ready:true}:{team:null,label:'BYE',ready:true});
    for(let r=0;entrants.length>1;r++) {
      const matches=[]; const next=[];
      for(let i=0;i<entrants.length;i+=2) {
        const pair=entrants.slice(i,i+2),id=`r${r}m${i/2}`;
        const bye=pair.every(e=>e.ready)&&pair.some(e=>!e.team);
        const selected=pair.find(e=>e.team&&e.team.id===winners[id]);
        const winner=bye?pair.find(e=>e.team)?.team:(pair.every(e=>e.ready&&e.team)&&selected?selected.team:null);
        matches.push({id,r,index:i/2,pair,bye,winner});
        next.push(winner?{team:winner,label:winner.name,ready:true}:{team:null,label:`Winner of R${r+1} · M${i/2+1}`,ready:false});
      }
      rounds.push(matches); entrants=next;
    }
    return rounds;
  }
  function plan(slots, minutes, courts, winners={}) {
    if(!Number.isInteger(minutes)||minutes<15||minutes>1440||!Number.isInteger(courts)||courts<1||courts>16) throw new Error('Use 15–1440 whole minutes and 1–16 courts.');
    if(!Array.isArray(slots)||slots.length<2||slots.length>64||!Number.isInteger(Math.log2(slots.length))||slots.filter(Boolean).length<2||slots.some((t,i)=>i%2===0&&!t&&!slots[i+1])) throw new Error('Every opening match must have at least one team in a bracket of 2–64 positions.');
    const rounds=build(slots,winners),R=rounds.length;
    const active=rounds.map(ms=>ms.filter(m=>!m.bye));
    const waves=active.map(ms=>Math.ceil(ms.length/courts));
    const weights=rounds.map((_,r)=>{const left=R-r;return left===1?35:left===2?25:left===3?21:15;});
    const caps=weights.slice();for(let r=R-2;r>=0;r--)caps[r]=Math.min(caps[r],caps[r+1]-1);
    // USAV single-set allowances less the six-minute warm-up: 15 pts ~14 min,
    // 25 pts ~20 min. Interpolate between them, extrapolate outside them.
    function estimate(points) {return Math.ceil(points<=15?points*14/15:14+(points-15)*0.6);}
    function targets(scale) {let prev=4;return weights.map((w,r)=>{const points=Math.min(caps[r],Math.max(prev+1,Math.floor(w*scale)));prev=points;return points;});}
    function durations(points) {let prev=0;return points.map(p=>{const d=Math.max(prev+1,estimate(p));prev=d;return d;});}
    function cost(points) {return durations(points).reduce((a,d,r)=>a+d*waves[r],0);}
    const minimum=cost(targets(0));
    if(minutes<minimum) throw new Error(`This bracket needs at least ${minimum} minutes with ${courts} court${courts===1?'':'s'}. Add time or courts.`);
    let lo=0,hi=100; for(let i=0;i<60;i++){const mid=(lo+hi)/2;if(cost(targets(mid))<=minutes)lo=mid;else hi=mid;}
    const points=targets(lo),ds=durations(points),scheduled=cost(points);let cursor=0;const schedule=[];
    active.forEach((ms,r)=>{for(let w=0;w<waves[r];w++){const start=cursor;ms.slice(w*courts,(w+1)*courts).forEach((m,c)=>schedule.push({...m,court:c+1,start,end:start+ds[r],duration:ds[r],points:points[r]}));cursor+=ds[r];}});
    return {rounds,points,ds,waves,weights,schedule,scheduled,overhead:0,slack:minutes-scheduled,minimum};
  }
  function timeline(plan, minutes) {
    const stages=plan.rounds.map((_,r)=>{const matches=plan.schedule.filter(m=>m.r===r);return {r,start:Math.min(...matches.map(m=>m.start)),end:Math.max(...matches.map(m=>m.end))};});
    const ticks=[];for(let minute=0;minute<=minutes;minute+=30)ticks.push(minute);
    if(minutes<30&&ticks.at(-1)!==minutes)ticks.push(minutes);
    return {stages,ticks:ticks.map(minute=>({minute,round:stages.find(s=>minute>=s.start&&minute<s.end)?.r??null,finished:minute>=plan.scheduled}))};
  }
  root.Planner={seedOrder,initialSlots,roundName,build,plan,timeline};
  if(typeof module!=='undefined')module.exports=root.Planner;
})(typeof window==='undefined'?globalThis:window);
