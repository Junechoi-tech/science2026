import test from 'node:test';
import assert from 'node:assert/strict';
import { cross, probabilities, makeChildren, scenarios, phenotype } from '../src/genetics.js';

test('Aa × Aa yields 1/4 expression and 1/2 carriers for recessive inheritance', () => {
  const o = cross('Aa', 'Aa', 'recessive');
  assert.deepEqual(o.map(x => x.genotype), ['AA', 'Aa', 'Aa', 'aa']);
  assert.deepEqual(probabilities(o), { affected: .25, carrier: .5, clear: .25 });
});
test('dominant expression has no unaffected carriers', () => {
  assert.deepEqual(probabilities(cross('Aa', 'aa', 'dominant')), { affected: .5, carrier: 0, clear: .5 });
  assert.equal(probabilities(cross('AA', 'aa', 'dominant')).affected, 1);
});
test('X-linked crosses distinguish daughters and sons and do not transfer paternal X to sons', () => {
  const o = cross('XᴴY', 'XᴴXʰ', 'xlinked');
  assert.deepEqual(probabilities(o), { affected: .25, carrier: .25, clear: .5 });
  assert.equal(o.filter(x => x.sex === 'male' && x.status === 'affected').length, 1);
  const affectedFather = cross('XʰY', 'XᴴXᴴ', 'xlinked');
  assert.ok(affectedFather.filter(x => x.sex === 'male').every(x => x.genotype === 'XᴴY'));
  assert.ok(affectedFather.filter(x => x.sex === 'female').every(x => x.status === 'carrier'));
  assert.ok(affectedFather.filter(x => x.sex === 'female').every(x => x.genotype === 'XᴴXʰ'));
});
test('every allowed parental combination has valid genotypes and probability totals', () => {
  for (const [mode, s] of Object.entries(scenarios)) for (const f of s.father) for (const m of s.mother) {
    const o = cross(f, m, mode);
    assert.equal(o.length, 4);
    assert.equal(Object.values(probabilities(o)).reduce((a, b) => a + b), 1);
    const valid = mode === 'xlinked' ? [...s.father, ...s.mother] : ['AA', 'Aa', 'aa'];
    assert.ok(o.every(x => valid.includes(x.genotype)));
  }
});
test('each child is a possible independent outcome; small samples need not match probabilities', () => {
  const o = cross('Aa', 'Aa', 'recessive');
  assert.ok(makeChildren(o, 4, () => .99).every(x => x.genotype === 'aa'));
  assert.equal(makeChildren(o, 2, () => 0).length, 2);
});
