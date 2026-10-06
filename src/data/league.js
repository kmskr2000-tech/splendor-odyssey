// 올림포스 리그: 신격화(아포테오시스) 서사 티어.
// 최정상에 오르면 '신'이 되는 컨셉. 티어가 오를수록 AI 난이도도 상승.
// 싱글모드 리그전에서만 사용 (멀티플레이어는 바닐라).

export const TIERS = [
  {
    id: 'mortal', name: '필멸자', min: 0, icon: '🧍', color: '#8a6f4d', glow: false, ai: 'easy',
    theme: '인간 모험가들의 영역',
    roster: [
      { name: '이카로스', personality: 'balanced' },
      { name: '오르페우스', personality: 'specialized' },
      { name: '시지프스', personality: 'opportunistic' },
    ],
  },
  {
    id: 'warrior', name: '전사', min: 300, icon: '⚔️', color: '#b0653a', glow: false, ai: 'easy',
    theme: '전장의 함성이 울리는 곳',
    roster: [
      { name: '스파르타 전사', personality: 'opportunistic' },
      { name: '아마존 여전사', personality: 'specialized' },
      { name: '미르미돈 병사', personality: 'balanced' },
    ],
  },
  {
    id: 'hero', name: '영웅', min: 700, icon: '🛡️', color: '#5b7fc4', glow: false, ai: 'normal',
    theme: '서사시의 주인공들이 모인 곳',
    roster: [
      { name: '오디세우스', personality: 'balanced' },
      { name: '테세우스', personality: 'specialized' },
      { name: '이아손', personality: 'opportunistic' },
    ],
  },
  {
    id: 'champion', name: '챔피언', min: 1200, icon: '🏅', color: '#8f7bd8', glow: false, ai: 'normal',
    theme: '챔피언들의 전당',
    roster: [
      { name: '헥토르', personality: 'balanced' },
      { name: '아이아스', personality: 'opportunistic' },
      { name: '디오메데스', personality: 'specialized' },
    ],
  },
  {
    id: 'demigod', name: '반신', min: 1800, icon: '✨', color: '#d4a017', glow: true, ai: 'hard',
    theme: '반신의 영역 — 신의 피가 흐르는 자들',
    roster: [
      { name: '헤라클레스', personality: 'specialized' },
      { name: '페르세우스', personality: 'balanced' },
      { name: '아킬레우스', personality: 'opportunistic' },
    ],
  },
  {
    id: 'god', name: '신', min: 2500, icon: '🌟', color: '#ffd700', glow: true, ai: 'hard',
    theme: '올림포스 — 신들의 영역',
    roster: [
      { name: '제우스', personality: 'balanced' },
      { name: '아테나', personality: 'specialized' },
      { name: '아레스', personality: 'opportunistic' },
    ],
  },
];

export const MAX_TIER = TIERS[TIERS.length - 1];

// points에 해당하는 티어 (가장 높은 min <= points)
export function tierFor(points) {
  let t = TIERS[0];
  for (const tier of TIERS) if (points >= tier.min) t = tier;
  return t;
}

export function tierById(id) {
  return TIERS.find((t) => t.id === id) ?? TIERS[0];
}

// { tier, next, toGo }: 다음 티어까지 남은 점수 (최고 티어면 next=null)
export function tierProgress(points) {
  const tier = tierFor(points);
  const idx = TIERS.indexOf(tier);
  const next = idx + 1 < TIERS.length ? TIERS[idx + 1] : null;
  return { tier, next, toGo: next ? next.min - points : 0 };
}

// "반신에서 신까지 700점 남았어요" / 최고 티어: "신에 올랐어요 👑"
export function tierProgressText(points) {
  const { tier, next, toGo } = tierProgress(points);
  if (!next) return `${tier.icon} ${tier.name}에 올랐어요 👑`;
  return `${tier.icon} ${tier.name}에서 ${next.name}까지 ${toGo}점 남았어요`;
}

// 로컬 타임존 기준 YYYY-MM 시즌 키
export function currentSeason(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// 로컬 타임존 기준 YYYY-MM-DD
export function todayStr(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// dateStr(YYYY-MM-DD)의 n일 후/전
export function shiftDate(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return todayStr(dt);
}

// 해당 주의 월요일 (YYYY-MM-DD)
export function mondayOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dow = (dt.getDay() + 6) % 7; // 월요일=0
  dt.setDate(dt.getDate() - dow);
  return todayStr(dt);
}
