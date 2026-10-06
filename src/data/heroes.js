// 4영웅 고유 능력 (싱글모드 전용, 게임당 1회). 밸런스: AI도 동일하게 1회 사용.
// key: 영웅 이름 → { id: 엔진 액션 식별자, name, desc }

export const HERO_ABILITIES = {
  '다이달로스': { id: 'discount', name: '명장의 손길', desc: '카드 영입 시 가호 1개 할인' },
  '아가멤논': { id: 'takeFour', name: '약탈', desc: '가호 가져가기 때 4종류 획득' },
  '파트로클로스': { id: 'masterBonus', name: '전리품', desc: '카드 영입 시 암브로시아 1개 추가 획득' },
  '네스토르': { id: 'refreshRow', name: '지혜', desc: '진열된 카드 1줄 새로고침' },
};

// 영웅 이름 → 능력 id (없으면 null). 멀티플레이어에서는 사용하지 않음.
export function abilityOf(name) {
  return HERO_ABILITIES[name]?.id ?? null;
}

export function abilityInfo(name) {
  return HERO_ABILITIES[name] ?? null;
}
