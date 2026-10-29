export const scenarios = {
  recessive: {
    title: '상염색체 열성 유전', short: '열성 유전', example: '백색증의 일부 유형',
    description: '열성 대립유전자 a가 두 개 모일 때 형질이 나타나요.',
    tag: '두 개가 만나야 나타나요', alleles: ['A', 'a'],
    father: ['AA', 'Aa', 'aa'], mother: ['AA', 'Aa', 'aa'], defaults: ['Aa', 'Aa'],
    assumption: '일부 백색증 유형을 단순화한 모형이에요. 완전 침투도·단일 유전자·무작위 수정을 가정하며, 새 돌연변이는 고려하지 않아요.',
  },
  dominant: {
    title: '상염색체 우성 유전', short: '우성 유전', example: '우성 유전의 일반 모형',
    description: '우성 대립유전자 A가 하나만 있어도 형질이 나타나요.',
    tag: '하나만 있어도 나타나요', alleles: ['A', 'a'],
    father: ['AA', 'Aa', 'aa'], mother: ['AA', 'Aa', 'aa'], defaults: ['Aa', 'aa'],
    assumption: '특정 질환의 진단이 아닌 가상의 우성 형질 모형이에요. 완전 우성·완전 침투도·단일 유전자·무작위 수정을 가정해요.',
  },
  xlinked: {
    title: 'X 염색체 연관 열성 유전', short: 'X 연관 열성', example: '혈우병 A의 유전 모형',
    description: 'X 염색체의 열성 대립유전자가 성별에 따라 다르게 발현돼요.',
    tag: 'X 염색체를 따라가요', alleles: ['Xᴴ', 'Xʰ'],
    father: ['XᴴY', 'XʰY'], mother: ['XᴴXᴴ', 'XᴴXʰ', 'XʰXʰ'], defaults: ['XᴴY', 'XᴴXʰ'],
    assumption: '혈우병 A를 단순화한 모형이에요. XX/XY, 완전 침투도, 남녀 출생 확률 각 50%를 가정해요. X 불활성화·새 돌연변이 등 실제의 다양성은 생략했어요.',
  },
};

export function gametes(genotype, mode) {
  if (mode !== 'xlinked') return [...genotype];
  return genotype.match(/X[ᴴʰ]|Y/g);
}

export function combine(paternal, maternal, mode) {
  if (mode === 'xlinked') return paternal === 'Y' ? maternal + 'Y' : [paternal, maternal].sort((a, b) => (a === 'Xᴴ' ? 0 : 1) - (b === 'Xᴴ' ? 0 : 1)).join('');
  return [paternal, maternal].sort().join('');
}

export function phenotype(genotype, mode) {
  if (mode === 'dominant') return genotype.includes('A') ? 'affected' : 'clear';
  if (mode === 'xlinked') {
    if (genotype === 'XʰY' || genotype === 'XʰXʰ') return 'affected';
    return genotype.includes('ʰ') ? 'carrier' : 'clear';
  }
  return genotype === 'aa' ? 'affected' : genotype === 'Aa' ? 'carrier' : 'clear';
}

export const statusLabels = { clear: '미발현', carrier: '보인자', affected: '형질 발현' };

export function cross(father, mother, mode) {
  return gametes(father, mode).flatMap(p => gametes(mother, mode).map(m => {
    const genotype = combine(p, m, mode);
    return { paternal: p, maternal: m, genotype, status: phenotype(genotype, mode), sex: mode === 'xlinked' ? (genotype.includes('Y') ? 'male' : 'female') : null, probability: 0.25 };
  }));
}

export function probabilities(outcomes) {
  return outcomes.reduce((p, o) => { p[o.status] += o.probability; return p; }, { affected: 0, carrier: 0, clear: 0 });
}

export function makeChildren(outcomes, count, random = Math.random) {
  return Array.from({ length: count }, (_, i) => {
    const o = outcomes[Math.min(outcomes.length - 1, Math.floor(random() * outcomes.length))];
    return { ...o, sex: o.sex || (random() < 0.5 ? 'male' : 'female'), id: `II-${i + 1}` };
  });
}
