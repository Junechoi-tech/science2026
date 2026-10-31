import { foods, foodQuestions, stages, isCorrectAnswer } from './digestion.js';

export function hasResponse(question, value) {
  return question.type === 'choice'
    ? Number.isInteger(value) && value >= 0 && value < question.choices.length
    : typeof value === 'string' && value.trim().length > 0 && value.length <= 80;
}
export function foodProgress(foodId, responses) {
  return foodQuestions[foodId].filter((q, i) => hasResponse(q, responses[`${foodId}:${i}`])).length;
}
export function totalProgress(responses) {
  return foods.reduce((sum, food) => sum + foodProgress(food.id, responses), 0);
}
export function canMoveForward(foodId, step, responses) {
  return Object.hasOwn(foodQuestions,foodId) && Number.isInteger(step) && step >= 0 && step < 6 &&
    hasResponse(foodQuestions[foodId][step], responses[`${foodId}:${step}`]);
}
export function expectedAnswer(q) {
  if (q.type === 'choice') return `${q.answer + 1}. ${q.choices[q.answer]}`;
  return Array.isArray(q.accepted[0]) ? q.accepted.map(group => group[0]).join(' + ') : q.accepted[0];
}
export function displayAnswer(q, answer) {
  if (!hasResponse(q, answer)) return '미응답';
  return q.type === 'choice' ? `${answer + 1}. ${q.choices[answer]}` : answer;
}
export function makeSubmission(responses, student, at = new Date().toISOString()) {
  if (totalProgress(responses) !== 28) throw new Error('28문항에 모두 응답해 주세요.');
  if (!['classroom', 'number', 'name'].every(k => String(student[k] || '').trim())) throw new Error('학년·반, 번호, 이름을 입력해 주세요.');
  const rows = foods.flatMap((food, foodIndex) => foodQuestions[food.id].map((q, step) => ({
    number: foodIndex * 7 + step + 1, foodId: food.id, food: food.name, stage: stages[step].name,
    question: q.text, type: q.type, answer: displayAnswer(q, responses[`${food.id}:${step}`]),
    expected: expectedAnswer(q), correct: isCorrectAnswer(q, responses[`${food.id}:${step}`]), explanation: q.explanation,
  })));
  // Snapshot is detached from editable draft state.
  return { version: 4, at, student: Object.fromEntries(['school', 'classroom', 'number', 'name'].map(k => [k, String(student[k] || '').trim().slice(0, 40)])), rows, correct: rows.filter(r => r.correct).length, total: 28 };
}
export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
