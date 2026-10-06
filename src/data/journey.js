// 신의 여정 스토리 모드 데이터.
// 오디세우스 편만 플레이 가능, 나머지 3영웅은 추후 업데이트 예정.

// 여정 영웅 목록
export const JOURNEY_HEROES = [
  { id: 'odysseus', name: '오디세우스', title: '귀향의 영웅', face: 'hero-odysseus', available: true },
  { id: 'heracles', name: '헤라클레스', title: '괴력의 영웅', face: 'hero-heracles', available: false },
  { id: 'achilles', name: '아킬레우스', title: '불사신의 전사', face: 'hero-achilles', available: false },
  { id: 'perseus', name: '페르세우스', title: '괴물 사냥꾼', face: 'hero-perseus', available: false },
];

export function journeyHeroByName(name) {
  return JOURNEY_HEROES.find((h) => h.name === name) ?? null;
}

// 오디세우스: "귀향의 여정" (6 스테이지)
// opponents: [이름 ×3], boss: { name, title, ability(id), banner } | null
// aiDifficulty: 해당 스테이지 AI 강도
export const ODYSSEUS_STAGES = [
  {
    n: 1,
    name: '트로이 함락',
    story: [
      '10년 전쟁이 끝났다.',
      '이제 집으로... 이타카로 돌아가야 한다.',
    ],
    opponents: ['트로이 병사', '트로이 궁수', '트로이 창병'],
    boss: null,
    aiDifficulty: 'easy',
  },
  {
    n: 2,
    name: '키르케의 섬',
    story: [
      '마녀 키르케가 동료들을 짐승으로 바꿨다!',
      '약초의 힘으로 마법을 풀고 섬을 탈출하라.',
    ],
    opponents: ['키르케', '길들여진 멧돼지', '길들여진 사자'],
    boss: { name: '키르케', title: '아이아이아의 마녀', ability: 'refreshRow', abilityName: '마법', banner: '마녀 키르케가 마법을 부린다!' },
    aiDifficulty: 'easy',
  },
  {
    n: 3,
    name: '세이렌의 바다',
    story: [
      '달콤한 노래가 선원들을 유혹한다.',
      '귀를 막고 노를 저어라!',
    ],
    opponents: ['파르테노페', '레이코시아', '류코시아'],
    boss: null,
    aiDifficulty: 'normal',
  },
  {
    n: 4,
    name: '스킬라와 카리브디스',
    story: [
      '여섯 머리의 괴물과 집어삼키는 소용돌이!',
      '둘 중 하나는 반드시 지나야 한다.',
    ],
    opponents: ['스킬라', '심해 괴물', '파도 정령'],
    boss: { name: '스킬라', title: '여섯 머리의 괴물', ability: 'takeFour', abilityName: '포식', banner: '스킬라가 여섯 머리로 달려든다!' },
    aiDifficulty: 'normal',
  },
  {
    n: 5,
    name: '오기기아',
    story: [
      '님프 칼립소의 유혹을 뿌리치고',
      '다시 바다로 나서야 한다!',
    ],
    opponents: ['칼립소', '바다 님프', '섬 님프'],
    boss: null,
    aiDifficulty: 'hard',
  },
  {
    n: 6,
    name: '귀향',
    story: [
      '분노한 바다의 신이',
      '마지막 시련으로 가로막는다!',
    ],
    opponents: ['포세이돈', '심해 괴물', '파도 정령'],
    boss: { name: '포세이돈', title: '바다의 신', ability: 'takeFour', abilityName: '해일', banner: '포세이돈의 해일이 몰려온다!' },
    aiDifficulty: 'veryhard',
  },
];

export const JOURNEY_STAGES = {
  '오디세우스': ODYSSEUS_STAGES,
};

export function journeyStagesOf(heroName) {
  return JOURNEY_STAGES[heroName] ?? [];
}

export function journeyStageOf(heroName, n) {
  return journeyStagesOf(heroName).find((s) => s.n === n) ?? null;
}

// 스테이지 상대 성격 (고정)
const STAGE_PERSONALITY = {
  '트로이 병사': 'balanced', '트로이 궁수': 'specialized', '트로이 창병': 'opportunistic',
  '키르케': 'specialized', '길들여진 멧돼지': 'opportunistic', '길들여진 사자': 'balanced',
  '파르테노페': 'balanced', '레이코시아': 'specialized', '류코시아': 'opportunistic',
  '스킬라': 'opportunistic', '심해 괴물': 'balanced', '파도 정령': 'specialized',
  '칼립소': 'specialized', '바다 님프': 'balanced', '섬 님프': 'opportunistic',
  '포세이돈': 'balanced',
};

export function journeyPersonalityOf(name) {
  return STAGE_PERSONALITY[name] ?? 'balanced';
}

// 엔딩 문구
export const JOURNEY_ENDING = {
  '오디세우스': {
    title: '신에 오르셨습니다!',
    lines: [
      '마침내 이타카의 땅을 밟았다.',
      '파도를 넘고, 마녀를 이기고, 신의 분노를 견뎌낸 자.',
      '오디세우스의 이름은 이제 신화 그 자체가 되었다.',
    ],
    teaser: '헤라클레스 · 아킬레우스 · 페르세우스의 여정은 추후 업데이트 예정!',
  },
};
