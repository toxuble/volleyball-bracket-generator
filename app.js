'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='sideline-volleyball-points-v2';
let state={count:12,minutes:240,size:6,courts:2,start:'09:00',slots:Planner.initialSlots(12),winners:{}};
try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved&&saved.count>=2&&saved.count<=64&&Array.isArray(saved.slots)&&saved.slots.length===2**Math.ceil(Math.log2(saved.count))&&saved.slots.filter(Boolean).length===saved.count&&new Set(saved.slots.filter(Boolean).map(t=>t.id)).size===saved.count){Planner.plan(saved.slots,saved.minutes,saved.courts,saved.winners);state=saved;}}catch(e){}
let currentPlan,dragIndex=null,toastTimer;
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3000);}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));$('saveStatus').textContent='● Saved on this device';}catch(e){$('saveStatus').textContent='● Session only · storage unavailable';}}
function syncInputs(){ $('teamCount').value=state.count;$('eventMinutes').value=state.minutes;$('teamSize').value=state.size;$('courtCount').value=state.courts;$('startTime').value=state.start; hoursNote(); }
function hoursNote(){const m=Number($('eventMinutes').value);$('hoursNote').textContent=`${Math.floor(m/60)} hr ${m%60} min from start to finish`;}
function clock(offset){const [h,m]=state.start.split(':').map(Number);const total=h*60+m+offset;return `${String(Math.floor(total/60)%24).padStart(2,'0')}:${String(total%60).padStart(2,'0')}${total>=1440?' +1 day':''}`;}
function matchLabel(m){return `R${m.r+1} · M${m.index+1}`;}
function cleanWinners(){const valid={};Planner.build(state.slots,state.winners).flat().forEach(m=>{if(!m.bye&&m.winner)valid[m.id]=m.winner.id;});state.winners=valid;}
function render(){
  cleanWinners();currentPlan=Planner.plan(state.slots,state.minutes,state.courts,state.winners);const p=currentPlan,R=p.rounds.length,byes=state.slots.length-state.count;
  $('stats').innerHTML=`<div class="stat"><span>Teams</span><strong>${state.count}</strong><small>${state.count*state.size} players</small></div><div class="stat"><span>Matches</span><strong>${state.count-1}</strong><small>${R} rounds</small></div><div class="stat"><span>Opening byes</span><strong>${byes}</strong><small>auto-advance</small></div><div class="stat"><span>Event window</span><strong>${Math.floor(state.minutes/60)}<small>h ${state.minutes%60?state.minutes%60+'m':''}</small></strong><small>${state.courts} court${state.courts===1?'':'s'}</small></div>`;
  const assignments=new Map(p.schedule.map(m=>[m.id,m]));
  $('bracket').innerHTML=p.rounds.map((ms,r)=>`<section class="round"><div class="round-header ${r===R-1?'final':''}"><strong>${r===R-1?'✦ ':''}${Planner.roundName(r,R)}</strong><span>To ${p.points[r]} pts</span></div><div class="matches">${ms.map(m=>{
    const a=assignments.get(m.id);return `<div class="match ${r===R-1?'last':''}"><div class="match-meta"><span>${matchLabel(m)}</span><span>${m.bye?'AUTO ADVANCE':`C${a.court} · ${clock(a.start)}`}</span></div><div class="match-card">${m.pair.map((e,j)=>{
      const idx=m.index*2+j,win=e.team&&m.winner?.id===e.team.id;
      return `<div class="team-row ${win?'winner':''} ${!e.team&&e.ready?'bye':''}" ${r===0?`data-slot="${idx}" draggable="${!!e.team}"`:''}>${r===0?'<span class="drag-handle" aria-hidden="true">⠿</span>':''}<span class="seed">${e.team?e.team.seed:'–'}</span>${r===0&&e.team?`<input class="team-name" value="${esc(e.team.name)}" maxlength="48" data-name="${idx}" aria-label="Name of team in opening slot ${idx+1}"><div class="move-actions"><button class="mini" data-move="${idx}" data-dir="-1" aria-label="Move ${esc(e.team.name)} up" ${idx===0?'disabled':''}>↑</button><button class="mini" data-move="${idx}" data-dir="1" aria-label="Move ${esc(e.team.name)} down" ${idx===state.slots.length-1?'disabled':''}>↓</button></div>`:`<span class="team-text" title="${esc(e.label)}">${esc(e.label)}</span>`}${e.team?`<button class="advance" data-match="${m.id}" data-team="${esc(e.team.id)}" aria-label="${win?'Undo advancement of':'Advance'} ${esc(e.team.name)} in ${matchLabel(m)}" aria-pressed="${!!win}" ${m.bye||!m.pair.every(x=>x.team&&x.ready)?'disabled':''}>${win?'✓':'›'}</button>`:''}</div>`;
    }).join('')}</div></div>`;
  }).join('')}</div></section>`).join('')+`<section class="champion"><div class="trophy" aria-hidden="true">♜</div><div class="live-label">THE CHAMPION</div><strong>${esc(p.rounds.at(-1)[0].winner?.name||'Who will take it?')}</strong><small>${p.rounds.at(-1)[0].winner?'TOURNAMENT WINNER':'One team. One title.'}</small></section>`;
  const byeTeams=p.rounds[0].filter(m=>m.bye).map(m=>m.winner.name);
  $('byeNote').textContent=byes?`${byes} byes · highest seeds by default`:'A full bracket · no byes';$('byeNote').title=byeTeams.join(', ');
  $('timeDescription').textContent=`Est. ${clock(0)}–${clock(p.scheduled)} · ${p.scheduled} of ${state.minutes} play minutes${p.slack?` · ${p.slack} min reserve`:''}`;
  $('roundTimes').innerHTML=p.ds.map((d,r)=>`<div class="round-time"><small>${Planner.roundName(r,R)}</small><strong>${p.points[r]} <span>pts</span></strong><span>~${d} min / match · win by 2<br>${p.waves[r]} court wave${p.waves[r]===1?'':'s'}</span></div>`).join('');
  const compressed=p.points.some((pts,r)=>pts<15);
  $('timingMessage').className='timing-message'+(compressed?' warning':'');
  $('timingMessage').textContent=compressed?'◷ Short sets: some rounds play to fewer than 15 points. All matches are point-based, win by two. Estimated finish can overrun. Warm-ups are excluded.':'↳ One set per match, win by two. Point-based matches can overrun these estimates. Warm-ups and breaks are excluded.';
  $('scheduleRows').innerHTML=p.schedule.map(m=>`<tr><td>${matchLabel(m)}<br><small>${Planner.roundName(m.r,R)}</small></td><td>${m.pair.map(e=>esc(e.label)).join(' <span style="color:#9da68f">vs</span> ')}</td><td>Court ${m.court}</td><td>${clock(m.start)}</td><td>${clock(m.end)}</td><td>To ${m.points} · win by 2</td><td>~${m.duration} min</td></tr>`).join('');
  save();
}
function swap(a,b){if(a===b||a<0||b<0||a>=state.slots.length||b>=state.slots.length)return;const candidate=state.slots.slice();[candidate[a],candidate[b]]=[candidate[b],candidate[a]];if(candidate.some((t,i)=>i%2===0&&!t&&!candidate[i+1])){toast('Keep at least one team in every opening match. Swap with a different position.');return;}state.slots=candidate;state.winners={};render();toast('Positions swapped. Match results cleared.');}
function view(name){['bracket','schedule','guide'].forEach(v=>$(v+'View').hidden=v!==name);document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===name));}
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
$('setup').addEventListener('submit',e=>{e.preventDefault();$('error').textContent='';const count=Number($('teamCount').value),minutes=Number($('eventMinutes').value),courts=Number($('courtCount').value),size=Number($('teamSize').value),start=$('startTime').value;
  if(![count,minutes,courts,size].every(Number.isInteger)){ $('error').textContent='Use whole numbers for teams, time, size, and courts.';return; }
  const slots=count===state.count?state.slots:Planner.initialSlots(count);try{Planner.plan(slots,minutes,courts,count===state.count?state.winners:{});}catch(error){$('error').textContent=error.message;return;}
  state={count,minutes,courts,size,start,slots,winners:count===state.count?state.winners:{}};render();view('bracket');toast('Bracket and court schedule are ready.');});
$('shuffle').addEventListener('click',()=>{const teams=state.slots.filter(Boolean);for(let i=teams.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[teams[i],teams[j]]=[teams[j],teams[i]];}let n=0;state.slots=state.slots.map(t=>t?teams[n++]:null);state.winners={};render();toast('Teams shuffled. Match results cleared.');});
$('reset').addEventListener('click',()=>{state.winners={};render();toast('Results cleared. Teams kept in place.');});
$('print').addEventListener('click',()=>window.print());
$('csv').addEventListener('click',()=>{const rows=[['Round','Match','Team 1','Team 2','Court','Estimated start','Estimated end','Point target (win by 2)','Estimated play minutes'],...currentPlan.schedule.map(m=>[Planner.roundName(m.r,currentPlan.rounds.length),matchLabel(m),m.pair[0].label,m.pair[1].label,m.court,clock(m.start),clock(m.end),m.points,m.duration])];const csv=rows.map(row=>row.map(x=>'"'+String(x).replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"').join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='sideline-court-schedule.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);});
syncInputs();render();
