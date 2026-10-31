import test from 'node:test';
import assert from 'node:assert/strict';
import { foods, stages, nutrients, nutrientState, questions, stageQuestions } from '../src/digestion.js';

test('food profiles cover mixed meals and representative major nutrients', () => {
  assert.equal(foods.length, 6);
  for (const food of foods) {
    assert.equal(food.profile.length, 3);
    assert.ok(food.profile.every(n => Number.isInteger(n) && n >= 0 && n <= 3));
    assert.equal(food.profile[Object.keys(nutrients).indexOf(food.main)], 3);
  }
  assert.equal(foods.find(f => f.id === 'potato').profile[0], 3);
  assert.equal(foods.find(f => f.id === 'egg').profile[0], 0);
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
test('learning questions have one valid answer and explanatory feedback', () => {
  assert.equal(questions.length, 3);
  for (const q of questions) {
    assert.ok(q.answer >= 0 && q.answer < q.choices.length);
    assert.ok(q.explanation.length > 30);
  }
});

test('food replacement adds clear low-fat protein and starch-focused comparisons', () => {
  assert.deepEqual(foods.find(f => f.id === 'potato').profile, [3, 0, 0]);
  assert.deepEqual(foods.find(f => f.id === 'shrimp').profile, [0, 3, 0]);
  assert.ok(!foods.some(f => ['rice', 'chicken'].includes(f.id)));
  assert.equal(new Set(foods.map(f => f.profile.join(','))).size, 6);
});
test('every digestive stop has a prediction, a valid answer and useful feedback', () => {
  assert.equal(stageQuestions.length, stages.length);
  for (const q of stageQuestions) {
    assert.equal(q.choices.length, 3);
    assert.equal(new Set(q.choices).size, 3);
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 3);
    assert.ok(q.hint.length > 10);
    assert.ok(q.explanation.length > 30);
  }
  assert.equal(stageQuestions[0].choices[stageQuestions[0].answer], '아밀레이스');
  assert.equal(stageQuestions[3].choices[stageQuestions[3].answer], '쓸개즙');
  assert.equal(stageQuestions[4].choices[stageQuestions[4].answer], '모세혈관');
});
