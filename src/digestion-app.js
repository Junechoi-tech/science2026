import '@fontsource-variable/noto-sans-kr';
import './digestion.css';
import { hasResponse, foodProgress, totalProgress, canMoveForward, makeSubmission, escapeHtml } from './assessment.js';
import { createReportPdf, downloadReport } from './report-pdf.js';
import { foods, nutrients, stages, nutrientState, foodQuestions } from './digestion.js';

const symbols = {
  explore: '<path d="M8 3v6l-5 9a2 2 0 0 0 2 3h14a2 2 0 0 0 2-3l-5-9V3M6 3h12M7 14h10"/>',
  book: '<path d="M12 5c-3-2-7-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-7-1-10 1Zm0 0v15"/>',
  quiz: '<rect x="5" y="4" width="14" height="17" rx="3"/><path d="M9 3h6v4H9zm0 9h6m-6 4h4"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  play: '<path d="m9 5 11 7-11 7Z"/>', pause: '<path d="M8 5v14M16 5v14"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>', close: '<path d="m6 6 12 12M6 18 18 6"/>',
  bulb: '<path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0l-1 2H9Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>', sound: '<path d="M4 10h4l5-5v14l-5-5H4zm12-3a8 8 0 0 1 0 10m3-13a12 12 0 0 1 0 16"/>',
};
const icon = (key) => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${symbols[key] || symbols.bulb}</svg>`;
const state = { food: foods[0], step: 0, playing: false, speed: 1, filter: 'all', view: 'explore', responses: {}, foodSteps: {}, progress: 0, student: { school:'', classroom:'', number:'', name:'' }, submitted: null, busy: false, error: '' };
const storageKey='digestion-assessment-v4';
try {
  const saved=JSON.parse(sessionStorage.getItem(storageKey) || 'null');
  if(saved){
    for(const food of foods)foodQuestions[food.id].forEach((q,i)=>{
      const key=`${food.id}:${i}`;
      if(hasResponse(q,saved.responses?.[key]))state.responses[key]=saved.responses[key];
    });
    for(const key of Object.keys(state.student))state.student[key]=String(saved.student?.[key] || '').slice(0,40);
    for(const food of foods){
      let step=Number(saved.foodSteps?.[food.id]) || 0;
      step=Math.max(0,Math.min(6,Math.floor(step)));
      while(step>0 && !Array.from({length:step},(_,i)=>hasResponse(foodQuestions[food.id][i],state.responses[`${food.id}:${i}`])).every(Boolean))step--;
      state.foodSteps[food.id]=step;
    }
    state.food=foods.find(f=>f.id===saved.foodId) || foods[0];
    state.step=state.foodSteps[state.food.id] || 0;
    if(saved.submitted && totalProgress(state.responses)===28)state.submitted=makeSubmission(state.responses,state.student,saved.at);
  }
} catch { /* An unavailable or old draft does not block the assessment. */ }
function persist(){
  state.foodSteps[state.food.id]=state.step;
  try{sessionStorage.setItem(storageKey,JSON.stringify({responses:state.responses,student:state.student,foodSteps:state.foodSteps,foodId:state.food.id,submitted:!!state.submitted,at:state.submitted?.at}));}catch{/* Browser storage may be disabled. */}
}

let frame;
let lastTime;
// Connected paths follow the lumen, including the intestinal bends.
const travelPaths = [
  'M275 57 L275 118',
  'M275 118 V157 Q275 173 296 177 Q321 163 324 190 Q326 209 312 211',
  'M312 211 Q294 222 281 207 Q269 199 260 219 L262 231 V254 H307 Q324 254 318 266 Q316 272 306 272 H254 Q242 272 242 282 H270',
  'M270 282 H254 Q242 282 254 291 H306 Q318 291 316 301 Q315 309 303 309 H256 Q242 309 244 319 Q246 328 260 328',
  'M260 328 H244 L244 334 H232 Q223 334 223 319 V299',
  'M223 299 V253 Q223 239 237 239 H325 Q338 239 338 254 V321 Q338 340 321 340 H295 V378',
];
const anchors = [[275,57], [275,118], [312,211], [270,282], [260,328], [223,299], [295,378]];
const app = document.querySelector('#app');
app.innerHTML = `
<header class="topbar">
  <a class="brand" href="./"><span class="brand-icon">${icon('explore')}</span><span>한입의 여행<small>DIGESTION LAB</small></span></a>
  <nav aria-label="학습 메뉴"><button class="nav-button active" data-view="explore">${icon('explore')} 소화 평가</button><button class="nav-button" data-view="notes" disabled title="PDF 제출 후 개념 노트가 열려요">${icon('book')} 개념 노트</button><button class="nav-button" data-view="results">${icon('quiz')} 제출·결과</button></nav>
  <button class="guide-button" id="guide">사용 안내 <span>?</span></button>
</header>
<main>
  <div class="breadcrumb">중학교 2학년 과학 <span>›</span> 동물과 에너지 <span>›</span> 소화와 흡수</div>
  <section class="page-heading"><div><div class="eyebrow"><span></span> EVERY BITE HAS A STORY</div><h1>내가 먹은 음식은 <em>어디로 갈까?</em></h1><p>한입의 음식이 작은 영양소가 되어, 우리 몸에 흡수되기까지.</p></div><div class="lesson-tag"><span>🍽️</span><div>오늘의 탐구<small>음식 속 영양소의 소화와 흡수</small></div></div></section>
  <section class="assessment-bar panel" aria-label="평가 진행 및 제출"><div class="assessment-overview"><div><span class="eyebrow">MY ASSESSMENT</span><h2>네 음식의 28문항을 모두 풀어 보세요</h2><p id="assessment-progress"></p></div><div class="assessment-actions"><button id="submit-pdf" class="primary" type="button" disabled>PDF로 제출하기</button><button id="new-assessment" class="text-button" type="button">새 평가 시작</button></div></div><form id="student-form" class="student-form"><label>학교 (선택)<input data-student="school" maxlength="40" autocomplete="off"></label><label>학년·반<input data-student="classroom" maxlength="20" placeholder="예: 2학년 3반" required autocomplete="off"></label><label>번호<input data-student="number" maxlength="10" inputmode="numeric" required autocomplete="off"></label><label>이름<input data-student="name" maxlength="20" required autocomplete="off"></label></form><p id="submission-note">28문항 완료 후 PDF를 기기에 저장합니다. 선생님이 안내한 곳에 파일을 직접 제출하세요. 제출 전에는 채점 결과가 표시되지 않습니다.</p></section>
  <div id="explore-view">
    <div class="workspace">
      <section class="food-panel panel"><div class="panel-title"><span class="number">01</span><h2>음식을 골라요</h2><span class="tiny">SELECT</span></div><p class="panel-subtitle">오늘은 무엇을 먹어 볼까요?</p><div class="food-grid" id="food-grid"></div><div id="food-profile"></div><div class="model-note">막대는 학습용 상대 함량이에요.<br>실제 영양 성분의 비율·양과는 달라요.</div></section>
      <section class="body-panel panel"><div class="panel-title"><span class="number">02</span><h2>소화의 길을 따라가요</h2><span class="live-label"><i></i> SIMULATION</span></div><div class="body-toolbar"><span>소화계 모형</span><button id="labels" aria-pressed="true">기관 이름 <span class="toggle on"></span></button></div><div id="body-map"></div><div class="map-legend"><span><i class="legend-food"></i>음식물의 이동</span><span><i class="legend-juice"></i>소화액의 이동</span><span>문제를 풀며 차례로 이동해요</span></div><div class="transport"><button class="reset-button" id="previous" aria-label="이전 문항으로" title="이전 문항으로">${icon('chevron')}<span>이전</span></button><button id="play" class="play-button">${icon('play')} 여행 시작</button><button id="next" class="next-button" aria-label="다음 단계">${icon('chevron')}</button><span class="transport-divider"></span><label class="speed-label" for="speed">속도</label><select id="speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option></select><span id="stage-count"></span></div><p class="movement-status" id="movement-status" role="status"></p></section>
      <aside class="detail-panel"><div class="panel observation"><div class="panel-title"><span class="number">03</span><h2>무슨 일이 일어날까요?</h2></div><div id="observation" aria-live="polite"></div></div><div id="thinking" class="thinking"></div></aside>
    </div>
    <section class="nutrient-section"><div class="section-heading"><div><h2>영양소의 변화를 한눈에 <span>MOLECULE TRACKER</span></h2><p>음식 안에 함께 들어 있는 영양소를 각각 따라가 보세요.</p></div><div class="filter-tabs" role="group" aria-label="관찰할 영양소"><button data-filter="all" class="active">전체</button><button data-filter="starch">녹말</button><button data-filter="protein">단백질</button><button data-filter="fat">지방</button></div></div><div class="nutrient-cards" id="nutrient-cards"></div></section>
    <div class="learning-footer">${icon('bulb')} <span>기억해요! <strong>소화</strong>는 영양소를 작게 분해하는 것, <strong>흡수</strong>는 영양소가 몸속으로 들어가는 것이에요.</span></div>
  </div>
  <section id="notes-view" class="secondary-view" hidden></section>
  <section id="results-view" class="secondary-view" hidden></section>
  <footer class="footer"><span>한입의 여행 <b>·</b> 음식으로 만나는 우리 몸의 과학</span><span>중2 과학 · 교육용 단순화 모형 <a href="${import.meta.env.DEV ? './genetics-app.html' : './genetics.html'}">유전의 숲 ↗</a></span></footer>
</main>
<dialog id="guide-dialog"><button class="dialog-close" aria-label="안내 닫기">${icon('close')}</button><div class="eyebrow">WELCOME TO DIGESTION LAB</div><h2>한입으로 시작하는 과학 탐험</h2><ol><li><strong>음식 고르기</strong> — 주로 들어 있는 영양소를 확인해요.</li><li><strong>문제 풀기</strong> — 음식마다 다른 객관식·주관식 문제에 답해요.</li><li><strong>답안 수정</strong> — 응답하면 다음 기관으로 이동할 수 있어요. 이전 문항 버튼으로 돌아와 제출 전까지 수정해요.</li><li><strong>PDF로 제출하기</strong> — 네 음식의 28문항을 모두 응답하고 학생 정보를 입력한 뒤 PDF를 저장해요. 이후 채점 결과가 열려요.</li></ol><p>1×에서는 약 1.8초에 걸쳐 다음 기관으로 연속 이동해요. 정답 여부와 관계없이 답을 입력하면 다음 기관으로 이동할 수 있어요. 채점 결과와 해설은 PDF 생성 후 공개되며, 생성 시점의 답안은 수정할 수 없어요. 주관식은 핵심 용어만 써 주세요. 띄어쓰기와 대표적인 동의어는 허용해요. 실제 소화 시간·기관 크기·분자 수를 재현한 모형은 아니에요. 이 탭에서 응답을 임시 저장하며 음식 변경 시 마지막으로 보던 문항으로 돌아가요. 새 평가 시작은 현재 답안을 지워요.</p><p class="source-note">내용 참고: 첨부된 비상교육 중학교 과학 2, 194–199쪽. 그림과 문장은 이 시뮬레이션을 위해 새로 구성했어요. 음식의 비타민·무기염류·물과 식이섬유의 자세한 경로는 생략했어요.</p><button class="primary dialog-start">탐험하러 가기 ${icon('arrow')}</button></dialog>`;

function bodyMap() {
  const active = state.step;
  const cls = (n) => `organ ${active === n || (n === 3 && active === 4) ? 'organ-active' : ''}`;
  return `<svg class="anatomy" viewBox="0 0 560 420" role="img" aria-labelledby="body-title"><title id="body-title">소화계 모형. 현재 ${stages[active].name}. 음식은 간이나 이자를 통과하지 않아요.</title><defs><linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f5eee6"/><stop offset="1" stop-color="#fbf6ef"/></linearGradient><linearGradient id="stomach" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f6b3a0"/><stop offset="1" stop-color="#ea9683"/></linearGradient><pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".8" fill="#d9ddd5"/></pattern><filter id="glow"><feGaussianBlur stdDeviation="4"/></filter><marker id="juice-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="m0 0 10 5-10 5" fill="#6b9d85"/></marker></defs>
  <rect x="0" y="0" width="560" height="420" fill="url(#dots)" opacity=".6"/><ellipse cx="282" cy="392" rx="114" ry="9" fill="#eae9e0"/>
  <path d="M249 70q-12-12-8-33Q245 8 273 9q32-1 34 30 2 21-13 32v21q4 10 29 17l29 10q19 9 26 50l14 95-25 6-21-89 4 172q-15 41-70 41t-70-41l4-172-22 89-25-6 15-95q6-40 26-49l29-11q22-8 22-17Z" fill="url(#skin)" stroke="#e9ded0" stroke-width="1.5"/>
  <path d="M272 68v91" fill="none" stroke="#eed0ba" stroke-width="13" stroke-linecap="round"/>
  <g class="${cls(0)}" data-organ="0" ><path d="M263 56q12-6 25 0-7 12-25 0" fill="#d8897a"/><ellipse cx="275" cy="57" rx="19" ry="11" fill="transparent"/></g>
  <g class="${cls(1)}" data-organ="1" ><path d="M275 65v92q0 10 10 16" fill="none" stroke="#de9f89" stroke-width="9" stroke-linecap="round"/></g>
  <g class="${cls(2)}" data-organ="2" ><path d="M281 157q13 20 24 3 18-14 29 8 18 38-8 58-27 20-45-2-9-11-12-6l-7 13-13-8 11-21q9-12 22-4 15 9 16-6-17-8-17-35Z" fill="url(#stomach)" stroke="#d9806e" stroke-width="2"/><path d="M315 170q13 15 9 31" fill="none" stroke="#ffd2c1" stroke-width="4" stroke-linecap="round"/></g>
  <g class="gland"><path d="M212 160q15-21 59-9l23 18q-29 0-50 16-25 11-35-1Z" fill="#b9816b" stroke="#a76e59" stroke-width="1.5"/><path d="m248 175-4 16q5 8 11 1l-1-16" fill="#8fac78" stroke="#73925c" stroke-width="1.5"/><path d="M266 228q20-17 56-6-20 16-53 13Z" fill="#edc46e" stroke="#d4ab54" stroke-width="1.5"/><path d="M252 191v18l12 22m30-2-29 2" class="juice-path" marker-end="url(#juice-arrow)"/></g>
  <g class="${cls(5)}" data-organ="5" ><path d="M244 334h-12q-9 0-9-15v-66q0-14 14-14h88q13 0 13 15v67q0 19-17 19h-26v23" fill="none" stroke="#ca9a82" stroke-width="19" stroke-linecap="round" stroke-linejoin="round"/><path d="M244 334h-12q-9 0-9-15v-66q0-14 14-14h88q13 0 13 15v67q0 19-17 19h-26v23" fill="none" stroke="#e3bba0" stroke-width="12" stroke-linecap="round" stroke-dasharray="5 8"/></g>
  <g class="${cls(3)}" data-organ="3" ><path d="M262 231v23h45q15 0 11 12-2 6-12 6h-54q-11 0-10 10t12 9h52q12 0 10 10-1 8-13 8h-47q-14 0-12 10t16 9h18" fill="none" stroke="#cf8b73" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="M262 231v23h45q15 0 11 12-2 6-12 6h-54q-11 0-10 10t12 9h52q12 0 10 10-1 8-13 8h-47q-14 0-12 10t16 9h18" fill="none" stroke="#edb49a" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></g>
  <g class="${cls(6)}" data-organ="6" ><path d="M295 359v17" stroke="#c88d7e" stroke-width="11" stroke-linecap="round"/><ellipse cx="295" cy="378" rx="7" ry="3" fill="#a96d61"/></g>
  ${'<g class="absorb-arrows" opacity="0"><path d="m248 278-35 0m98 24 41 0" stroke="#7aa68c" stroke-width="2" stroke-dasharray="4 4" marker-end="url(#juice-arrow)"/><circle cx="204" cy="278" r="4" fill="#dfa641"/><circle cx="358" cy="302" r="4" fill="#78a18a"/></g>'}
  <g class="organ-labels" font-size="12" fill="#696f65" font-family="inherit">
  <path d="M289 56h64m-73 65h72m-30 66h55m-62 94h64m-83 91h53M214 166h-51m79 27h-77m128 33h83m-146 83h-62" fill="none" stroke="#c9cbbf"/>
  ${[[360,60,'입',0],[360,125,'식도',1],[383,191,'위',2],[383,285,'작은창자',3],[355,376,'항문',6],[131,170,'간',null],[119,197,'쓸개',null],[383,230,'이자',null],[103,313,'큰창자',5]].map(([x,y,t,n])=>`<text x="${x}" y="${y}" ${n!==null?`class="map-label ${n===active||(n===3&&active===4)?'current':''}" data-organ="${n}" `:''}>${t}</text>`).join('')}</g>
  <g class="travel-paths" fill="none" stroke="none">${travelPaths.map((d,i)=>`<path id="travel-${i}" d="${d}"/>`).join('')}</g><g class="food-marker" transform="translate(${anchors[active]})"><circle r="15" fill="#ed8650" opacity=".15"/><circle r="8" fill="#ed8650" stroke="white" stroke-width="3"/><circle r="3" fill="white"/></g>
  <g transform="translate(25 32)"><rect width="125" height="48" rx="12" fill="white" stroke="#e5e6df"/><text x="13" y="20" fill="#9b9f92" font-size="10">지금 여행 중인 음식</text><text id="map-food" x="13" y="37" font-size="13" fill="#414d42">${state.food.emoji} ${state.food.name}</text></g>
  <g transform="translate(388 352)"><rect width="143" height="42" rx="10" fill="#fff" stroke="#e5e6df"/><circle cx="16" cy="21" r="4" fill="#ec8c56"/><text id="map-stage" x="27" y="25" font-size="11" fill="#66715f">${stages[active].name}</text></g>
  </svg>`;
}
function molecules(key, form) {
  const color=nutrients[key].color;
  const small = form==='small'||form==='absorbed';
  const count=small?8:form==='medium'?10:12;
  const points=Array.from({length:count},(_,i)=>small?[24+(i%4)*48,20+Math.floor(i/4)*27]:[15+(i%6)*33,22+Math.floor(i/6)*25]);
  let links='';
  if(!small) for(let i=1;i<count;i++) if(!(form==='medium' && i%2===0)) links+=`<path d="M${points[i-1]} ${points[i]}" stroke="${color}" stroke-width="3" opacity=".55"/>`;
  return `<svg viewBox="0 0 220 69" class="molecules ${small?'separated':''}" role="img" aria-label="${small?'분해된 작은 분자':form==='medium'?'일부가 분해된 분자 모형':'연결된 큰 분자 모형'}">${links}${points.map(([x,y],i)=>key==='protein'?`<rect x="${x-6}" y="${y-6}" width="12" height="12" rx="3" fill="${color}" opacity="${.7+(i%3)*.1}"/>`:key==='fat'?`<path d="m${x} ${y-8} 8 14h-16Z" fill="${color}"/>`:`<circle cx="${x}" cy="${y}" r="6" fill="${color}" opacity="${.7+(i%3)*.1}"/>`).join('')}</svg>`;
}
function update() {
  refreshAssessmentControls();
  document.querySelector('#food-profile').innerHTML=`<div class="profile-heading"><strong>${state.food.name} 속 영양소</strong><span>상대 함량</span></div>${Object.entries(nutrients).map(([key,n],i)=>`<div class="profile-row"><span><i style="background:${n.color}"></i>${n.name}</span><div class="profile-bar"><b style="width:${state.food.profile[i]/3*100}%;background:${n.color}"></b></div><small>${['미포함','적음','보통','많음'][state.food.profile[i]]}</small></div>`).join('')}`;
  if (!document.querySelector('.anatomy')) document.querySelector('#body-map').innerHTML=bodyMap();
  updateMap();
  document.querySelector('#body-map').classList.toggle('hide-labels',document.querySelector('#labels').getAttribute('aria-pressed')==='false');
  document.querySelector('#stage-count').textContent=`0${state.step+1} / 07`;
  renderObservation();
  document.querySelector('#thinking').innerHTML=`<div>${icon('bulb')} <strong>한 걸음 더 생각하기</strong></div><p>${state.submitted?stages[state.step].tip:'이 기관에서 음식물은 이동할까요, 분해될까요, 흡수될까요? 영양소와 기관의 역할을 연결해 예측해 보세요.'}</p>`;
  document.querySelector('#nutrient-cards').innerHTML=Object.entries(nutrients).filter(([key])=>state.filter==='all'||state.filter===key).map(([key,n])=>{
    const index=Object.keys(nutrients).indexOf(key), present=state.food.profile[index]>0;
    const status=nutrientState(key,state.step);
    const observed=!!state.submitted;
    const finalKnown=!!state.submitted;
    return `<article class="nutrient-card ${present?'':'absent'}" style="--nutrient:${n.color}"><div class="nutrient-card-top"><h3><i></i>${n.name}</h3><span>${present?(observed?status.action:'제출 후 공개'):'이 모형에는 없음'}</span></div>${present?(observed?molecules(key,status.form):'<div class="absent-graphic">PDF 제출 후 분자 모형이 열려요</div>'):'<div class="absent-graphic">이 모형에는 표시하지 않아요</div>'}<div class="molecule-description"><strong>${present?(observed?status.label:'어떤 변화가 생길까요?'):'—'}</strong><span>${present?(observed?status.description:'PDF 제출 후 분자 모형과 설명이 열려요.'):`${state.food.name}의 다른 영양소를 관찰해 보세요.`}</span></div><div class="nutrient-destination">최종 소화 산물 ${icon('arrow')} <b>${finalKnown?n.final:'?'}</b></div></article>`;
  }).join('');
  document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b.dataset.filter===state.filter));
  persist();
}
function placeMarker() {
  const marker = document.querySelector('.food-marker');
  let [x,y] = anchors[state.step];
  if (state.step < 6 && state.progress > 0) {
    const path = document.querySelector(`#travel-${state.step}`);
    const point = path.getPointAtLength(path.getTotalLength() * state.progress);
    x = point.x; y = point.y;
  }
  marker.setAttribute('transform', `translate(${x} ${y})`);
}
function updateMap() {
  document.querySelectorAll('.organ').forEach(el => el.classList.toggle('organ-active', Number(el.dataset.organ)===state.step || (el.dataset.organ==='3' && state.step===4)));
  document.querySelectorAll('.map-label').forEach(el=>el.classList.toggle('current', Number(el.dataset.organ)===state.step || (el.dataset.organ==='3' && state.step===4)));
  document.querySelector('.absorb-arrows').setAttribute('opacity', state.step===4?'1':'0');
  document.querySelector('#map-food').textContent=`${state.food.emoji} ${state.food.name}`;
  document.querySelector('#map-stage').textContent=stages[state.step].name;
  document.querySelector('#body-title').textContent=`소화계 모형. 현재 ${stages[state.step].name}. 음식은 간이나 이자를 통과하지 않아요.`;
  placeMarker();
}
function predictionKey(){ return `${state.food.id}:${state.step}`; }
function refreshAssessmentControls(){
  const count=totalProgress(state.responses);
  document.querySelector('#food-grid').innerHTML=foods.map(f=>{
    const n=foodProgress(f.id,state.responses);
    return `<button class="food-card ${state.food.id===f.id?'selected':''} ${n===7?'food-complete':''}" data-food="${f.id}" aria-pressed="${state.food.id===f.id}" ${state.busy?'disabled':''}><span class="food-emoji">${f.emoji}</span><strong>${f.name} ${n===7?'<span class="completion-badge">완료</span>':''}</strong><small>${n} / 7 응답</small>${state.food.id===f.id?`<span class="selected-check">${icon('check')}</span>`:''}</button>`;
  }).join('');
  const unlocked=canMoveForward(state.food.id,state.step,state.responses);
  document.querySelector('#play').innerHTML=icon(state.playing?'pause':'play')+(state.playing?'잠시 멈춤':state.step===6?'마지막 문항':'다음 기관으로');
  document.querySelector('#play').disabled=state.busy || (!state.playing && !unlocked);
  document.querySelector('#next').disabled=state.busy || state.playing || !unlocked;
  document.querySelector('#previous').disabled=state.busy || state.step===0;
  document.querySelector('#movement-status').textContent=state.playing?'소화관을 따라 이동하고 있어요.':state.step===6?'다른 음식을 선택하거나 이전 문항으로 돌아가 답안을 확인하세요.':unlocked?'응답이 저장되었습니다. 다음 기관으로 이동할 수 있어요.':'답을 선택하거나 입력하면 다음 기관으로 이동할 수 있어요.';
  document.querySelector('#assessment-progress').textContent=`${count} / 28문항 응답 · ${foods.filter(f=>foodProgress(f.id,state.responses)===7).length} / 4음식 완료`;
  document.querySelector('#submit-pdf').disabled=state.busy || count!==28;
  document.querySelector('#submit-pdf').textContent=state.busy?'PDF 만드는 중…':state.submitted?'PDF 다시 받기':'PDF로 제출하기';
  document.querySelector('#new-assessment').disabled=state.busy;
  const localProgress=document.querySelector('.prediction-heading small');
  if(localProgress)localProgress.textContent=`${foodProgress(state.food.id,state.responses)} / 7 응답`;
  const lastMessage=document.querySelector('.journey-done');
  if(lastMessage && !state.submitted)lastMessage.textContent=foodProgress(state.food.id,state.responses)===7?'이 음식의 7문항을 완료했어요. 다른 음식도 모두 풀어 주세요.':'이 문항에 응답하면 이 음식의 평가가 완료돼요.';
  document.querySelectorAll('[data-student]').forEach(input=>{input.disabled=state.busy || !!state.submitted;});
  document.querySelector('[data-view="notes"]').disabled=!state.submitted;
  document.querySelector('#submission-note').textContent=state.error || (state.submitted?'PDF 저장을 시작했습니다. 선생님이 안내한 곳에 파일을 직접 제출하세요. 제출 시점의 답안과 채점 결과를 아래에서 확인할 수 있어요.':'28문항 완료 후 PDF를 기기에 저장합니다. 선생님이 안내한 곳에 파일을 직접 제출하세요. 제출 전에는 채점 결과·해설·개념 노트가 표시되지 않습니다.');
}
function renderObservation() {
  const q=foodQuestions[state.food.id][state.step], key=predictionKey(), response=state.responses[key];
  const answered=hasResponse(q,response), locked=!!state.submitted || state.busy || state.playing;
  const row=state.submitted?.rows.find(r=>r.foodId===state.food.id && r.stage===stages[state.step].name);
  const activity=q.type==='choice' ? `<div class="prediction-options">${q.choices.map((c,i)=>`<button data-predict="${i}" aria-pressed="${response===i}" ${locked?'disabled':''} class="${row&&i===q.answer?'correct':row&&response===i&&!row.correct?'incorrect':response===i?'selected-answer':''}"><span>${i+1}</span>${c}${response===i?'<span class="answer-marker">선택</span>':''}</button>`).join('')}</div>` : `<form id="short-answer-form" class="short-answer-form"><label for="short-answer">나의 답 <span>주관식 · 핵심 용어로 답해요</span></label><div class="short-answer-row"><input id="short-answer" name="answer" type="text" maxlength="80" autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="short-help" ${locked?'disabled':''}></div><p id="short-help">입력한 답은 자동 저장됩니다. 두 물질을 묻는 문항은 둘 다 써 주세요.</p></form>`;
  document.querySelector('#observation').innerHTML=`<div class="stage-pill">STEP 0${state.step+1} <span>·</span> ${stages[state.step].name}</div><div class="prediction-heading"><span>${state.food.emoji} ${state.food.name} 평가</span><small>${foodProgress(state.food.id,state.responses)} / 7 응답</small></div><h3 class="prediction-question">${q.text}</h3>${activity}<p class="answer-save-status" id="answer-status" role="status">${state.submitted?'제출한 답안입니다.':answered?'응답이 저장되었습니다. 제출 전까지 수정할 수 있어요.':'아직 응답하지 않았어요.'}</p>${row?`<div class="prediction-feedback ${row.correct?'':'wrong'}"><strong>${row.correct?'정답입니다.':'오답입니다.'}</strong><p>정답: ${escapeHtml(row.expected)}</p><p>${q.explanation}</p></div><details class="stage-explanation"><summary>기관의 역할 더 알아보기</summary><p>${stages[state.step].detail}</p></details>`:''}${state.step<6?`<button class="primary continue-button" id="continue" ${!answered || state.playing || state.busy?'disabled':''}>${state.playing?'이동 중…':'다음 기관으로'} ${icon('arrow')}</button>`:`<div class="journey-done">${foodProgress(state.food.id,state.responses)===7?'이 음식의 7문항을 완료했어요. 다른 음식도 모두 풀어 주세요.':'이 문항에 응답하면 이 음식의 평가가 완료돼요.'}</div>`}`;
  const field=document.querySelector('#short-answer');if(field)field.value=typeof response==='string'?response:'';
}
function recordAnswer(value){
  if(state.playing || state.submitted || state.busy)return;
  const q=foodQuestions[state.food.id][state.step];
  if(hasResponse(q,value))state.responses[predictionKey()]=value;
  else delete state.responses[predictionKey()];
  update();
}
async function submitPdf(){
  if(state.busy || totalProgress(state.responses)!==28)return;
  if(!document.querySelector('#student-form').reportValidity())return;
  stop();state.busy=true;state.error='';update();
  try{
    const snapshot=state.submitted || makeSubmission(state.responses,state.student);
    const blob=await createReportPdf(snapshot);
    downloadReport(blob,snapshot);
    state.submitted=snapshot;state.busy=false;
    setView('results');persist();
  }catch(error){state.busy=false;state.error=`PDF를 만들지 못했습니다. 답안은 유지됩니다. 다시 시도해 주세요. (${error.message})`;update();}
}
function previousQuestion(){if(state.busy || state.step===0)return;stop();state.step--;state.progress=0;update();}
function newAssessment(){
  if(!window.confirm('현재 탭의 모든 답안과 학생 정보를 지우고 새 평가를 시작할까요? PDF는 먼저 저장해 주세요.'))return;
  stop();state.responses={};state.foodSteps={};state.submitted=null;state.error='';state.student={school:'',classroom:'',number:'',name:''};state.food=foods[0];state.step=0;state.progress=0;
  document.querySelectorAll('[data-student]').forEach(input=>{input.value='';});setView('explore');
}
function stop(){state.playing=false;cancelAnimationFrame(frame);lastTime=undefined;}
function animate(now){
  if(!state.playing)return;
  const elapsed=lastTime===undefined?0:Math.min(now-lastTime,100);
  lastTime=now;
  state.progress=Math.min(1,state.progress+elapsed*state.speed/1800);
  placeMarker();
  if(state.progress>=1){
    state.step++; state.progress=0;
    stop();
    update();
  }
  if(state.playing)frame=requestAnimationFrame(animate);
}
function start(){
  if(state.playing || !canMoveForward(state.food.id,state.step,state.responses))return;
  state.playing=true;lastTime=undefined;frame=requestAnimationFrame(animate);update();
}
function setView(view){if(view==='notes'&&!state.submitted)return;stop();state.view=view;['explore','notes','results'].forEach(v=>{document.querySelector(`#${v}-view`).hidden=v!==view;});document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));if(view==='notes')renderNotes();if(view==='results')renderResults();update();}
function renderNotes(){document.querySelector('#notes-view').innerHTML=`<div class="notes-intro"><span class="eyebrow">CONNECT THE DOTS</span><h2>한입에 담긴 과학, 차근차근.</h2><p>소화 기관의 역할과 영양소의 경로를 연결해 보세요.</p></div><div class="notes-grid">${Object.entries(nutrients).map(([key,n])=>`<article class="panel note-card" style="--nutrient:${n.color}"><h3><i style="background:${n.color}"></i>${n.name}의 여행</h3><div class="note-flow">${key==='starch'?'녹말 → 엿당 → 포도당':key==='protein'?'단백질 → 작은 조각 → 아미노산':'지방 → 작은 지방 방울 → 지방산 + 모노글리세리드'}</div><p>${key==='starch'?'입에서 침 아밀레이스가 작용해요. 작은창자에서 이자액의 아밀레이스와 엿당 분해 효소 등의 작용으로 포도당이 돼요.':key==='protein'?'위의 펩신이 분해를 시작해요. 작은창자에서 트립신과 여러 효소가 작용하여 아미노산이 돼요.':'작은창자에서 쓸개즙이 유화한 후, 라이페이스가 지방을 분해해요. 쓸개즙의 유화는 효소에 의한 화학적 분해가 아니에요.'}</p><strong class="note-route">${n.route}</strong></article>`).join('')}</div><article class="panel notes-table"><h3>기관별 역할 한눈에 보기</h3><div class="table-scroll"><table><thead><tr><th>기관</th><th>무엇을 할까요?</th><th>주요 작용</th></tr></thead><tbody>${stages.map(s=>`<tr><th>${s.name}</th><td>${s.verb}</td><td>${s.enzyme}</td></tr>`).join('')}</tbody></table></div></article><div class="learning-footer">${icon('bulb')} 간·쓸개·이자는 소화액을 공급해요. 음식물이 직접 지나가는 소화관은 아니에요.</div><p class="reference">참고: 비상교육 중학교 과학 2, 194–199쪽. 이 모형은 주요 영양소의 경로를 단순화했으며 실제 소화 시간·분자 수·영양 성분을 정량적으로 나타내지 않아요.</p>`;}
function renderResults(){
  const report=state.submitted;
  if(!report){document.querySelector('#results-view').innerHTML=`<div class="panel results-intro"><h2>28문항에 모두 응답한 뒤 제출해 주세요</h2><p>현재 ${totalProgress(state.responses)} / 28문항에 응답했어요. 음식의 ‘완료’ 표시는 정답 여부와 관계없이 7문항 응답이 끝났다는 뜻이에요.</p><p>PDF 생성 전에는 정답과 채점 결과가 공개되지 않습니다. 소화 평가에서 답안을 작성하거나 수정해 주세요.</p><button class="primary" data-view="explore">답안 작성으로 돌아가기</button></div>`;return;}
  document.querySelector('#results-view').innerHTML=`<section class="results-summary panel"><div><span class="eyebrow">ASSESSMENT REPORT</span><h2>${escapeHtml(report.student.name)} 학생의 채점 결과</h2><p>${escapeHtml(report.student.classroom)} · ${escapeHtml(report.student.number)}번 · 28문항 응답 완료</p></div><strong>${report.correct}<small> / 28 정답</small></strong></section><p class="results-notice">PDF는 생성 시점의 답안과 동일합니다. 파일을 기기에 저장한 뒤 선생님이 안내한 곳에 제출하세요. 주관식은 허용된 핵심 용어로 자동 채점했으며, 표현 차이는 선생님이 최종 확인할 수 있습니다.</p><div class="results-list">${report.rows.map(row=>`<article class="result-row panel"><div class="result-row-header"><strong>${row.number}. ${row.food} · ${row.stage}</strong><span class="result-mark ${row.correct?'right':'wrong'}">${row.correct?'정답 O':'오답 X'}</span></div><h3>${row.question}</h3><p><b>나의 답</b> ${escapeHtml(row.answer)}</p><p><b>정답</b> ${escapeHtml(row.expected)}</p><details><summary>해설 보기</summary><p>${row.explanation}</p></details></article>`).join('')}</div>`;
}
app.addEventListener('click',event=>{const b=event.target.closest('button, [data-organ]');if(!b)return;
  if(b.dataset.food && !state.busy){stop();state.foodSteps[state.food.id]=state.step;state.progress=0;state.food=foods.find(f=>f.id===b.dataset.food);state.step=state.foodSteps[state.food.id] || 0;update();}
  if(b.dataset.filter){state.filter=b.dataset.filter;update();}
  if(b.dataset.view)setView(b.dataset.view);
  if(b.id==='play'){if(state.playing){stop();update();}else start();}
  if(b.id==='continue')start();
  if(b.dataset.predict!==undefined)recordAnswer(Number(b.dataset.predict));
  if(b.id==='previous')previousQuestion();
  if(b.id==='submit-pdf')submitPdf();
  if(b.id==='new-assessment' && !state.busy)newAssessment();
  if(b.id==='next')start();
  if(b.id==='labels'){const show=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(show));b.querySelector('.toggle').classList.toggle('on',show);document.querySelector('#body-map').classList.toggle('hide-labels',!show);}
  if(b.id==='guide'){stop();update();document.querySelector('#guide-dialog').showModal();}
  if(b.classList.contains('dialog-close')||b.classList.contains('dialog-start'))document.querySelector('#guide-dialog').close();
});
app.addEventListener('input',event=>{
  if(event.target.dataset.student){state.student[event.target.dataset.student]=event.target.value;persist();}
  if(event.target.id==='short-answer' && !state.submitted && !state.busy){
    const value=event.target.value;
    if(value.trim())state.responses[predictionKey()]=value;else delete state.responses[predictionKey()];
    refreshAssessmentControls();persist();
    document.querySelector('#answer-status').textContent=value.trim()?'응답이 저장되었습니다. 제출 전까지 수정할 수 있어요.':'아직 응답하지 않았어요.';
    document.querySelector('#continue')?.toggleAttribute('disabled',!value.trim());
  }
});
app.addEventListener('submit',event=>{event.preventDefault();});
document.querySelectorAll('[data-student]').forEach(input=>{input.value=state.student[input.dataset.student];});
document.querySelector('#speed').addEventListener('change',e=>{state.speed=Number(e.target.value);});
update();
