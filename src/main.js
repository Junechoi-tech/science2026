import '@fontsource-variable/noto-sans-kr';
import './style.css';
import { scenarios, cross, probabilities, phenotype, statusLabels, makeChildren, gametes } from './genetics.js';
import { createMolecule } from './molecule.js';

const icons = {
  leaf: '<path d="M19 4C9 2 3 8 6 16c8 4 15-2 13-12Z"/><path d="M4 21 15 10M9 16v-5m0 5h5"/>',
  tree: '<rect x="9" y="3" width="6" height="6" rx="2"/><rect x="2" y="16" width="6" height="6" rx="2"/><rect x="16" y="16" width="6" height="6" rx="2"/><path d="M12 9v4H5v3m7-3h7v3"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  book: '<path d="M12 5C9 3 5 3 2 4v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-7-1-10 1Zm0 0v15"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  reset: '<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
  shuffle: '<path d="M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 4-3 5-6m3-4c1-1 2-2 4-2h3m-4-4 4 4-4 4"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  play: '<path d="m8 4 12 8-12 8Z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  rotate: '<path d="M4 10a8 8 0 1 1 2 8M4 4v6h6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.spark}</svg>`;
const state = { mode: 'recessive', father: 'Aa', mother: 'Aa', count: 4, step: 0, revealed: false, selected: 'I-2', hypothesis: null, checked: false, view: 'pedigree', children: [], rotating: true, model: 'dna' };
const steps = ['가계도 관찰', '유전 방식 추론', '교배로 검증', '결론 정리'];
let molecule;

document.querySelector('#app').innerHTML = `
  <aside class="sidebar">
    <a class="brand" href="./" aria-label="유전의 숲 홈"><span class="brand-mark">${icon('leaf')}</span><span>유전의 숲<small>GENE GARDEN</small></span></a>
    <div class="workspace-label">MY LEARNING SPACE <span>✦</span></div>
    <nav aria-label="학습 메뉴">
      <button class="nav-item active" data-view="pedigree">${icon('tree')} 가계도 실험실 <span class="nav-count">01</span></button>
      <button class="nav-item" data-view="cross">${icon('grid')} 교배 시뮬레이션</button>
      <button class="nav-item" data-view="notes">${icon('book')} 유전 개념 노트</button>
    </nav>
    <div class="side-lesson"><span class="tiny-label">TODAY’S JOURNEY</span><div class="lesson-title">작은 발견이 자라는 시간 <span>🌱</span></div><div class="side-progress"><span id="side-progress-fill"></span></div><p id="side-progress-text">4단계 중 1단계 탐험 중</p></div>
    <div class="side-bottom"><div class="mascot small"><i></i><i></i><b>ᴗ</b><span class="sprout">⌁</span></div><p>조금씩 알아가도 괜찮아.<br>우린 모두 탐험 중이니까!</p><span class="side-bottom-line"></span><span class="side-footer">과학을 더 가깝고, 다정하게.</span></div>
  </aside>
  <div class="app-content">
    <header class="topbar"><div class="breadcrumb">학습 공간 <span>/</span> <strong id="breadcrumb-title">가계도 실험실</strong></div><div class="top-actions"><span class="saved"><span></span> 자유롭게 실험해 보세요</span><button id="guide-button" class="icon-button" aria-label="학습 가이드 열기">${icon('info')}</button><span class="avatar">G<span>✦</span></span></div></header>
    <main>
      <section class="hero"><div><span class="eyebrow"><span></span> LITTLE GENES, BIG DISCOVERIES</span><h1>우리 가족의 비밀,<br>유전자로 <span>연결해요.</span><span class="title-spark">✧</span></h1><p>닮은 듯 다른 우리 가족. 작은 유전자에서 시작된 이야기를 따라가 볼까요?</p></div><div class="hero-side"><span class="hero-pill">${icon('leaf')} 오늘의 탐험</span><p>관찰하고, 추론하고, 발견하는<br><strong>나만의 작은 유전 실험실</strong></p><span class="hero-doodle">✳</span></div></section>
      <div class="section-heading"><h2 id="view-heading">가계도 실험실 <span>Pedigree Lab</span></h2><button id="reset" class="text-button">${icon('reset')} 처음부터</button></div>
      <section class="scenario-bar" aria-label="실험 조건"><div class="scenario-select"><span class="control-label"><span class="step-dot">1</span> 탐구할 유전 상황</span><select id="scenario" aria-label="유전 상황 선택">${Object.entries(scenarios).map(([k, v]) => `<option value="${k}">${v.title}</option>`).join('')}</select></div><div class="parent-select"><label for="father">아버지 유전자형</label><select id="father"></select></div><div class="cross-symbol">×</div><div class="parent-select"><label for="mother">어머니 유전자형</label><select id="mother"></select></div><div class="child-count"><label for="child-count">자녀 수 <b id="count-value">4명</b></label><input type="range" id="child-count" min="2" max="4" value="4" aria-label="자녀 수" /></div><span class="live-badge"><span></span> LIVE</span></section>
      <div id="lab-view">
        <div class="lab-grid">
          <section class="card pedigree-card"><div class="card-heading"><div><span class="card-kicker">FAMILY CONNECTIONS</span><h3>한눈에 보는 우리 가족 <span class="soft-tag">2세대</span></h3></div><label class="toggle-label"><input type="checkbox" id="reveal" role="switch"/><span class="toggle"></span> 유전자형 보기</label></div>
            <div class="pedigree-toolbar"><span id="scenario-tag" class="scenario-tag"></span><div class="pedigree-actions"><button id="transmit" class="text-button">${icon('play')} 전달 과정 보기</button><button id="resample" class="text-button">${icon('shuffle')} 자녀 다시 생성</button></div></div>
            <div id="pedigree" class="pedigree" aria-label="유전 가계도"></div>
            <div class="pedigree-legend"><span><i class="legend-shape male"></i> 남성</span><span><i class="legend-shape female"></i> 여성</span><span><i class="legend-dot affected"></i> 형질 발현</span><span><i class="legend-dot carrier"></i> 보인자<small> (공개 시)</small></span><span><i class="legend-dot clear"></i> 미발현</span></div>
            <div id="member-detail" class="member-detail" aria-live="polite"></div>
          </section>
          <section class="card model-card"><div class="card-heading"><div><span class="card-kicker">A CLOSER LOOK</span><h3>작은 유전자 속으로 <span class="soft-tag purple">3D</span></h3></div><span class="model-star">✧</span></div><div class="model-tabs" role="group" aria-label="3D 모델 선택"><button class="active" data-model="dna">DNA 이중나선</button><button data-model="chromosome">상동 염색체</button></div><div class="model-stage" id="model-stage"><canvas id="molecule" aria-label="마우스나 터치로 회전하고 확대할 수 있는 3D 유전 모델"></canvas><span class="model-annotation annotation-left">작은 정보가<br><b>모여서</b> <i>↘</i></span><span class="model-annotation annotation-right">나를 만드는<br><b>설계도</b> <i>↖</i></span><span class="model-orbit"></span><div class="model-fallback" hidden>3D 가속을 사용할 수 없어요.<br>아래 개념 노트에서 DNA 구조를 살펴보세요.</div></div><div class="model-controls"><span>드래그해서 돌려보세요</span><div><button id="rotate-model" class="icon-button" aria-label="자동 회전 일시정지">${icon('pause')}</button><button id="reset-model" class="icon-button" aria-label="3D 시점 초기화">${icon('rotate')}</button></div></div><label class="zoom-control">확대 <input id="model-zoom" type="range" min="5" max="14" value="9" step="0.1" aria-label="3D 모델 확대" /> 축소</label><p id="model-caption" class="model-caption">DNA는 유전 정보를 담고 있어요. <span>구조를 단순화한 모형이에요.</span></p></section>
        </div>
        <section class="card learning-card"><div class="learning-top"><div><span class="card-kicker">THINK LIKE A SCIENTIST</span><h3>하나씩 따라가면, 유전이 보여요 <span>✦</span></h3></div><span id="step-counter" class="step-counter">STEP 01 / 04</span></div><div id="steps" class="stepper" aria-label="분석 단계"></div><div id="step-content" class="step-content" aria-live="polite"></div><div class="learning-bottom"><p>${icon('info')} 답보다 중요한 건, 근거를 찾아가는 과정이에요.</p><div><button id="prev-step" class="button secondary">이전 단계</button><button id="next-step" class="button primary">다음 단계 ${icon('arrow')}</button></div></div></section>
      </div>
      <section id="cross-view" class="card standalone" hidden></section>
      <section id="notes-view" class="notes-view" hidden></section>
      <div id="assumption" class="assumption"></div>
      <footer class="page-footer"><span>작은 유전자, 무한한 이야기. <b>유전의 숲</b></span><span>Made for curious minds <span class="footer-leaf">✿</span></span></footer>
    </main>
  </div>
  <dialog id="guide"><div class="dialog-heading"><span class="dialog-icon">🌱</span><button id="close-guide" class="icon-button" aria-label="가이드 닫기">${icon('close')}</button></div><span class="eyebrow">WELCOME TO GENE GARDEN</span><h2>작은 유전 탐험을 시작해요.</h2><p>부모에게 받은 유전자가 어떻게 자녀의 형질로 이어질까요? 조건을 바꾸고 근거를 찾아보세요.</p><ol><li><b>상황을 골라요.</b> 유전 방식과 부모의 유전자형을 선택해요.</li><li><b>가족을 관찰해요.</b> 가계도의 인물을 눌러 정보를 확인해요.</li><li><b>차근차근 추론해요.</b> 네 단계의 탐구와 교배 표로 가설을 검증해요.</li><li><b>3D로 들여다봐요.</b> 드래그로 회전하고 휠이나 슬라이더로 확대해요.</li></ol><div class="guide-note">이 실험실은 교육용 모형이며 개인의 질환을 예측하거나 진단하지 않아요. 설정과 학습 진행은 현재 페이지에서만 유지돼요.</div><button id="start-exploring" class="button primary">탐험 시작하기 ${icon('arrow')}</button></dialog>
  <div id="toast" role="status"></div>
`;

function currentCross() { return cross(state.father, state.mother, state.mode); }
function percentage(n) { return `${Math.round(n * 100)}%`; }
function options() {
  for (const role of ['father', 'mother']) document.querySelector(`#${role}`).innerHTML = scenarios[state.mode][role].map(g => `<option ${g === state[role] ? 'selected' : ''}>${g}</option>`).join('');
}
function sample(initial = false) {
  if (initial) {
    const values = [.02, .3, .3, .7, .95, .25, .55, .8]; let n = 0;
    state.children = makeChildren(currentCross(), state.count, () => values[n++ % values.length]);
  } else state.children = makeChildren(currentCross(), state.count);
}
function memberHTML(member, x, y, name) {
  const selected = state.selected === member.id;
  const actualStatus = phenotype(member.genotype, state.mode);
  const visibleStatus = actualStatus === 'carrier' && !state.revealed ? 'clear' : actualStatus;
  const isMale = member.sex === 'male';
  const shape = isMale ? `<rect x="${x - 23}" y="${y - 23}" width="46" height="46" rx="4"/>` : `<circle cx="${x}" cy="${y}" r="24"/>`;
  const readable = `${member.id} ${name}, ${statusLabels[actualStatus === 'carrier' && !state.revealed ? 'clear' : actualStatus]}${state.revealed ? ', ' + member.genotype : ''}`;
  return `<g class="family-member ${visibleStatus} ${selected ? 'selected' : ''}" data-member="${member.id}" role="button" tabindex="0" aria-label="${readable}" aria-pressed="${selected}"><title>${readable}</title><circle class="selection-halo" cx="${x}" cy="${y}" r="34"/><g class="person-shape">${shape}</g><g class="face"><circle cx="${x - 7}" cy="${y - 2}" r="1.7"/><circle cx="${x + 7}" cy="${y - 2}" r="1.7"/><path d="M${x - 4} ${y + 6}q4 5 8 0"/><ellipse class="blush" cx="${x - 13}" cy="${y + 5}" rx="4" ry="2"/><ellipse class="blush" cx="${x + 13}" cy="${y + 5}" rx="4" ry="2"/></g><text class="person-id" x="${x}" y="${y + 48}" text-anchor="middle">${member.id} <tspan>${name}</tspan></text><text class="person-genotype" x="${x}" y="${y + 67}" text-anchor="middle">${state.revealed ? member.genotype : '유전자형 ?'}</text>${selected ? `<text class="selected-star" x="${x + 30}" y="${y - 26}">✦</text>` : ''}</g>`;
}
function parents() { return [{ id: 'I-1', genotype: state.father, sex: 'male' }, { id: 'I-2', genotype: state.mother, sex: 'female' }]; }
function pedigree() {
  const xs = state.children.map((_, i) => 130 + i * (380 / (state.count - 1)));
  document.querySelector('#pedigree').innerHTML = `<svg viewBox="0 0 640 300" role="group" aria-label="부모와 자녀 두 세대의 가계도"><text class="generation-label" x="28" y="68">Ⅰ</text><text class="generation-label" x="28" y="202">Ⅱ</text><path class="family-line" d="M263 60H377M320 60V138M${xs[0]} 138H${xs.at(-1)}${xs.map(x => `M${x} 138V173`).join('')}"/>${memberHTML(parents()[0], 240, 60, '아버지')}${memberHTML(parents()[1], 400, 60, '어머니')}${state.children.map((c, i) => memberHTML(c, xs[i], 198, `자녀 ${i + 1}`)).join('')}<text class="pedigree-hint" x="320" y="296" text-anchor="middle">가족 구성원을 누르면 유전 정보를 살펴볼 수 있어요</text></svg>`;
  document.querySelectorAll('[data-member]').forEach(el => {
    const select = () => { state.selected = el.dataset.member; pedigree(); memberDetail(); molecule?.setAlleles(selectedMember().genotype, state.mode); };
    el.addEventListener('click', select);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); document.querySelector(`[data-member="${state.selected}"]`).focus(); } });
  });
}
function selectedMember() { return [...parents(), ...state.children].find(c => c.id === state.selected) || parents()[1]; }
function memberDetail() {
  const m = selectedMember(); const p = phenotype(m.genotype, state.mode);
  document.querySelector('#member-detail').innerHTML = `<span class="member-badge">${m.sex === 'male' ? '□' : '○'}</span><div><b>${m.id} · ${m.id === 'I-1' ? '아버지' : m.id === 'I-2' ? '어머니' : `자녀 ${m.id.slice(3)}`}</b><p>${state.revealed ? `${m.genotype} · ${statusLabels[p]}${p === 'carrier' ? ' — 형질은 나타나지 않지만 대립유전자를 전달할 수 있어요.' : ''}` : '유전자형을 추론해 보세요. 위의 스위치를 켜면 정답이 보여요.'}</p></div><span class="detail-spark">✧</span>`;
}

function punnettHTML() {
  const o = currentCross(); const p = probabilities(o); const fg = gametes(state.father, state.mode); const mg = gametes(state.mother, state.mode);
  return `<div class="cross-content"><div class="punnett-wrap"><span class="axis-label">아버지의 생식세포 →</span><div class="punnett"><div class="punnett-corner">×</div>${fg.map(g => `<div class="gamete paternal">${g}</div>`).join('')}${mg.map((g, j) => `<div class="gamete maternal">${g}</div>${fg.map((_, i) => { const v = o[i * 2 + j]; return `<div class="punnett-cell ${v.status}"><b>${v.genotype}</b><small>${statusLabels[v.status]} · 25%</small></div>`; }).join('')}`).join('')}</div><p class="cross-footnote">행: 어머니의 생식세포 · 각 칸의 수정 확률은 25%</p></div><div class="probability-panel"><span class="tiny-label">EXPECTED PROBABILITY</span><h4>자녀에게 나타날 확률은?</h4>${['affected', 'carrier', 'clear'].map(k => `<div class="probability-row"><div><span class="legend-dot ${k}"></span>${k === 'clear' ? '미발현 · 비보인자' : statusLabels[k]}<b>${percentage(p[k])}</b></div><div class="probability-track"><span class="${k}" style="width:${percentage(p[k])}"></span></div></div>`).join('')}<p class="probability-note">${icon('info')} 매 출생은 독립적인 사건이에요. 자녀 4명 중 반드시 1명에게 발현한다는 뜻은 아니에요.</p>${state.mode === 'xlinked' ? `<p class="x-note">남아 중 발현 확률: <b>${percentage(o.filter(x => x.sex === 'male' && x.status === 'affected').length / 2)}</b> · 여아 중: <b>${percentage(o.filter(x => x.sex === 'female' && x.status === 'affected').length / 2)}</b></p>` : ''}</div></div>`;
}

function stepContent() {
  const s = scenarios[state.mode]; const p = probabilities(currentCross());
  if (state.step === 0) return `<div class="step-mascot"><div class="mascot"><i></i><i></i><b>ᴗ</b><span class="sprout">⌁</span></div></div><div class="step-copy"><span class="step-eyebrow">01 · 관찰에서 시작해요</span><h4>누구에게 형질이 나타났나요?</h4><p>색이 채워진 기호는 형질이 발현된 사람이에요. 부모와 자녀의 모습을 비교하고, 성별에 따른 차이도 살펴보세요.</p><div class="observation-chips"><span>부모 ${parents().filter(x => phenotype(x.genotype, state.mode) === 'affected').length}명 발현</span><span>자녀 ${state.children.filter(x => x.status === 'affected').length}명 발현</span><span>표본 ${state.count}명</span></div><p class="subtle-note">모의 표본만으로 유전 방식을 확정할 수는 없어요. 다음 단계에서 가설을 세워봐요.</p></div>`;
  if (state.step === 1) return `<div class="step-copy full"><span class="step-eyebrow">02 · 가설을 세워요</span><h4>선택한 상황을 설명하는 유전 방식은 무엇일까요?</h4><p>${s.description} 설정의 단서를 바탕으로 골라보세요.</p><div class="hypothesis-options">${Object.entries(scenarios).map(([key, v]) => `<button class="hypothesis ${state.hypothesis === key ? 'chosen' : ''}" data-hypothesis="${key}" aria-pressed="${state.hypothesis === key}">${v.short}${state.hypothesis === key ? icon('check') : ''}</button>`).join('')}</div><div class="hypothesis-result" role="status">${state.checked ? state.hypothesis === state.mode ? `${icon('check')} 맞아요! ${s.tag}. 교배 표에서 가능한 조합을 확인해 볼까요?` : `${icon('info')} 다시 생각해 볼까요? ${s.description} 가계도 한 장만으로 다른 유전 방식을 모두 배제할 수는 없어요.` : '가설을 고르고 ‘가설 확인’을 눌러보세요.'}</div><button id="check-hypothesis" class="button secondary" ${state.hypothesis ? '' : 'disabled'}>가설 확인 ${icon('check')}</button></div>`;
  if (state.step === 2) return `<div class="step-copy full"><span class="step-eyebrow">03 · 가능한 조합을 모두 살펴봐요</span><h4>${state.father} × ${state.mother}, 자녀는 어떤 유전자형을 가질까요?</h4>${punnettHTML()}</div>`;
  return `<div class="conclusion-art">✿<span>발견 완료!</span></div><div class="step-copy"><span class="step-eyebrow">04 · 근거를 모아 정리해요</span><h4>유전은 정해진 결과가 아닌, 가능성의 이야기!</h4><p><b>${s.title}</b>에서 ${state.father}인 아버지와 ${state.mother}인 어머니 사이에 태어나는 자녀의 형질 발현 확률은 <b class="highlight">${percentage(p.affected)}</b>예요.</p><p>${s.description} 작은 가족 표본의 결과는 이론적 비율과 다를 수 있으니, 교배 표와 함께 해석해요.</p><div class="completion-badge">${icon('check')} 관찰 · 가설 · 검증 · 결론, 탐구 여정 완료</div></div>`;
}

function renderSteps() {
  document.querySelector('#steps').innerHTML = steps.map((s, i) => `<button class="step ${state.step === i ? 'current' : ''} ${state.step > i ? 'done' : ''}" data-step="${i}" ${state.step === i ? 'aria-current="step"' : ''}><span>${state.step > i ? icon('check') : String(i + 1).padStart(2, '0')}</span><b>${s}</b>${i < 3 ? icon('chevron', 'step-chevron') : ''}</button>`).join('');
  document.querySelector('#step-content').innerHTML = stepContent();
  document.querySelector('#step-counter').textContent = `STEP 0${state.step + 1} / 04`;
  document.querySelector('#prev-step').disabled = state.step === 0;
  document.querySelector('#next-step').innerHTML = state.step === 3 ? `다시 탐구하기 ${icon('reset')}` : `다음 단계 ${icon('arrow')}`;
  document.querySelector('#side-progress-fill').style.width = `${(state.step + 1) * 25}%`;
  document.querySelector('#side-progress-text').textContent = state.step === 3 ? '오늘의 탐구를 완성했어요!' : `4단계 중 ${state.step + 1}단계 탐험 중`;
  document.querySelectorAll('[data-step]').forEach(el => el.onclick = () => { state.step = Number(el.dataset.step); renderSteps(); });
  document.querySelectorAll('[data-hypothesis]').forEach(el => el.onclick = () => { state.hypothesis = el.dataset.hypothesis; state.checked = false; renderSteps(); });
  const check = document.querySelector('#check-hypothesis');
  if (check) check.onclick = () => { state.checked = true; renderSteps(); };
}

function renderNotes() {
  document.querySelector('#notes-view').innerHTML = `<div class="notes-intro"><span class="eyebrow">YOUR LITTLE FIELD GUIDE</span><h3>알아두면 더 잘 보이는 작은 개념들</h3><p>유전자를 읽는 여섯 가지 열쇠를 만나보세요.</p></div><div class="notes-grid">${[
    ['01', '🧬', '유전자와 대립유전자', '유전자는 특정 기능과 관련된 DNA 구간이에요. 같은 유전자의 서로 다른 형태를 대립유전자라고 해요. A와 a는 서로 다른 대립유전자를 나타내는 기호예요.'],
    ['02', '🌱', '유전자형과 표현형', 'Aa처럼 대립유전자의 조합을 나타내는 것이 유전자형, 실제 관찰되는 특성이 표현형이에요. 이 모형에서는 색으로 형질의 발현을 나타내요.'],
    ['03', '💜', '우성과 열성', '완전 우성 모형에서 Aa는 우성 표현형을 나타내요. 우성은 더 좋거나 흔하다는 뜻이 아니며, 모든 형질이 완전 우성으로 설명되는 것도 아니에요.'],
    ['04', '🌼', '보인자', '열성 유전에서 형질을 발현하지 않으면서 열성 대립유전자를 가진 사람이에요. Aa 또는 이 X 연관 모형의 XᴴXʰ가 해당하며 자녀에게 대립유전자를 전달할 수 있어요.'],
    ['05', '🎲', '독립적인 확률', '같은 부모에게서 태어나는 각 자녀의 유전 확률은 앞선 자녀의 결과에 따라 바뀌지 않아요. 25%는 자녀 4명 중 정확히 1명이라는 보장이 아니에요.'],
    ['06', '🔎', '모형과 실제 사람', '실제의 키·피부색·눈 색깔 등은 여러 유전자와 환경의 영향을 받아요. 이 실험의 단일 유전자 규칙을 모든 인간의 특성에 적용할 수는 없어요.'],
  ].map(([n, e, t, d]) => `<article class="card note-card"><span class="note-emoji">${e}</span><span class="note-number">${n}</span><h4>${t}</h4><p>${d}</p></article>`).join('')}</div>`;
}
function render() {
  options(); pedigree(); memberDetail(); renderSteps(); renderNotes();
  document.querySelector('#cross-view').innerHTML = `<div class="card-heading"><div><span class="card-kicker">PUNNETT SQUARE</span><h3>작은 조합이 만드는 다양한 가능성</h3></div><span class="soft-tag">${scenarios[state.mode].short}</span></div><p class="standalone-intro">위에서 부모의 유전자형을 바꿔보세요. 가능한 모든 수정 조합과 이론적 확률이 함께 바뀌어요.</p>${punnettHTML()}`;
  document.querySelector('#scenario-tag').textContent = `${scenarios[state.mode].example} · ${scenarios[state.mode].tag}`;
  document.querySelector('#assumption').innerHTML = `${icon('info')}<p><b>이 실험의 약속</b> ${scenarios[state.mode].assumption} 사람의 가치를 평가하는 특성이 아니며, 개인의 진단이나 유전 상담을 대신하지 않아요.</p>`;
  molecule?.setAlleles(selectedMember().genotype, state.mode);
  document.querySelector('[data-model="chromosome"]').textContent = state.mode === 'xlinked' ? '성염색체' : '상동 염색체';
}

function toast(message) { const el = document.querySelector('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2800); }
document.querySelector('#scenario').onchange = e => { state.mode = e.target.value; [state.father, state.mother] = scenarios[state.mode].defaults; state.hypothesis = null; state.checked = false; state.step = 0; sample(); render(); toast('새로운 유전 상황으로 실험을 준비했어요.'); };
for (const role of ['father', 'mother']) document.querySelector(`#${role}`).onchange = e => { state[role] = e.target.value; state.checked = false; sample(); render(); };
document.querySelector('#child-count').oninput = e => { state.count = Number(e.target.value); document.querySelector('#count-value').textContent = `${state.count}명`; sample(); if (!state.children.some(c => c.id === state.selected) && state.selected.startsWith('II')) state.selected = 'I-2'; render(); };
document.querySelector('#reveal').onchange = e => { state.revealed = e.target.checked; pedigree(); memberDetail(); };
document.querySelector('#resample').onclick = () => { sample(); render(); toast('가능한 유전자 조합에서 자녀를 무작위로 다시 생성했어요.'); };
let transmissionTimer;
document.querySelector('#transmit').onclick = () => {
  clearTimeout(transmissionTimer);
  const child = state.children.find(c => c.id === state.selected) || state.children[0];
  state.selected = child.id; pedigree(); memberDetail(); molecule?.setAlleles(child.genotype, state.mode);
  const childX = 130 + state.children.indexOf(child) * (380 / (state.count - 1));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const token = (allele, x, color, shift) => `<g class="inheritance-token"><animateMotion dur="${reduced ? '0.01' : '2.4'}s" fill="freeze" path="M${x} 60 L320 60 L320 138 L${childX} 138 L${childX + shift} 167"/><circle r="14" fill="${color}" stroke="#fffefb" stroke-width="2"/><text text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="11" font-weight="600">${allele}</text></g>`;
  document.querySelector('#pedigree svg').insertAdjacentHTML('beforeend', token(child.paternal, 240, '#7e9e6a', -16) + token(child.maternal, 400, '#aa8ebd', 16));
  toast(`아버지의 ${child.paternal} + 어머니의 ${child.maternal} → ${child.id}의 ${child.genotype} · ${statusLabels[child.status]}`);
  transmissionTimer = setTimeout(() => document.querySelectorAll('.inheritance-token').forEach(el => el.remove()), 4000);
};
document.querySelector('#prev-step').onclick = () => { state.step = Math.max(0, state.step - 1); renderSteps(); };
document.querySelector('#next-step').onclick = () => { state.step = (state.step + 1) % 4; renderSteps(); };
document.querySelector('#reset').onclick = () => {
  Object.assign(state, { mode: 'recessive', father: 'Aa', mother: 'Aa', count: 4, step: 0, revealed: false, selected: 'I-2', hypothesis: null, checked: false, model: 'dna', rotating: !window.matchMedia('(prefers-reduced-motion: reduce)').matches });
  document.querySelector('#scenario').value = state.mode;
  document.querySelector('#reveal').checked = false;
  document.querySelector('#child-count').value = 4;
  document.querySelector('#count-value').textContent = '4명';
  document.querySelectorAll('[data-model]').forEach(el => { el.classList.toggle('active', el.dataset.model === 'dna'); el.setAttribute('aria-pressed', el.dataset.model === 'dna' ? 'true' : 'false'); });
  molecule?.setModel('dna'); molecule?.reset(); molecule?.setRotating(state.rotating);
  document.querySelector('#rotate-model').innerHTML = icon(state.rotating ? 'pause' : 'play');
  document.querySelector('#rotate-model').setAttribute('aria-label', state.rotating ? '자동 회전 일시정지' : '자동 회전 시작');
  document.querySelector('#model-caption').innerHTML = 'DNA는 유전 정보를 담고 있어요. <span>구조를 단순화한 모형이에요.</span>';
  document.querySelector('#model-zoom').value = 9;
  sample(true); render(); toast('처음의 실험 조건으로 돌아왔어요.');
};
document.querySelectorAll('[data-view]').forEach(el => el.onclick = () => {
  state.view = el.dataset.view;
  document.querySelectorAll('[data-view]').forEach(e => { e.classList.toggle('active', e === el); e.setAttribute('aria-current', e === el ? 'page' : 'false'); });
  document.querySelector('#lab-view').hidden = state.view !== 'pedigree';
  document.querySelector('#cross-view').hidden = state.view !== 'cross';
  document.querySelector('#notes-view').hidden = state.view !== 'notes';
  const title = { pedigree: '가계도 실험실', cross: '교배 시뮬레이션', notes: '유전 개념 노트' }[state.view];
  document.querySelector('#breadcrumb-title').textContent = title;
  document.querySelector('#view-heading').innerHTML = `${title} <span>${{ pedigree: 'Pedigree Lab', cross: 'Cross Simulator', notes: 'Field Notes' }[state.view]}</span>`;
});
const guide = document.querySelector('#guide');
document.querySelector('#guide-button').onclick = () => guide.showModal();
document.querySelector('#close-guide').onclick = document.querySelector('#start-exploring').onclick = () => guide.close();
guide.addEventListener('click', e => { if (e.target === guide) { const r = guide.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) guide.close(); } });
sample(true); render();
try {
  molecule = createMolecule(document.querySelector('#molecule'));
  molecule.setAlleles(state.mother, state.mode);
  state.rotating = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelector('#rotate-model').innerHTML = icon(state.rotating ? 'pause' : 'play');
  document.querySelector('#rotate-model').setAttribute('aria-label', state.rotating ? '자동 회전 일시정지' : '자동 회전 시작');
} catch (e) {
  document.querySelector('.model-fallback').hidden = false;
  document.querySelector('#molecule').hidden = true;
  document.querySelectorAll('.model-controls button, .zoom-control input, [data-model]').forEach(el => el.disabled = true);
}
document.querySelectorAll('[data-model]').forEach(el => el.onclick = () => {
  state.model = el.dataset.model;
  document.querySelectorAll('[data-model]').forEach(e => { e.classList.toggle('active', e === el); e.setAttribute('aria-pressed', e === el ? 'true' : 'false'); });
  molecule?.setModel(state.model);
  document.querySelector('#model-caption').innerHTML = state.model === 'dna' ? 'DNA는 유전 정보를 담고 있어요. <span>구조를 단순화한 모형이에요.</span>' : '선택한 인물의 대립유전자를 비교해요. <span>유전자 위치·크기는 실제와 달라요.</span>';
});
document.querySelector('#rotate-model').onclick = () => { state.rotating = !state.rotating; molecule?.setRotating(state.rotating); document.querySelector('#rotate-model').innerHTML = icon(state.rotating ? 'pause' : 'play'); document.querySelector('#rotate-model').setAttribute('aria-label', state.rotating ? '자동 회전 일시정지' : '자동 회전 시작'); };
document.querySelector('#reset-model').onclick = () => { molecule?.reset(); document.querySelector('#model-zoom').value = 9; };
document.querySelector('#model-zoom').oninput = e => molecule?.zoom(Number(e.target.value));
