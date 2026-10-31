// Relative teaching profiles, not measured composition or dietary advice.
export const nutrients = {
  starch: { name: '녹말', color: '#dc9b31', final: '포도당', route: '융털의 모세혈관 → 혈액 → 온몸의 세포' },
  protein: { name: '단백질', color: '#dc7d83', final: '아미노산', route: '융털의 모세혈관 → 혈액 → 온몸의 세포' },
  fat: { name: '지방', color: '#70a48d', final: '지방산 + 모노글리세리드', route: '융털의 상피세포에서 지방으로 재합성 → 암죽관 → 림프 → 혈액' },
};
export const foods = [
  { id: 'potato', name: '찐감자', emoji: '🥔', subtitle: '녹말의 경로에 집중', profile: [3, 0, 0], main: 'starch', note: '기름 없이 찐 감자예요. 녹말이 풍부하며 단백질과 지방은 이 모형에서 거의 없는 것으로 단순화했어요. 식빵과 비교해 보세요.' },
  { id: 'bread', name: '식빵', emoji: '🍞', subtitle: '폭신한 한 조각', profile: [3, 1, 1], main: 'starch', note: '밀가루의 녹말뿐 아니라 단백질과 지방도 함께 들어 있어요. 세 가지 경로를 비교해 보세요.' },
  { id: 'egg', name: '삶은 달걀', emoji: '🥚', subtitle: '흰자와 노른자', profile: [0, 3, 2], main: 'protein', note: '흰자는 단백질이 풍부하고, 노른자에는 지방도 들어 있어요. 녹말은 거의 없어요.' },
  { id: 'shrimp', name: '삶은 새우', emoji: '🦐', subtitle: '지방은 적고 단백질은 풍부', profile: [0, 3, 0], main: 'protein', note: '기름 없이 삶은 새우예요. 지방이 적어 단백질의 경로에 집중할 수 있어요. 지방도 많은 삼겹살과 비교해 보세요.' },
  { id: 'pork', name: '삼겹살', emoji: '🥓', subtitle: '지방과 단백질을 함께', profile: [0, 2, 3], main: 'fat', note: '지방과 단백질이 함께 들어 있어요. 쓸개즙은 어디서 만들어지고, 어디서 작용할까요?' },
  { id: 'almond', name: '아몬드', emoji: '🥜', subtitle: '작지만 알찬 한 줌', profile: [1, 2, 3], main: 'fat', note: '아몬드는 지방이 풍부하고 단백질과 소량의 녹말도 들어 있어요. 식이섬유의 소화는 이 모형에서 생략했어요.' },
];
export const stages = [
  { name: '입', short: '입', title: '꼭꼭 씹으며, 소화의 시작', verb: '잘게 부수고 침과 섞어요', detail: '이는 음식물을 잘게 부수어 소화액에 닿는 표면적을 넓혀요. 침 속 아밀레이스는 녹말의 일부를 엿당으로 분해해요.', enzyme: '침 · 아밀레이스', tip: '씹는 것은 물리적 소화, 효소로 분해하는 것은 화학적 소화예요.' },
  { name: '식도', short: '식도', title: '꿀꺽! 위를 향해 이동해요', verb: '연동 운동으로 이동해요', detail: '식도 벽의 근육이 차례로 수축하고 이완하면서 음식물을 위로 보내요. 식도에서 새로운 소화효소가 분비되지는 않아요.', enzyme: '연동 운동 · 이동', tip: '음식물은 중력만으로 내려가는 것이 아니에요. 식도의 근육 운동이 밀어 보내요.' },
  { name: '위', short: '위', title: '위액과 섞이며 단백질 분해', verb: '주무르고 위액과 섞어요', detail: '위는 음식물을 잠시 저장하고 주물러 위액과 섞어요. 위액의 펩신이 단백질을 더 작은 조각으로 분해해요. 염산은 펩신의 작용을 돕고 세균을 제거해요.', enzyme: '위액 · 펩신', tip: '위에서 단백질 소화가 시작되지만, 아미노산으로의 최종 분해는 작은창자에서 완성돼요.' },
  { name: '작은창자 · 소화', short: '작은창자', title: '세 영양소의 소화가 완성돼요', verb: '흡수할 수 있을 만큼 작게', detail: '이자액의 아밀레이스·트립신·라이페이스와 작은창자의 여러 소화효소가 작용해요. 녹말은 포도당, 단백질은 아미노산, 지방은 지방산과 모노글리세리드로 분해돼요.', enzyme: '이자액 · 장액 · 쓸개즙', tip: '간에서 만든 쓸개즙은 쓸개에 저장되었다가 작은창자로 나와요. 소화효소 없이 지방을 작은 방울로 흩어지게 해요.' },
  { name: '작은창자 · 흡수', short: '융털', title: '융털에서 몸속으로 쏙!', verb: '영양소가 몸속으로 흡수돼요', detail: '작은창자 안쪽의 주름과 융털은 표면적을 넓혀요. 포도당과 아미노산은 모세혈관으로 흡수돼요. 지방의 소화 산물은 상피세포에서 지방으로 다시 합성되어 암죽관으로 이동해요.', enzyme: '융털 · 모세혈관 · 암죽관', tip: '흡수된 영양소는 결국 혈액을 통해 온몸의 세포로 운반돼요. 음식물 덩어리가 그대로 혈액으로 들어가는 것은 아니에요.' },
  { name: '큰창자', short: '큰창자', title: '남은 물을 흡수해요', verb: '주로 물을 흡수해요', detail: '영양소와 물의 많은 부분은 이미 작은창자에서 흡수되었어요. 큰창자는 남은 물질에서 주로 물을 흡수하고 대변을 형성해요.', enzyme: '물 흡수 · 대변 형성', tip: '큰창자에서는 세 영양소의 소화가 거의 일어나지 않아요. 영양소의 주된 흡수 장소는 작은창자예요.' },
  { name: '항문', short: '항문', title: '한입의 여행, 끝!', verb: '소화되지 않은 찌꺼기 배출', detail: '소화·흡수되지 않고 남은 물질이 대변으로 몸 밖으로 나와요. 흡수된 영양소는 세포로 운반되어 에너지를 얻거나 몸을 구성하는 데 쓰여요.', enzyme: '찌꺼기 배출', tip: '대변 배출은 소화되지 않은 찌꺼기를 내보내는 과정이에요. 세포에서 생긴 노폐물을 내보내는 배설과 구별해요.' },
];
export function nutrientState(key, step) {
  if (!Object.hasOwn(nutrients, key) || !Number.isInteger(step) || step < 0 || step >= stages.length) throw new RangeError('올바른 영양소와 단계를 선택하세요.');
  if (step >= 4) return { label: nutrients[key].final, action: '흡수 완료', form: 'absorbed', description: nutrients[key].route };
  if (step === 3) return { label: nutrients[key].final, action: '최종 분해', form: 'small', description: key === 'starch' ? '아밀레이스와 엿당 분해 효소 등이 작용해요.' : key === 'protein' ? '트립신과 여러 단백질 소화효소가 작용해요.' : '쓸개즙이 유화하고 라이페이스가 분해해요.' };
  if (key === 'starch') return { label: '녹말 + 엿당', action: step === 0 ? '분해 시작' : step === 1 ? '이동 중' : '분해 대기', form: 'medium', description: step === 2 ? '위의 산성 환경에서 침 아밀레이스의 작용이 억제돼요.' : '침의 아밀레이스가 녹말의 일부를 엿당으로 분해해요.' };
  if (key === 'protein' && step === 2) return { label: '작은 단백질 조각', action: '분해 시작', form: 'medium', description: '펩신이 단백질을 더 작은 조각으로 분해해요.' };
  return { label: nutrients[key].name, action: step === 1 ? '이동 중' : '분해 대기', form: 'large', description: key === 'fat' ? '이 모형에서는 작은창자에서 본격적인 지방 소화를 관찰해요.' : '침의 아밀레이스는 단백질을 분해하지 못해요.' };
}
export const questions = [
  { text: '식빵을 오래 씹으면 단맛이 나는 까닭은?', choices: ['침의 아밀레이스가 녹말을 엿당으로 분해해서', '위의 펩신이 포도당을 만들어서', '쓸개즙이 녹말을 흩어지게 해서'], answer: 0, explanation: '침의 아밀레이스가 식빵 속 녹말의 일부를 단맛이 나는 엿당으로 분해해요.' },
  { text: '삼겹살 속 지방의 소화를 돕는 쓸개즙에 대한 설명은?', choices: ['쓸개에서 만들고 위에서 작용해요', '간에서 만들고 작은창자에서 지방을 유화해요', '소화효소로 지방을 아미노산으로 분해해요'], answer: 1, explanation: '쓸개즙은 간에서 만들어지고 쓸개에 저장돼요. 효소는 없고, 작은창자에서 지방을 작은 방울로 흩어지게 해요.' },
  { text: '작은창자에서 단백질이 최종 분해된 물질과 주된 흡수 경로는?', choices: ['엿당 → 암죽관', '지방산 → 모세혈관', '아미노산 → 융털의 모세혈관'], answer: 2, explanation: '단백질은 아미노산으로 분해되어 융털의 모세혈관으로 흡수돼요.' },
];

// Predict first, then reveal evidence. One question for every stop in the journey.
export const stageQuestions = [
  { text: '입에서 녹말에 작용하는 소화효소는 무엇일까요?', choices: ['펩신', '아밀레이스', '라이페이스'], answer: 1, hint: '침에 들어 있는 효소를 떠올려 보세요.', explanation: '침의 아밀레이스는 녹말의 일부를 엿당으로 분해해요. 단백질과 지방은 이 효소로 분해되지 않아요.' },
  { text: '식도는 음식물을 어떻게 위로 보낼까요?', choices: ['새 소화효소로 녹여서', '중력만으로 떨어뜨려서', '근육의 연동 운동으로 밀어서'], answer: 2, hint: '식도 벽의 근육이 차례로 움직여요.', explanation: '식도의 근육이 차례로 수축하고 이완하며 음식물을 밀어 보내요. 새로운 소화효소를 분비하는 기관은 아니에요.' },
  { text: '위에서 펩신이 분해하기 시작하는 영양소는?', choices: ['단백질', '녹말', '지방'], answer: 0, hint: '달걀과 새우에 풍부한 영양소예요.', explanation: '위액의 펩신은 단백질을 작은 조각으로 분해해요. 염산은 펩신의 작용을 돕지만 소화효소 자체는 아니에요.' },
  { text: '작은창자에서 지방을 작은 방울로 흩어지게 돕는 것은?', choices: ['펩신', '쓸개즙', '침'], answer: 1, hint: '간에서 만들고 쓸개에 저장하는 액체예요.', explanation: '쓸개즙은 효소 없이 지방을 유화해요. 이어서 라이페이스가 지방을 지방산과 모노글리세리드로 분해해요.' },
  { text: '포도당과 아미노산은 융털의 어디로 흡수될까요?', choices: ['암죽관', '식도', '모세혈관'], answer: 2, hint: '작은 혈관을 떠올려 보세요.', explanation: '포도당과 아미노산은 모세혈관으로 흡수돼요. 지방의 소화 산물은 상피세포에서 지방으로 재합성되어 암죽관으로 이동해요.' },
  { text: '큰창자에서는 주로 무엇을 흡수할까요?', choices: ['물', '큰 단백질 덩어리', '녹말 덩어리'], answer: 0, hint: '남은 찌꺼기에서 이것이 줄어들면 대변이 만들어져요.', explanation: '작은창자에서 영양소와 물의 많은 부분이 흡수된 뒤, 큰창자에서는 남은 물질의 물을 주로 흡수해요.' },
  { text: '항문으로 나오는 대변에 대한 설명으로 알맞은 것은?', choices: ['흡수된 영양소 전체예요', '소화·흡수되지 않은 찌꺼기예요', '세포에서 생긴 노폐물만 모인 것이에요'], answer: 1, hint: '흡수되어 혈액으로 들어간 영양소와 구별해 보세요.', explanation: '대변은 소화·흡수되지 않은 찌꺼기 등이 배출되는 것이에요. 세포의 물질대사로 생긴 노폐물을 내보내는 배설과 구별해요.' },
];
