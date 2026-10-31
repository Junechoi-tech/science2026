import '@fontsource-variable/noto-sans-kr';
import './digestion.css';
import { foods, nutrients, stages, nutrientState, questions, stageQuestions } from './digestion.js';

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
const state = { food: foods[0], step: 0, playing: false, speed: 1, filter: 'all', view: 'explore', quiz: 0, answers: {}, predictions: {}, attempts: {}, hint: false, quizPause: true, progress: 0 };
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
  <nav aria-label="학습 메뉴"><button class="nav-button active" data-view="explore">${icon('explore')} 소화 탐험실</button><button class="nav-button" data-view="notes">${icon('book')} 개념 노트</button><button class="nav-button" data-view="quiz">${icon('quiz')} 배움 확인</button></nav>
  <button class="guide-button" id="guide">사용 안내 <span>?</span></button>
</header>
<main>
  <div class="breadcrumb">중학교 2학년 과학 <span>›</span> 동물과 에너지 <span>›</span> 소화와 흡수</div>
  <section class="page-heading"><div><div class="eyebrow"><span></span> EVERY BITE HAS A STORY</div><h1>내가 먹은 음식은 <em>어디로 갈까?</em></h1><p>한입의 음식이 작은 영양소가 되어, 우리 몸에 흡수되기까지.</p></div><div class="lesson-tag"><span>🍽️</span><div>오늘의 탐구<small>음식 속 영양소의 소화와 흡수</small></div></div></section>
  <div id="explore-view">
    <div class="workspace">
      <section class="food-panel panel"><div class="panel-title"><span class="number">01</span><h2>음식을 골라요</h2><span class="tiny">SELECT</span></div><p class="panel-subtitle">오늘은 무엇을 먹어 볼까요?</p><div class="food-grid" id="food-grid"></div><div id="food-profile"></div><div class="model-note">막대는 학습용 상대 함량이에요.<br>실제 영양 성분의 비율·양과는 달라요.</div></section>
      <section class="body-panel panel"><div class="panel-title"><span class="number">02</span><h2>소화의 길을 따라가요</h2><span class="live-label"><i></i> SIMULATION</span></div><div class="body-toolbar"><span>소화계 모형</span><button id="labels" aria-pressed="true">기관 이름 <span class="toggle on"></span></button></div><div id="body-map"></div><div class="map-legend"><span><i class="legend-food"></i>음식물의 이동</span><span><i class="legend-juice"></i>소화액의 이동</span><span>기관을 눌러 탐험해요</span></div><div class="transport"><button class="reset-button" id="reset" aria-label="처음으로 초기화">${icon('reset')}</button><button id="play" class="play-button">${icon('play')} 여행 시작</button><button id="next" class="next-button" aria-label="다음 단계">${icon('chevron')}</button><span class="transport-divider"></span><label class="speed-label" for="speed">속도</label><select id="speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option></select><span id="stage-count"></span></div><label class="pause-setting"><input id="quiz-pause" type="checkbox" checked> 문제에서 멈추기 <span>답을 생각한 뒤 계속 이동해요</span></label></section>
      <aside class="detail-panel"><div class="panel observation"><div class="panel-title"><span class="number">03</span><h2>무슨 일이 일어날까요?</h2></div><div id="observation" aria-live="polite"></div></div><div id="thinking" class="thinking"></div></aside>
    </div>
    <section class="journey-strip panel"><div class="journey-title">음식물의 이동 경로 <span>단계를 눌러 이동할 수 있어요</span></div><div id="stage-buttons" class="stage-buttons" aria-label="소화 단계"></div></section>
    <section class="nutrient-section"><div class="section-heading"><div><h2>영양소의 변화를 한눈에 <span>MOLECULE TRACKER</span></h2><p>음식 안에 함께 들어 있는 영양소를 각각 따라가 보세요.</p></div><div class="filter-tabs" role="group" aria-label="관찰할 영양소"><button data-filter="all" class="active">전체</button><button data-filter="starch">녹말</button><button data-filter="protein">단백질</button><button data-filter="fat">지방</button></div></div><div class="nutrient-cards" id="nutrient-cards"></div></section>
    <div class="learning-footer">${icon('bulb')} <span>기억해요! <strong>소화</strong>는 영양소를 작게 분해하는 것, <strong>흡수</strong>는 영양소가 몸속으로 들어가는 것이에요.</span></div>
  </div>
  <section id="notes-view" class="secondary-view" hidden></section>
  <section id="quiz-view" class="secondary-view" hidden></section>
  <footer class="footer"><span>한입의 여행 <b>·</b> 음식으로 만나는 우리 몸의 과학</span><span>중2 과학 · 교육용 단순화 모형 <a href="${import.meta.env.DEV ? './genetics-app.html' : './genetics.html'}">유전의 숲 ↗</a></span></footer>
</main>
<dialog id="guide-dialog"><button class="dialog-close" aria-label="안내 닫기">${icon('close')}</button><div class="eyebrow">WELCOME TO DIGESTION LAB</div><h2>한입으로 시작하는 과학 탐험</h2><ol><li><strong>음식 고르기</strong> — 주로 들어 있는 영양소를 확인해요.</li><li><strong>여행 시작</strong> — 자동 재생하거나 기관·단계를 직접 눌러요.</li><li><strong>먼저 예측하기</strong> — 기관별 문제를 풀고 해설과 분자 변화를 확인해요.</li><li><strong>배움 확인</strong> — 세 가지 질문으로 배운 내용을 확인해요.</li></ol><p>1×에서는 약 1.8초에 걸쳐 다음 기관으로 연속 이동해요. 기본 설정에서는 각 기관의 예측 문제에서 멈춰요. ‘문제에서 멈추기’를 끄면 끝까지 이어 볼 수 있어요. 실제 소화 시간·기관 크기·분자 수를 재현한 모형은 아니에요. 음식 변경 시 처음 단계로 돌아가요.</p><p class="source-note">내용 참고: 첨부된 비상교육 중학교 과학 2, 194–199쪽. 그림과 문장은 이 시뮬레이션을 위해 새로 구성했어요. 음식의 비타민·무기염류·물과 식이섬유의 자세한 경로는 생략했어요.</p><button class="primary dialog-start">탐험하러 가기 ${icon('arrow')}</button></dialog>`;

function bodyMap() {
  const active = state.step;
  const cls = (n) => `organ ${active === n || (n === 3 && active === 4) ? 'organ-active' : ''}`;
  return `<svg class="anatomy" viewBox="0 0 560 420" role="img" aria-labelledby="body-title"><title id="body-title">소화계 모형. 현재 ${stages[active].name}. 음식은 간이나 이자를 통과하지 않아요.</title><defs><linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f5eee6"/><stop offset="1" stop-color="#fbf6ef"/></linearGradient><linearGradient id="stomach" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f6b3a0"/><stop offset="1" stop-color="#ea9683"/></linearGradient><pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".8" fill="#d9ddd5"/></pattern><filter id="glow"><feGaussianBlur stdDeviation="4"/></filter><marker id="juice-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="m0 0 10 5-10 5" fill="#6b9d85"/></marker></defs>
  <rect x="0" y="0" width="560" height="420" fill="url(#dots)" opacity=".6"/><ellipse cx="282" cy="392" rx="114" ry="9" fill="#eae9e0"/>
  <path d="M249 70q-12-12-8-33Q245 8 273 9q32-1 34 30 2 21-13 32v21q4 10 29 17l29 10q19 9 26 50l14 95-25 6-21-89 4 172q-15 41-70 41t-70-41l4-172-22 89-25-6 15-95q6-40 26-49l29-11q22-8 22-17Z" fill="url(#skin)" stroke="#e9ded0" stroke-width="1.5"/>
  <path d="M272 68v91" fill="none" stroke="#eed0ba" stroke-width="13" stroke-linecap="round"/>
  <g class="${cls(0)}" data-organ="0" tabindex="0" role="button" aria-label="입 단계로 이동"><path d="M263 56q12-6 25 0-7 12-25 0" fill="#d8897a"/><ellipse cx="275" cy="57" rx="19" ry="11" fill="transparent"/></g>
  <g class="${cls(1)}" data-organ="1" tabindex="0" role="button" aria-label="식도 단계로 이동"><path d="M275 65v92q0 10 10 16" fill="none" stroke="#de9f89" stroke-width="9" stroke-linecap="round"/></g>
  <g class="${cls(2)}" data-organ="2" tabindex="0" role="button" aria-label="위 단계로 이동"><path d="M281 157q13 20 24 3 18-14 29 8 18 38-8 58-27 20-45-2-9-11-12-6l-7 13-13-8 11-21q9-12 22-4 15 9 16-6-17-8-17-35Z" fill="url(#stomach)" stroke="#d9806e" stroke-width="2"/><path d="M315 170q13 15 9 31" fill="none" stroke="#ffd2c1" stroke-width="4" stroke-linecap="round"/></g>
  <g class="gland"><path d="M212 160q15-21 59-9l23 18q-29 0-50 16-25 11-35-1Z" fill="#b9816b" stroke="#a76e59" stroke-width="1.5"/><path d="m248 175-4 16q5 8 11 1l-1-16" fill="#8fac78" stroke="#73925c" stroke-width="1.5"/><path d="M266 228q20-17 56-6-20 16-53 13Z" fill="#edc46e" stroke="#d4ab54" stroke-width="1.5"/><path d="M252 191v18l12 22m30-2-29 2" class="juice-path" marker-end="url(#juice-arrow)"/></g>
  <g class="${cls(5)}" data-organ="5" tabindex="0" role="button" aria-label="큰창자 단계로 이동"><path d="M244 334h-12q-9 0-9-15v-66q0-14 14-14h88q13 0 13 15v67q0 19-17 19h-26v23" fill="none" stroke="#ca9a82" stroke-width="19" stroke-linecap="round" stroke-linejoin="round"/><path d="M244 334h-12q-9 0-9-15v-66q0-14 14-14h88q13 0 13 15v67q0 19-17 19h-26v23" fill="none" stroke="#e3bba0" stroke-width="12" stroke-linecap="round" stroke-dasharray="5 8"/></g>
  <g class="${cls(3)}" data-organ="3" tabindex="0" role="button" aria-label="작은창자 소화 단계로 이동"><path d="M262 231v23h45q15 0 11 12-2 6-12 6h-54q-11 0-10 10t12 9h52q12 0 10 10-1 8-13 8h-47q-14 0-12 10t16 9h18" fill="none" stroke="#cf8b73" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="M262 231v23h45q15 0 11 12-2 6-12 6h-54q-11 0-10 10t12 9h52q12 0 10 10-1 8-13 8h-47q-14 0-12 10t16 9h18" fill="none" stroke="#edb49a" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></g>
  <g class="${cls(6)}" data-organ="6" tabindex="0" role="button" aria-label="항문 단계로 이동"><path d="M295 359v17" stroke="#c88d7e" stroke-width="11" stroke-linecap="round"/><ellipse cx="295" cy="378" rx="7" ry="3" fill="#a96d61"/></g>
  ${'<g class="absorb-arrows" opacity="0"><path d="m248 278-35 0m98 24 41 0" stroke="#7aa68c" stroke-width="2" stroke-dasharray="4 4" marker-end="url(#juice-arrow)"/><circle cx="204" cy="278" r="4" fill="#dfa641"/><circle cx="358" cy="302" r="4" fill="#78a18a"/></g>'}
  <g class="organ-labels" font-size="12" fill="#696f65" font-family="inherit">
  <path d="M289 56h64m-73 65h72m-30 66h55m-62 94h64m-83 91h53M214 166h-51m79 27h-77m128 33h83m-146 83h-62" fill="none" stroke="#c9cbbf"/>
  ${[[360,60,'입',0],[360,125,'식도',1],[383,191,'위',2],[383,285,'작은창자',3],[355,376,'항문',6],[131,170,'간',null],[119,197,'쓸개',null],[383,230,'이자',null],[103,313,'큰창자',5]].map(([x,y,t,n])=>`<text x="${x}" y="${y}" ${n!==null?`class="map-label ${n===active||(n===3&&active===4)?'current':''}" data-organ="${n}" tabindex="0" role="button" aria-label="${t} 단계로 이동"`:''}>${t}</text>`).join('')}</g>
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
  document.querySelector('#food-grid').innerHTML=foods.map(f=>`<button class="food-card ${state.food.id===f.id?'selected':''}" data-food="${f.id}" aria-pressed="${state.food.id===f.id}"><span class="food-emoji">${f.emoji}</span><strong>${f.name}</strong><small>${f.subtitle}</small>${state.food.id===f.id?`<span class="selected-check">${icon('check')}</span>`:''}</button>`).join('');
  document.querySelector('#food-profile').innerHTML=`<div class="profile-heading"><strong>${state.food.name} 속 영양소</strong><span>상대 함량</span></div>${Object.entries(nutrients).map(([key,n],i)=>`<div class="profile-row"><span><i style="background:${n.color}"></i>${n.name}</span><div class="profile-bar"><b style="width:${state.food.profile[i]/3*100}%;background:${n.color}"></b></div><small>${['거의 없음','적음','보통','많음'][state.food.profile[i]]}</small></div>`).join('')}`;
  if (!document.querySelector('.anatomy')) document.querySelector('#body-map').innerHTML=bodyMap();
  updateMap();
  document.querySelector('#body-map').classList.toggle('hide-labels',document.querySelector('#labels').getAttribute('aria-pressed')==='false');
  document.querySelector('#stage-count').textContent=`0${state.step+1} / 07`;
  document.querySelector('#play').innerHTML=icon(state.playing?'pause':'play')+(state.playing?'잠시 멈춤':state.step===6?'다시 여행':'여행 시작');
  document.querySelector('#next').disabled=state.step===6;
  renderObservation();
  document.querySelector('#thinking').innerHTML=`<div>${icon('bulb')} <strong>한 걸음 더 생각하기</strong></div><p>${state.predictions[predictionKey()]!==undefined?stages[state.step].tip:'이 기관에서 음식물은 이동할까요, 분해될까요, 흡수될까요? 영양소와 기관의 역할을 연결해 예측해 보세요.'}</p>`;
  document.querySelector('#stage-buttons').innerHTML=stages.map((s,i)=>`<button data-step="${i}" class="stage-button ${state.step===i?'current':state.step>i?'completed':''}" aria-current="${state.step===i?'step':'false'}"><span class="step-dot">${state.step>i?'✓':i+1}</span><span>${s.short}${i===3?'<small>소화</small>':i===4?'<small>흡수</small>':''}</span></button>${i<6?`<span class="stage-line ${state.step>i?'passed':''}"></span>`:''}`).join('');
  document.querySelector('#nutrient-cards').innerHTML=Object.entries(nutrients).filter(([key])=>state.filter==='all'||state.filter===key).map(([key,n])=>{
    const index=Object.keys(nutrients).indexOf(key), present=state.food.profile[index]>0;
    const status=nutrientState(key,state.step);
    const observed=state.predictions[predictionKey()]!==undefined;
    const finalKnown=state.predictions[`${state.food.id}:3`]!==undefined || state.predictions[`${state.food.id}:4`]!==undefined;
    return `<article class="nutrient-card ${present?'':'absent'}" style="--nutrient:${n.color}"><div class="nutrient-card-top"><h3><i></i>${n.name}</h3><span>${present?(observed?status.action:'예측 후 관찰'):'이 음식에는 거의 없음'}</span></div>${present?(observed?molecules(key,status.form):'<div class="absent-graphic">? 먼저 예측 문제를 풀어 보세요</div>'):'<div class="absent-graphic">관찰할 분자가 거의 없어요</div>'}<div class="molecule-description"><strong>${present?(observed?status.label:'어떤 변화가 생길까요?'):'—'}</strong><span>${present?(observed?status.description:'정답을 찾으면 분자 모형과 설명이 열려요.'):`${state.food.name}의 다른 영양소를 관찰해 보세요.`}</span></div><div class="nutrient-destination">최종 소화 산물 ${icon('arrow')} <b>${finalKnown?n.final:'?'}</b></div></article>`;
  }).join('');
  document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b.dataset.filter===state.filter));
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
function renderObservation() {
  const q=stageQuestions[state.step], key=predictionKey(), answer=state.predictions[key];
  const resolved=answer!==undefined, attempt=state.attempts[key];
  document.querySelector('#observation').innerHTML=`<div class="stage-pill">STEP 0${state.step+1} <span>·</span> ${stages[state.step].name}</div><div class="prediction-heading"><span>먼저 예측해요</span><small>${Object.keys(state.predictions).filter(k=>k.startsWith(state.food.id+':')).length} / 7 탐구 완료</small></div><h3 class="prediction-question">${q.text}</h3><div class="prediction-options">${q.choices.map((c,i)=>`<button data-predict="${i}" ${resolved?'disabled':''} class="${resolved&&i===q.answer?'correct':!resolved&&attempt===i?'incorrect':''}"><span>${i+1}</span>${c}${resolved&&i===q.answer?icon('check'):''}</button>`).join('')}</div>${resolved?`<div class="prediction-feedback" role="status"><strong>이유까지 연결했어요!</strong><p>${q.explanation}</p></div><details class="stage-explanation"><summary>기관의 역할 더 알아보기</summary><p>${stages[state.step].detail}</p><div class="enzyme-box"><span>이 단계의 핵심</span><strong>${stages[state.step].enzyme}</strong></div></details>${state.step<6?`<button class="primary continue-button" id="continue">계속 여행하기 ${icon('arrow')}</button>`:'<div class="journey-done">한입의 여행 완료! 다른 음식과 비교해 보세요.</div>'}`:`${attempt!==undefined?'<p class="try-again" role="status">다시 생각해 볼까요? 힌트를 보고 다른 답을 골라 보세요.</p>':''}<button class="hint-button" id="hint">${icon('bulb')} ${state.hint?'힌트 접기':'힌트 보기'}</button>${state.hint?`<p class="prediction-hint">${q.hint}</p>`:''}<p class="prediction-prompt">답을 고른 뒤 해설이 열려요.<br>틀려도 괜찮아요. 이유를 생각하며 다시 골라요.</p>`}<div class="food-observation"><span>${state.food.emoji}</span><p><b>${state.food.name} 관찰 포인트</b>${state.food.note}</p></div>`;
}
function stop(){state.playing=false;cancelAnimationFrame(frame);lastTime=undefined;}
function animate(now){
  if(!state.playing)return;
  const elapsed=lastTime===undefined?0:Math.min(now-lastTime,100);
  lastTime=now;
  state.progress=Math.min(1,state.progress+elapsed*state.speed/1800);
  placeMarker();
  if(state.progress>=1){
    state.step++; state.progress=0; state.hint=false;
    if(state.step===6 || (state.quizPause && state.predictions[predictionKey()]===undefined))stop();
    update();
  }
  if(state.playing)frame=requestAnimationFrame(animate);
}
function start(){
  if(state.step===6){state.step=0;state.progress=0;}
  state.playing=true;lastTime=undefined;frame=requestAnimationFrame(animate);update();
}
function jump(step){stop();state.step=step;state.progress=0;state.hint=false;update();}
function setView(view){stop();state.view=view;['explore','notes','quiz'].forEach(v=>{document.querySelector(`#${v}-view`).hidden=v!==view;});document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));if(view==='notes')renderNotes();if(view==='quiz')renderQuiz();update();}
function renderNotes(){document.querySelector('#notes-view').innerHTML=`<div class="notes-intro"><span class="eyebrow">CONNECT THE DOTS</span><h2>한입에 담긴 과학, 차근차근.</h2><p>소화 기관의 역할과 영양소의 경로를 연결해 보세요.</p></div><div class="notes-grid">${Object.entries(nutrients).map(([key,n])=>`<article class="panel note-card" style="--nutrient:${n.color}"><h3><i style="background:${n.color}"></i>${n.name}의 여행</h3><div class="note-flow">${key==='starch'?'녹말 → 엿당 → 포도당':key==='protein'?'단백질 → 작은 조각 → 아미노산':'지방 → 작은 지방 방울 → 지방산 + 모노글리세리드'}</div><p>${key==='starch'?'입에서 침 아밀레이스가 작용해요. 작은창자에서 이자액의 아밀레이스와 엿당 분해 효소 등의 작용으로 포도당이 돼요.':key==='protein'?'위의 펩신이 분해를 시작해요. 작은창자에서 트립신과 여러 효소가 작용하여 아미노산이 돼요.':'작은창자에서 쓸개즙이 유화한 후, 라이페이스가 지방을 분해해요. 쓸개즙의 유화는 효소에 의한 화학적 분해가 아니에요.'}</p><strong class="note-route">${n.route}</strong></article>`).join('')}</div><article class="panel notes-table"><h3>기관별 역할 한눈에 보기</h3><div class="table-scroll"><table><thead><tr><th>기관</th><th>무엇을 할까요?</th><th>주요 작용</th></tr></thead><tbody>${stages.map(s=>`<tr><th>${s.name}</th><td>${s.verb}</td><td>${s.enzyme}</td></tr>`).join('')}</tbody></table></div></article><div class="learning-footer">${icon('bulb')} 간·쓸개·이자는 소화액을 공급해요. 음식물이 직접 지나가는 소화관은 아니에요.</div><p class="reference">참고: 비상교육 중학교 과학 2, 194–199쪽. 이 모형은 주요 영양소의 경로를 단순화했으며 실제 소화 시간·분자 수·영양 성분을 정량적으로 나타내지 않아요.</p>`;}
function renderQuiz(){const q=questions[state.quiz], answer=state.answers[state.quiz], done=Object.keys(state.answers).length===questions.length;
  document.querySelector('#quiz-view').innerHTML=`<div class="quiz-layout"><div class="quiz-intro"><div class="eyebrow">CHECK YOUR DISCOVERY</div><h2>오늘의 발견을<br>내 것으로 만들어요.</h2><p>정답보다 중요한 건, 이유를 아는 것.<br>탐험하며 알게 된 내용을 떠올려 보세요.</p><div class="quiz-illustration">🍚 <span>→</span> ✨</div><button class="text-button" data-view="explore">탐험실로 돌아가기 ${icon('arrow')}</button></div><article class="panel quiz-card"><div class="quiz-count">질문 0${state.quiz+1} <span>/ 0${questions.length}</span></div><h3>${q.text}</h3><div class="quiz-options">${q.choices.map((c,i)=>`<button data-answer="${i}" ${answer!==undefined?'disabled':''} class="${answer!==undefined&&i===q.answer?'correct':answer===i?'incorrect':''}"><span>${String.fromCharCode(65+i)}</span>${c}${answer!==undefined&&i===q.answer?icon('check'):''}</button>`).join('')}</div>${answer!==undefined?`<div class="quiz-feedback ${answer===q.answer?'right':'wrong'}"><strong>${answer===q.answer?'잘 발견했어요!':'다시 연결해 볼까요?'}</strong><p>${q.explanation}</p></div>`:''}<div class="quiz-bottom"><button id="quiz-prev" ${state.quiz===0?'disabled':''}>이전 질문</button><span>${Object.keys(state.answers).length}개 응답 완료</span>${state.quiz<2?'<button class="primary" id="quiz-next">다음 질문 →</button>':'<button class="primary" id="quiz-restart">다시 풀기 ↻</button>'}</div>${done?`<p class="quiz-result">학습 완료 · ${questions.filter((q,i)=>state.answers[i]===q.answer).length} / 3개 정답. 해설을 읽고 음식의 여행을 다시 관찰해 보세요.</p>`:''}</article></div>`;}
app.addEventListener('click',event=>{const b=event.target.closest('button, [data-organ]');if(!b)return;
  if(b.dataset.food){stop();state.progress=0;state.hint=false;state.food=foods.find(f=>f.id===b.dataset.food);state.step=0;update();}
  if(b.dataset.step!==undefined)jump(Number(b.dataset.step));
  if(b.dataset.organ!==undefined)jump(Number(b.dataset.organ));
  if(b.dataset.filter){state.filter=b.dataset.filter;update();}
  if(b.dataset.view)setView(b.dataset.view);
  if(b.dataset.answer!==undefined && state.answers[state.quiz]===undefined){state.answers[state.quiz]=Number(b.dataset.answer);renderQuiz();}
  if(b.id==='play'){if(state.playing){stop();update();}else start();}
  if(b.id==='continue'){stop();start();}
  if(b.id==='hint'){state.hint=!state.hint;renderObservation();}
  if(b.dataset.predict!==undefined && state.predictions[predictionKey()]===undefined){stop();const answer=Number(b.dataset.predict);state.attempts[predictionKey()]=answer;if(answer===stageQuestions[state.step].answer)state.predictions[predictionKey()]=answer;else state.hint=true;update();}
  if(b.id==='reset'){stop();state.step=0;state.progress=0;state.hint=false;for(const key of Object.keys(state.predictions))if(key.startsWith(state.food.id+':'))delete state.predictions[key];for(const key of Object.keys(state.attempts))if(key.startsWith(state.food.id+':'))delete state.attempts[key];update();}
  if(b.id==='next')jump(Math.min(6,state.step+1));
  if(b.id==='labels'){const show=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(show));b.querySelector('.toggle').classList.toggle('on',show);document.querySelector('#body-map').classList.toggle('hide-labels',!show);}
  if(b.id==='guide'){stop();update();document.querySelector('#guide-dialog').showModal();}
  if(b.classList.contains('dialog-close')||b.classList.contains('dialog-start'))document.querySelector('#guide-dialog').close();
  if(b.id==='quiz-next'){state.quiz++;renderQuiz();}if(b.id==='quiz-prev'){state.quiz--;renderQuiz();}if(b.id==='quiz-restart'){state.quiz=0;state.answers={};renderQuiz();}
});
app.addEventListener('keydown',e=>{const organ=e.target.closest('[data-organ]');if(organ && (e.key==='Enter'||e.key===' ')){e.preventDefault();jump(Number(organ.dataset.organ));}});
document.querySelector('#quiz-pause').addEventListener('change',e=>{state.quizPause=e.target.checked;});
document.querySelector('#speed').addEventListener('change',e=>{state.speed=Number(e.target.value);});
update();
