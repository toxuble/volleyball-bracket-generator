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
  // USAV single-set allowances minus warm-up: 15 points ~14 min, 25 ~20 min.
  function setEstimate(points) {return points<=15?points*14/15:14+(points-15)*0.6;}
  function expectedSets(bestOf) {
    const wins=(bestOf+1)/2;let probability=1,expected=0;
    for(let lost=0;lost<wins;lost++) {
      if(lost===0)probability=2**(1-wins);
      else probability*= (wins+lost-1)/(2*lost);
      expected+=(wins+lost)*probability;
    }
    return expected;
  }
  function formatFor(minutes) {
    let best;
    for(const bestOf of [1,3,5,7,9]) {
      const sets=expectedSets(bestOf);
      const limit=Math.max(21,Math.ceil(15+(minutes/sets-14)/0.6)+1);
      // Prefer conventional shorter formats, allowing extra points when they fit better.
      const maxPoints=minutes>expectedSets(9)*setEstimate(35)?Math.min(5000,limit):35;
      for(let points=5;points<=maxPoints;points++) {
        const estimated=setEstimate(points)*sets;
        const score=Math.abs(estimated-minutes)+({1:0,3:0.4,5:1,7:2,9:3}[bestOf])+(points>21?(points-21)*0.05:0)+(bestOf>1&&points<11?(11-points)*0.05:0);
        if(!best||score<best.score)best={bestOf,points,expectedSets:sets,estimated,score};
      }
    }
    return best;
  }
  function distribute(total, weights) {
    const sum=weights.reduce((a,b)=>a+b,0),raw=weights.map(w=>total*w/sum),result=raw.map(Math.floor);
    const order=raw.map((v,i)=>({i,f:v-result[i]})).sort((a,b)=>b.f-a.f||a.i-b.i);
    for(let i=0,left=total-result.reduce((a,b)=>a+b,0);i<left;i++)result[order[i].i]++;
    return result;
  }
  function resizeRound(durations, r, requested, minima) {
    if(!Number.isInteger(r)||r<0||r>=durations.length||!Number.isFinite(requested))throw new Error('Choose a valid round duration.');
    if(durations.length===1)return durations.slice();
    const total=durations.reduce((a,b)=>a+b,0),others=durations.map((_,i)=>i).filter(i=>i!==r);
    const next=durations.slice(),value=Math.max(minima[r],Math.min(total-others.reduce((a,i)=>a+minima[i],0),Math.round(requested)));
    const delta=value-durations[r];next[r]=value;
    if(!others.length||delta===0)return next;
    const shares=distribute(Math.abs(delta),others.map(i=>delta>0?durations[i]-minima[i]:durations[i]));
    others.forEach((i,j)=>next[i]+=delta>0?-shares[j]:shares[j]);
    return next;
  }
  function plan(slots, minutes, courts, winners={}, bufferPercent=0, customDurations=null) {
    if(!Number.isInteger(minutes)||minutes<15||minutes>1440||!Number.isInteger(courts)||courts<1||courts>16) throw new Error('Use 15–1440 whole minutes and 1–16 courts.');
    if(!Array.isArray(slots)||slots.length<2||slots.length>64||!Number.isInteger(Math.log2(slots.length))||slots.filter(Boolean).length<2||slots.some((t,i)=>i%2===0&&!t&&!slots[i+1])) throw new Error('Every opening match must have at least one team in a bracket of 2–64 positions.');
    if(!Number.isFinite(bufferPercent)||bufferPercent<0||bufferPercent>50) throw new Error('Use a buffer between 0% and 50%.');
    const buffer=Math.ceil(minutes*bufferPercent/100),playBudget=minutes-buffer;
    const rounds=build(slots,winners),R=rounds.length,active=rounds.map(ms=>ms.filter(m=>!m.bye));
    const waves=active.map(ms=>Math.ceil(ms.length/courts));
    const minima=waves.map(w=>w*5),defaultsMin=waves.map((w,r)=>w*(5+r));
    const minimum=defaultsMin.reduce((a,b)=>a+b,0);
    if(playBudget<minimum) throw new Error(`This bracket needs at least ${Math.ceil(minimum/(1-bufferPercent/100))} event minutes with ${courts} court${courts===1?'':'s'}. Add time or courts.`);
    const extras=distribute(playBudget-minimum,waves.map((w,r)=>w*(14+4*r)));
    const automatic=defaultsMin.map((v,r)=>v+extras[r]);
    if(customDurations!==null&&(!Array.isArray(customDurations)||customDurations.length!==R||customDurations.some((d,r)=>!Number.isInteger(d)||d<minima[r])||customDurations.reduce((a,b)=>a+b,0)!==playBudget))throw new Error('Round durations must fill the play window and allow at least five minutes per court wave.');
    const roundDurations=customDurations?customDurations.slice():automatic,ds=roundDurations.map((d,r)=>d/waves[r]);
    const formats=ds.map(formatFor),points=formats.map(f=>f.points),schedule=[];let cursor=0;
    active.forEach((ms,r)=>{
      const waveDurations=distribute(roundDurations[r],Array(waves[r]).fill(1));
      for(let w=0;w<waves[r];w++){
        const duration=waveDurations[w],start=cursor;
        ms.slice(w*courts,(w+1)*courts).forEach((m,c)=>schedule.push({...m,court:c+1,start,end:start+duration,duration,points:points[r],bestOf:formats[r].bestOf,estimated:formats[r].estimated}));
        cursor+=duration;
      }
    });
    return {rounds,points,formats,ds,waves,roundDurations,automatic,minima,schedule,scheduled:playBudget,overhead:0,slack:0,buffer,bufferPercent,playBudget,minimum};
  }
  function timeline(plan, minutes) {
    const stages=plan.rounds.map((_,r)=>{const matches=plan.schedule.filter(m=>m.r===r);return {r,start:Math.min(...matches.map(m=>m.start)),end:Math.max(...matches.map(m=>m.end))};});
    const ticks=[];for(let minute=0;minute<=minutes;minute+=30)ticks.push(minute);
    if(minutes<30&&ticks.at(-1)!==minutes)ticks.push(minutes);
    return {stages,ticks:ticks.map(minute=>({minute,round:stages.find(s=>minute>=s.start&&minute<s.end)?.r??null,finished:minute>=plan.scheduled}))};
  }
  root.Planner={seedOrder,initialSlots,roundName,build,plan,timeline,resizeRound,setEstimate,expectedSets,formatFor};
  if(typeof module!=='undefined')module.exports=root.Planner;
})(typeof window==='undefined'?globalThis:window);
