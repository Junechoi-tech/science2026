import test from 'node:test';
import assert from 'node:assert/strict';
import { foods, stages, nutrients, nutrientState, foodQuestions, isCorrectAnswer, normalizeAnswer } from '../src/digestion.js';

test('food profiles cover mixed meals and representative major nutrients', () => {
  assert.equal(foods.length, 4);
  for (const food of foods) {
    assert.equal(food.profile.length, 3);
    assert.ok(food.profile.every(n => Number.isInteger(n) && n >= 0 && n <= 3));
    assert.equal(food.profile[Object.keys(nutrients).indexOf(food.main)], 3);
  }
  assert.equal(foods.find(f => f.id === 'potato').profile[0], 3);
  assert.equal(foods.find(f => f.id === 'shrimp').profile[0], 0);
  assert.ok(foods.find(f => f.id === 'pork').profile[1] > 0);
});
test('starch partially digests in mouth but protein and fat await their organs', () => {
  assert.equal(nutrientState('starch', 0).label, '녹말 + 엿당');
  assert.equal(nutrientState('starch', 2).action, '분해 대기');
  assert.equal(nutrientState('protein', 0).form, 'large');
  assert.equal(nutrientState('protein', 2).label, '작은 단백질 조각');
  assert.equal(nutrientState('fat', 2).form, 'large');
});
test('small intestine produces textbook final products before absorption', () => {
  for (const [key, expected] of [['starch', '포도당'], ['protein', '아미노산'], ['fat', '지방산 + 모노글리세리드']]) {
    assert.equal(nutrientState(key, 3).label, expected);
    assert.equal(nutrientState(key, 3).form, 'small');
    assert.equal(nutrientState(key, 4).form, 'absorbed');
    assert.equal(nutrientState(key, 6).form, 'absorbed');
  }
  assert.match(nutrientState('fat', 4).description, /재합성 → 암죽관 → 림프 → 혈액/);
  assert.match(nutrientState('starch', 4).description, /모세혈관/);
  assert.match(nutrientState('protein', 4).description, /모세혈관/);
});
test('digestive journey includes transit, absorption, water recovery and egestion', () => {
  assert.deepEqual(stages.map(s => s.name), ['입', '식도', '위', '작은창자 · 소화', '작은창자 · 흡수', '큰창자', '항문']);
  assert.match(stages[3].tip, /소화효소 없이/);
  assert.match(stages[5].detail, /물/);
  assert.match(stages[6].detail, /대변/);
  assert.throws(() => nutrientState('sugar', 0), RangeError);
  assert.throws(() => nutrientState('fat', 7), RangeError);
});
test('food replacement adds clear low-fat protein and starch-focused comparisons', () => {
  assert.deepEqual(foods.find(f => f.id === 'potato').profile, [3, 0, 0]);
  assert.deepEqual(foods.find(f => f.id === 'shrimp').profile, [0, 3, 0]);
  assert.ok(!foods.some(f => ['rice', 'chicken', 'bread', 'egg'].includes(f.id)));
  assert.equal(new Set(foods.map(f => f.profile.join(','))).size, 4);
});
test('four requested profiles are preserved, including the fat-only almond teaching model', () => {
  assert.deepEqual(foods.map(f=>[f.id,f.profile]), [
    ['potato',[3,0,0]], ['shrimp',[0,3,0]], ['pork',[0,2,3]], ['almond',[0,0,3]],
  ]);
  assert.match(foods.find(f=>f.id==='almond').note,/실제 아몬드에는 단백질/);
});
test('each food has seven distinct activities with both question types', () => {
  const texts=[];
  assert.deepEqual(Object.keys(foodQuestions), foods.map(f=>f.id));
  for(const food of foods){
    const qs=foodQuestions[food.id];
    assert.equal(qs.length,stages.length);
    assert.ok(qs.filter(q=>q.type==='short').length>=2);
    assert.ok(qs.some(q=>q.type==='choice'));
    for(const q of qs){
      texts.push(q.text);
      assert.ok(q.hint.length>10);
      assert.ok(q.explanation.length>30);
      if(q.type==='choice'){
        assert.equal(q.choices.length,3);
        assert.ok(q.answer>=0 && q.answer<3);
        assert.equal(isCorrectAnswer(q,q.answer),true);
        assert.equal(isCorrectAnswer(q,(q.answer+1)%3),false);
      }else{
        assert.ok(q.accepted.length>0);
        const answer=Array.isArray(q.accepted[0])?q.accepted.map(group=>group[0]).join('과 '):q.accepted[0];
        assert.equal(isCorrectAnswer(q,answer),true,q.text);
        assert.equal(isCorrectAnswer(q,''),false);
        assert.equal(isCorrectAnswer(q,'아무 답'),false);
      }
    }
  }
  assert.equal(new Set(texts).size,28);
});
test('short answers tolerate spacing, aliases and two-product order without accepting partial or negated answers',()=>{
  assert.equal(normalizeAnswer(' 포 도 당. '),'포도당');
  assert.equal(isCorrectAnswer(foodQuestions.potato[1],'꿈틀운동'),true);
  assert.equal(isCorrectAnswer(foodQuestions.potato[3],' 포 도 당 '),true);
  assert.equal(isCorrectAnswer(foodQuestions.potato[3],'포도당이 아님'),false);
  assert.equal(isCorrectAnswer(foodQuestions.shrimp[3],'아미노 산'),true);
  assert.equal(isCorrectAnswer(foodQuestions.pork[3],'리파아제'),true);
  const q=foodQuestions.almond[3];
  assert.equal(isCorrectAnswer(q,'모노글리세리드, 지방산'),true);
  assert.equal(isCorrectAnswer(q,'지방산 + 모노글리세리드'),true);
  assert.equal(isCorrectAnswer(q,'지방산 및 모노글리세라이드'),true);
  assert.equal(isCorrectAnswer(q,'지방산'),false);
  assert.equal(isCorrectAnswer(q,'지방산과 글리세롤'),false);
  assert.equal(isCorrectAnswer(q,'지방산과 모노글리세리드가 아님'),false);
});
