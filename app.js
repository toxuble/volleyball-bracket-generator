'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='sideline-volleyball-points-v2';
let state={count:12,minutes:240,size:6,courts:2,start:'09:00',bufferPercent:10,roundDurations:null,slots:Planner.initialSlots(12),winners:{}};
try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved&&saved.count>=2&&saved.count<=64&&Array.isArray(saved.slots)&&saved.slots.length===2**Math.ceil(Math.log2(saved.count))&&saved.slots.filter(Boolean).length===saved.count&&new Set(saved.slots.filter(Boolean).map(t=>t.id)).size===saved.count){Planner.plan(saved.slots,saved.minutes,saved.courts,saved.winners,saved.bufferPercent??10);state={...saved,bufferPercent:saved.bufferPercent??10,roundDurations:null};
  if(saved.roundDurations){try{Planner.plan(saved.slots,saved.minutes,saved.courts,saved.winners,state.bufferPercent,saved.roundDurations);state.roundDurations=saved.roundDurations;}catch(e){}}}}catch(e){}
let currentPlan,dragIndex=null,toastTimer;
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3000);}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));$('saveStatus').textContent='Saved on this device';}catch(e){$('saveStatus').textContent='Session only · storage unavailable';}}
function syncInputs(){ $('teamCount').value=state.count;$('eventMinutes').value=state.minutes;$('teamSize').value=state.size;$('courtCount').value=state.courts;$('startTime').value=state.start;$('bufferPercent').value=state.bufferPercent; hoursNote(); }
function hoursNote(){const m=Number($('eventMinutes').value);$('hoursNote').textContent=`${Math.floor(m/60)} hr ${m%60} min from start to finish`;}
function clock(offset){const [h,m]=state.start.split(':').map(Number);const total=h*60+m+offset;return `${String(Math.floor(total/60)%24).padStart(2,'0')}:${String(total%60).padStart(2,'0')}${total>=1440?' +1 day':''}`;}
function decimal(n){return Number(n.toFixed(1));}
function formatLabel(f){return `${f.bestOf===1?'1 set':`Best of ${f.bestOf}`} · to ${f.points} pts`;}
function matchLabel(m){return `R${m.r+1} · M${m.index+1}`;}
function cleanWinners(){const valid={};Planner.build(state.slots,state.winners).flat().forEach(m=>{if(!m.bye&&m.winner)valid[m.id]=m.winner.id;});state.winners=valid;}
function render(){
  cleanWinners();currentPlan=Planner.plan(state.slots,state.minutes,state.courts,state.winners,state.bufferPercent,state.roundDurations);const p=currentPlan,R=p.rounds.length,byes=state.slots.length-state.count;
  $('stats').innerHTML=`<div class="stat"><span>Teams</span><strong>${state.count}</strong><small>${state.count*state.size} players</small></div><div class="stat"><span>Matches</span><strong>${state.count-1}</strong><small>${R} rounds</small></div><div class="stat"><span>Opening byes</span><strong>${byes}</strong><small>auto-advance</small></div><div class="stat"><span>Event window</span><strong>${Math.floor(state.minutes/60)}<small>h ${state.minutes%60?state.minutes%60+'m':''}</small></strong><small>${state.courts} court${state.courts===1?'':'s'}</small></div>`;
  const assignments=new Map(p.schedule.map(m=>[m.id,m]));
  $('bracket').innerHTML=p.rounds.map((ms,r)=>`<section class="round"><div class="round-header ${r===R-1?'final':''}"><strong>${r===R-1?'':''}${Planner.roundName(r,R)}</strong><span>${formatLabel(p.formats[r])}</span></div><div class="matches">${ms.map(m=>{
    const a=assignments.get(m.id);return `<div class="match ${r===R-1?'last':''}"><div class="match-meta"><span>${matchLabel(m)}</span><span>${m.bye?'AUTO ADVANCE':`Court ${a.court} · Start ${clock(a.start)}`}</span></div>${m.bye?'':`<div class="match-duration">Slot: ${a.duration} min · ~${decimal(a.estimated)} min play</div>`}<div class="match-card">${m.pair.map((e,j)=>{
      const idx=m.index*2+j,win=e.team&&m.winner?.id===e.team.id;
      return `<div class="team-row ${win?'winner':''} ${!e.team&&e.ready?'bye':''}" ${r===0?`data-slot="${idx}" draggable="${!!e.team}"`:''}>${r===0?'<span class="drag-handle" aria-hidden="true">⠿</span>':''}<span class="seed">${e.team?e.team.seed:'–'}</span>${r===0&&e.team?`<input class="team-name" value="${esc(e.team.name)}" maxlength="48" data-name="${idx}" aria-label="Name of team in opening slot ${idx+1}"><div class="move-actions"><button class="mini" data-move="${idx}" data-dir="-1" aria-label="Move ${esc(e.team.name)} up" ${idx===0?'disabled':''}>↑</button><button class="mini" data-move="${idx}" data-dir="1" aria-label="Move ${esc(e.team.name)} down" ${idx===state.slots.length-1?'disabled':''}>↓</button></div>`:`<span class="team-text" title="${esc(e.label)}">${esc(e.label)}</span>`}${e.team?`<button class="advance" data-match="${m.id}" data-team="${esc(e.team.id)}" aria-label="${win?'Undo advancement of':'Advance'} ${esc(e.team.name)} in ${matchLabel(m)}" aria-pressed="${!!win}" ${m.bye||!m.pair.every(x=>x.team&&x.ready)?'disabled':''}>${win?'✓':'›'}</button>`:''}</div>`;
    }).join('')}</div></div>`;
  }).join('')}</div></section>`).join('')+`<section class="champion"><div class="live-label">Champion</div><strong>${esc(p.rounds.at(-1)[0].winner?.name||'Not decided')}</strong><small>${p.rounds.at(-1)[0].winner?'Winner':'Awaiting final result'}</small></section>`;
  const byeTeams=p.rounds[0].filter(m=>m.bye).map(m=>m.winner.name);
  $('byeNote').textContent=byes?`${byes} byes · highest seeds by default`:'A full bracket · no byes';$('byeNote').title=byeTeams.join(', ');
  $('timeDescription').textContent=`${clock(0)}–${clock(state.minutes)} · ${p.playBudget} min allocated to rounds + ${p.buffer} min buffer = ${state.minutes} min total`;
  $('roundTimes').innerHTML=p.formats.map((f,r)=>`<div class="round-time"><small>${Planner.roundName(r,R)}</small><strong>${f.points} <span>pts / set</span></strong><span>${f.bestOf===1?'One set':`Best of ${f.bestOf} · first to ${(f.bestOf+1)/2} set wins`}<br>~${decimal(f.estimated)} min play / match<br>${p.roundDurations[r]} min round · ${p.waves[r]} court wave${p.waves[r]===1?'':'s'}</span></div>`).join('');
  $('timingMessage').className='timing-message';
  $('timingMessage').textContent='The allotted round slots and buffer fill the whole window. Formats are fitted to those slots using estimated playing time. Games end by score; they may finish earlier or later. Warm-ups and breaks are excluded.';
  $('scheduleRows').innerHTML=p.schedule.map(m=>`<tr><td>${matchLabel(m)}<br><small>${Planner.roundName(m.r,R)}</small></td><td>${m.pair.map(e=>esc(e.label)).join(' <span class="versus">vs</span> ')}</td><td>Court ${m.court}</td><td>${clock(m.start)}</td><td>${clock(m.end)}</td><td>${formatLabel(m)} · win by 2</td><td>${m.duration} min slot<br>~${decimal(m.estimated)} min play</td></tr>`).join('');
  renderTimeline(p);save();requestAnimationFrame(drawConnectors);
}
function elapsed(minutes){const h=Math.floor(minutes/60),m=minutes%60;return h?`${h}h${m?` ${m}m`:''}`:`${m}m`;}
function renderTimeline(p){
  const {stages,ticks}=Planner.timeline(p,state.minutes),R=p.rounds.length;
  $('timeline').style.minWidth=`${Math.max(600,Math.ceil(state.minutes/30)*100)}px`;
  $('timeline').innerHTML=`<div class="timeline-track" aria-label="Allocated round durations">${stages.map(s=>`<div class="timeline-segment ${s.r===R-1?'timeline-final':''}" style="width:${(s.end-s.start)/state.minutes*100}%" title="${Planner.roundName(s.r,R)}: ${elapsed(s.end-s.start)}, ${formatLabel(p.formats[s.r])}"><span>${s.r===R-1?'Final':`R${s.r+1}`}</span></div>`).join('')}${p.buffer?`<div class="timeline-reserve" style="width:${p.buffer/state.minutes*100}%" title="${p.bufferPercent}% overrun buffer: ${p.buffer} minutes">${p.bufferPercent}% buffer</div>`:''}</div>${stages.slice(0,-1).map(s=>`<button class="timeline-handle" data-boundary="${s.r}" role="slider" aria-label="Boundary after round ${s.r+1}" aria-valuemin="${s.start+p.minima[s.r]}" aria-valuemax="${stages[s.r+1].end-p.minima[s.r+1]}" aria-valuenow="${s.end}" aria-valuetext="${elapsed(s.end)} from event start" style="left:calc(14px + (100% - 28px) * ${s.end/state.minutes})" title="Drag to move this boundary. Arrow keys adjust by a minute."><span>Ⅱ</span></button>`).join('')}<div class="timeline-axis">${ticks.map((t,i)=>`<div class="timeline-tick ${i===0?'first':i===ticks.length-1?'last':''}" style="left:${t.minute/state.minutes*100}%"><strong>${elapsed(t.minute)}</strong><small>${clock(t.minute)}</small><span>${t.finished?(t.minute===state.minutes?'Event window ends':'Overrun buffer'):`R${t.round+1}<br>${esc(Planner.roundName(t.round,R))}`}</span></div>`).join('')}</div>`;
  $('roundSchedule').innerHTML=stages.map(s=>{
    const r=s.r,max=p.playBudget-p.minima.reduce((a,v,i)=>a+(i===r?0:v),0);
    return `<tr><td>Round ${r+1} · ${Planner.roundName(r,R)}<br><small>${formatLabel(p.formats[r])}</small></td><td>${clock(s.start)}<br><small>${elapsed(s.start)} elapsed</small></td><td class="duration-cell"><div class="duration-controls"><input type="range" data-round-duration="${r}" min="${p.minima[r]}" max="${max}" value="${p.roundDurations[r]}" aria-label="Round ${r+1} duration slider" ${R===1?'disabled':''}><input type="number" data-round-duration="${r}" min="${p.minima[r]}" max="${max}" value="${p.roundDurations[r]}" aria-label="Round ${r+1} duration in minutes" ${R===1?'disabled':''}><span>min</span></div></td><td>${clock(s.end)}<br><small>${elapsed(s.end)} elapsed</small></td></tr>`;
  }).join('')+ (p.buffer?`<tr class="buffer-row"><td>Overrun buffer · ${p.bufferPercent}%</td><td>${clock(p.playBudget)}<br><small>${elapsed(p.playBudget)} elapsed</small></td><td>${p.buffer} min</td><td>${clock(state.minutes)}<br><small>${elapsed(state.minutes)} elapsed</small></td></tr>`:'');
  $('allocationStatus').textContent=`${p.playBudget} min rounds + ${p.buffer} min buffer = ${state.minutes} min · ${state.roundDurations?'Custom allocation':'Automatic allocation'}`;
}
let boundaryDrag=null;
function setBoundary(r,minute,base=currentPlan.roundDurations){
  const before=base.slice(0,r).reduce((a,b)=>a+b,0),end=before+base[r]+base[r+1];
  const boundary=Math.max(before+currentPlan.minima[r],Math.min(end-currentPlan.minima[r+1],Math.round(minute)));
  const durations=base.slice();durations[r]=boundary-before;durations[r+1]=end-boundary;
  state.roundDurations=durations;render();
}
$('timeline').addEventListener('pointerdown',e=>{
  const handle=e.target.closest('[data-boundary]');if(!handle)return;e.preventDefault();
  const r=Number(handle.dataset.boundary),track=$('timeline').querySelector('.timeline-track').getBoundingClientRect();
  boundaryDrag={r,startX:e.clientX,end:Number(handle.getAttribute('aria-valuenow')),base:currentPlan.roundDurations.slice(),width:track.width,pointer:e.pointerId};
  $('timeline').setPointerCapture(e.pointerId);
});
$('timeline').addEventListener('pointermove',e=>{if(boundaryDrag){const d=boundaryDrag;setBoundary(d.r,d.end+(e.clientX-d.startX)/d.width*state.minutes,d.base);}});
function endBoundary(e){if(!boundaryDrag)return;boundaryDrag=null;if($('timeline').hasPointerCapture(e.pointerId))$('timeline').releasePointerCapture(e.pointerId);}
$('timeline').addEventListener('pointerup',endBoundary);$('timeline').addEventListener('pointercancel',endBoundary);
$('timeline').addEventListener('keydown',e=>{
  const handle=e.target.closest('[data-boundary]');if(!handle)return;
  const steps={ArrowLeft:-1,ArrowDown:-1,ArrowRight:1,ArrowUp:1};if(!(e.key in steps)&&!['Home','End'].includes(e.key))return;
  e.preventDefault();const r=Number(handle.dataset.boundary),value=e.key==='Home'?Number(handle.getAttribute('aria-valuemin')):e.key==='End'?Number(handle.getAttribute('aria-valuemax')):Number(handle.getAttribute('aria-valuenow'))+steps[e.key]*(e.shiftKey?5:1);
  setBoundary(r,value);$('timeline').querySelector(`[data-boundary="${r}"]`).focus();
});
function applyDuration(e){
  const input=e.target.closest('[data-round-duration]');if(!input)return;
  if(!Number.isFinite(Number(input.value))||input.value===''){render();return;}
  const r=Number(input.dataset.roundDuration),value=Number(input.value);
  if(value===currentPlan.roundDurations[r])return;
  state.roundDurations=Planner.resizeRound(currentPlan.roundDurations,r,value,currentPlan.minima);render();
  if(input.type==='range')$('roundSchedule').querySelector(`input[type="range"][data-round-duration="${r}"]`).focus();
}
$('roundSchedule').addEventListener('change',applyDuration);
$('roundSchedule').addEventListener('focusout',e=>{if(e.target.type==='number')applyDuration(e);});
$('roundSchedule').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.type==='number'){e.preventDefault();applyDuration(e);}});
$('resetTimeline').addEventListener('click',()=>{state.roundDurations=null;render();toast('Automatic time allocation restored. Teams and winners kept.');});
function drawConnectors(){
  const root=$('bracket');root.querySelector('.connectors')?.remove();if(!root.offsetWidth)return;
  const bounds=root.getBoundingClientRect(),rounds=[...root.querySelectorAll('.round')];
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','connectors');svg.setAttribute('aria-hidden','true');svg.setAttribute('width',root.scrollWidth);svg.setAttribute('height',root.scrollHeight);
  for(let r=0;r<rounds.length-1;r++){const from=[...rounds[r].querySelectorAll('.match-card')],to=[...rounds[r+1].querySelectorAll('.match-card')];from.forEach((card,i)=>{const a=card.getBoundingClientRect(),b=to[Math.floor(i/2)].getBoundingClientRect(),x1=a.right-bounds.left,x2=b.left-bounds.left,y1=a.top+a.height/2-bounds.top,y2=b.top+b.height/2-bounds.top;const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',`M ${x1} ${y1} H ${(x1+x2)/2} V ${y2} H ${x2}`);svg.append(path);});}
  root.prepend(svg);
}
window.addEventListener('resize',()=>requestAnimationFrame(drawConnectors));
function swap(a,b){if(a===b||a<0||b<0||a>=state.slots.length||b>=state.slots.length)return;const candidate=state.slots.slice();[candidate[a],candidate[b]]=[candidate[b],candidate[a]];if(candidate.some((t,i)=>i%2===0&&!t&&!candidate[i+1])){toast('Keep at least one team in every opening match. Swap with a different position.');return;}state.slots=candidate;state.winners={};render();toast('Positions swapped. Match results cleared.');}
function view(name){['bracket','schedule','guide'].forEach(v=>$(v+'View').hidden=v!==name);document.querySelectorAll('.nav-item').forEach(b=>{b.classList.toggle('active',b.dataset.view===name);b.setAttribute('aria-pressed',String(b.dataset.view===name));});if(name==='bracket')requestAnimationFrame(drawConnectors);}
document.addEventListener('click',e=>{
  commitNames();
  const v=e.target.closest('[data-view]');if(v){render();view(v.dataset.view);}
  const move=e.target.closest('[data-move]');if(move)swap(Number(move.dataset.move),Number(move.dataset.move)+Number(move.dataset.dir));
  const advance=e.target.closest('[data-match]');if(advance&&!advance.disabled){const {match,team}=advance.dataset;if(state.winners[match]===team)delete state.winners[match];else state.winners[match]=team;render();}
});
function commitNames(){document.querySelectorAll('[data-name]').forEach(input=>{const t=state.slots[Number(input.dataset.name)];if(t)t.name=input.value.trim()||`Team ${t.seed}`;});save();}
$('bracket').addEventListener('input',e=>{if(e.target.dataset.name!==undefined)commitNames();});
$('bracket').addEventListener('focusout',e=>{if(e.target.dataset.name!==undefined)commitNames();});
$('bracket').addEventListener('dragstart',e=>{const row=e.target.closest('[data-slot]');if(!row)return;dragIndex=Number(row.dataset.slot);e.dataTransfer.setData('text/plain',String(dragIndex));e.dataTransfer.effectAllowed='move';});
$('bracket').addEventListener('dragover',e=>{const row=e.target.closest('[data-slot]');if(row&&dragIndex!==null){e.preventDefault();e.dataTransfer.dropEffect='move';row.classList.add('drop-hover');}});
$('bracket').addEventListener('dragleave',e=>e.target.closest('[data-slot]')?.classList.remove('drop-hover'));
$('bracket').addEventListener('drop',e=>{e.preventDefault();const row=e.target.closest('[data-slot]');if(row&&dragIndex!==null)swap(dragIndex,Number(row.dataset.slot));dragIndex=null;});
$('bracket').addEventListener('dragend',()=>{dragIndex=null;document.querySelectorAll('.drop-hover').forEach(el=>el.classList.remove('drop-hover'));});
$('eventMinutes').addEventListener('input',hoursNote);
$('setup').addEventListener('submit',e=>{e.preventDefault();$('error').textContent='';const count=Number($('teamCount').value),minutes=Number($('eventMinutes').value),courts=Number($('courtCount').value),size=Number($('teamSize').value),start=$('startTime').value,bufferPercent=Number($('bufferPercent').value);
  if(![count,minutes,courts,size,bufferPercent].every(Number.isInteger)){ $('error').textContent='Use whole numbers for teams, time, size, and courts.';return; }
  const slots=count===state.count?state.slots:Planner.initialSlots(count);try{Planner.plan(slots,minutes,courts,count===state.count?state.winners:{},bufferPercent);}catch(error){$('error').textContent=error.message;return;}
  const sameTiming=count===state.count&&minutes===state.minutes&&courts===state.courts&&bufferPercent===state.bufferPercent;
  state={count,minutes,courts,size,start,bufferPercent,roundDurations:sameTiming?state.roundDurations:null,slots,winners:count===state.count?state.winners:{}};render();view('bracket');toast('Bracket and court schedule are ready.');});
$('shuffle').addEventListener('click',()=>{const teams=state.slots.filter(Boolean);for(let i=teams.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[teams[i],teams[j]]=[teams[j],teams[i]];}let n=0;state.slots=state.slots.map(t=>t?teams[n++]:null);state.winners={};render();toast('Teams shuffled. Match results cleared.');});
$('reset').addEventListener('click',()=>{state.winners={};render();toast('Results cleared. Teams kept in place.');});
$('print').addEventListener('click',()=>{render();requestAnimationFrame(()=>window.print());});
$('csv').addEventListener('click',()=>{const rows=[['Round','Match','Team 1','Team 2','Court','Estimated start','Estimated end','Match format (win by 2)','Allocated slot minutes','Estimated play minutes'],...currentPlan.schedule.map(m=>[Planner.roundName(m.r,currentPlan.rounds.length),matchLabel(m),m.pair[0].label,m.pair[1].label,m.court,clock(m.start),clock(m.end),formatLabel(m),m.duration,decimal(m.estimated)])];const csv=rows.map(row=>row.map(x=>'"'+String(x).replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='volleyball-court-schedule.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);});
syncInputs();render();
