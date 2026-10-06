// 영웅/보스/AI 고유 능력 (싱글모드 전용, 게임당 1회). 밸런스: AI도 동일하게 1회 사용.
// key: 캐릭터 이름 → { id: 엔진 액션 식별자, name, desc, boss? }
// - 플레이어블 4영웅: 오디세우스·헤라클레스·아킬레우스·페르세우스
// - 승급전 보스 5명 (boss: true): 미노타우로스·메두사·히드라·아가멤논·제우스
// - 리그 티어 로스터 AI들도 각자 능력을 가짐 (게임당 1회, 효과는 플레이어와 동일)
// - 구 플레이어블(다이달로스·파트로클로스·네스토르)은 리그 상대로 재사용 (기존 능력 유지)

export const HERO_ABILITIES = {
  // --- 플레이어블 4영웅 ---
  '오디세우스': { id: 'refreshRow', name: '기책', desc: '진열된 카드 1줄 새로고침' },
  '헤라클레스': { id: 'takeFour', name: '괴력', desc: '가호 가져가기 때 4종류 획득' },
  '아킬레우스': { id: 'masterBonus', name: '전리품', desc: '카드 영입 시 암브로시아 1개 추가 획득' },
  '페르세우스': { id: 'discount', name: '여신의 가호', desc: '카드 영입 시 가호 1개 할인' },
  // --- 승급전 보스 ---
  '미노타우로스': { id: 'takeFour', name: '폭식', desc: '가호 4종류를 집어삼킴', boss: true },
  '메두사': { id: 'refreshRow', name: '석화의 응시', desc: '진열된 카드 1줄 새로고침', boss: true },
  '히드라': { id: 'masterBonus', name: '재생', desc: '카드 영입 시 암브로시아 1개 추가 획득', boss: true },
  '아가멤논': { id: 'discount', name: '왕의 특권', desc: '카드 영입 시 가호 1개 할인', boss: true },
  '제우스': { id: 'takeFour', name: '번개심판', desc: '가호 가져가기 때 4종류 획득', boss: true },
  // --- 리그 로스터: 필멸자 ---
  '이카로스': { id: 'refreshRow', name: '이카로스의 비상', desc: '진열된 카드 1줄 새로고침' },
  '오르페우스': { id: 'discount', name: '리라의 선율', desc: '카드 영입 시 가호 1개 할인' },
  '시지프스': { id: 'takeFour', name: '끝없는 노동', desc: '가호 가져가기 때 4종류 획득' },
  '다이달로스': { id: 'discount', name: '명장의 손길', desc: '카드 영입 시 가호 1개 할인' },
  // --- 리그 로스터: 전사 ---
  '파트로클로스': { id: 'masterBonus', name: '전리품', desc: '카드 영입 시 암브로시아 1개 추가 획득' },
  '스파르타 전사': { id: 'takeFour', name: '군단의 위용', desc: '가호 가져가기 때 4종류 획득' },
  '아마존 여전사': { id: 'discount', name: '사냥꾼의 눈', desc: '카드 영입 시 가호 1개 할인' },
  // --- 리그 로스터: 영웅 ---
  '네스토르': { id: 'refreshRow', name: '지혜', desc: '진열된 카드 1줄 새로고침' },
  '이아손': { id: 'masterBonus', name: '황금 양모', desc: '카드 영입 시 암브로시아 1개 추가 획득' },
  '테세우스': { id: 'refreshRow', name: '미궁 탈출', desc: '진열된 카드 1줄 새로고침' },
  // --- 리그 로스터: 챔피언 ---
  '헥토르': { id: 'discount', name: '트로이의 방벽', desc: '카드 영입 시 가호 1개 할인' },
  '아이아스': { id: 'takeFour', name: '거인의 힘', desc: '가호 가져가기 때 4종류 획득' },
  '메넬라오스': { id: 'refreshRow', name: '왕의 결단', desc: '진열된 카드 1줄 새로고침' },
  // --- 리그 로스터: 반신 ---
  '벨레로폰': { id: 'discount', name: '페가수스의 비상', desc: '카드 영입 시 가호 1개 할인' },
  '오리온': { id: 'masterBonus', name: '사냥의 전리품', desc: '카드 영입 시 암브로시아 1개 추가 획득' },
  '카스토르': { id: 'refreshRow', name: '쌍둥이의 지혜', desc: '진열된 카드 1줄 새로고침' },
  // --- 리그 로스터: 신 ---
  '아테나': { id: 'refreshRow', name: '지혜의 눈', desc: '진열된 카드 1줄 새로고침' },
  '아레스': { id: 'masterBonus', name: '전쟁의 전리품', desc: '카드 영입 시 암브로시아 1개 추가 획득' },
  // 제우스는 보스 겸 신 티어 로스터 (같은 캐릭터, 같은 능력)
};

// 캐릭터 이름 → 능력 id (없으면 null). 멀티플레이어에서는 사용하지 않음.
export function abilityOf(name) {
  return HERO_ABILITIES[name]?.id ?? null;
}

export function abilityInfo(name) {
  return HERO_ABILITIES[name] ?? null;
}

// 승급전 보스 여부
export function isBoss(name) {
  return !!HERO_ABILITIES[name]?.boss;
}

// 플레이어블 4영웅 (인기 많은 신화 인물)
export const PLAYABLE_HEROES = ['오디세우스', '헤라클레스', '아킬레우스', '페르세우스'];

// 일반전 상대 풀: 전체 27 캐릭터 (플레이어블 4 + 보스 5 + 로스터 18)
export const ALL_OPPONENTS = Object.keys(HERO_ABILITIES);

// 캐릭터별 고정 성격 (일반전에서도 사용)
export const CHARACTER_PERSONALITY = {
  // 플레이어블 4
  '오디세우스': 'balanced', '헤라클레스': 'opportunistic',
  '아킬레우스': 'specialized', '페르세우스': 'balanced',
  // 보스 5
  '미노타우로스': 'opportunistic', '메두사': 'specialized', '히드라': 'balanced',
  '아가멤논': 'opportunistic', '제우스': 'balanced',
  // 로스터 18 (리그 티어 순서)
  '이카로스': 'balanced', '오르페우스': 'specialized', '시지프스': 'opportunistic', '다이달로스': 'specialized',
  '파트로클로스': 'balanced', '스파르타 전사': 'opportunistic', '아마존 여전사': 'specialized',
  '네스토르': 'balanced', '이아손': 'opportunistic', '테세우스': 'specialized',
  '헥토르': 'balanced', '아이아스': 'opportunistic', '메넬라오스': 'specialized',
  '벨레로폰': 'specialized', '오리온': 'opportunistic', '카스토르': 'balanced',
  '아테나': 'specialized', '아레스': 'opportunistic',
};

export function personalityOf(name) {
  return CHARACTER_PERSONALITY[name] ?? 'balanced';
}

// 능력 id 4종 (일반전 "나"의 랜덤 능력용)
export const ABILITY_IDS = ['refreshRow', 'takeFour', 'masterBonus', 'discount'];
