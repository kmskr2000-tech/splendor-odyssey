// ============================================================================
// 향후 멀티플레이 랭크전용, 현재 미사용 (UNUSED)
// 기존 싱글모드 올림포스 리그 코드를 보존한 것. 멀티 랭크전 구현 시 이 파일을 기준으로 삼을 것.
// UI에서는 참조하지 않음. 날짜 유틸은 src/data/dates.js 로 분리됨.
// ============================================================================

// 올림포스 리그: 신격화(아포테오시스) 서사 티어.
// 최정상에 오르면 '신'이 되는 컨셉. 티어가 오를수록 AI 난이도도 상승.
// 싱글모드 리그전에서만 사용 (멀티플레이어는 바닐라).

export const TIERS = [
  {
    id: 'mortal', name: '필멸자', min: 0, icon: '🧍', color: '#8a6f4d', glow: false, ai: 'easy',
    theme: '인간 모험가들의 영역',
    boss: null, // 시작 티어 — 승급전 없음
    // 4명 중 3명 랜덤 출전
    roster: [
      { name: '이카로스', personality: 'balanced' },
      { name: '오르페우스', personality: 'specialized' },
      { name: '시지프스', personality: 'opportunistic' },
      { name: '다이달로스', personality: 'specialized' },
    ],
  },
  {
    id: 'warrior', name: '전사', min: 300, icon: '⚔️', color: '#b0653a', glow: false, ai: 'easy',
    theme: '전장의 함성이 울리는 곳',
    boss: { name: '미노타우로스', title: '미궁의 괴물', personality: 'opportunistic', banner: '미궁의 괴물이 길을 막는다!' },
    roster: [
      { name: '파트로클로스', personality: 'balanced' },
      { name: '스파르타 전사', personality: 'opportunistic' },
      { name: '아마존 여전사', personality: 'specialized' },
    ],
  },
  {
    id: 'hero', name: '영웅', min: 700, icon: '🛡️', color: '#5b7fc4', glow: false, ai: 'normal',
    theme: '서사시의 주인공들이 모인 곳',
    boss: { name: '메두사', title: '고르곤', personality: 'specialized', banner: '응시를 피하고 고르곤을 꺾어라!' },
    roster: [
      { name: '네스토르', personality: 'balanced' },
      { name: '이아손', personality: 'opportunistic' },
      { name: '테세우스', personality: 'specialized' },
    ],
  },
  {
    id: 'champion', name: '챔피언', min: 1200, icon: '🏅', color: '#8f7bd8', glow: false, ai: 'normal',
    theme: '챔피언들의 전당',
    boss: { name: '히드라', title: '레르나의 괴물', personality: 'balanced', banner: '자를수록 늘어나는 히드라를 베어라!' },
    roster: [
      { name: '헥토르', personality: 'balanced' },
      { name: '아이아스', personality: 'opportunistic' },
      { name: '메넬라오스', personality: 'specialized' },
    ],
  },
  {
    id: 'demigod', name: '반신', min: 1800, icon: '✨', color: '#d4a017', glow: true, ai: 'hard',
    theme: '반신의 영역 — 신의 피가 흐르는 자들',
    boss: { name: '아가멤논', title: '정복왕', personality: 'opportunistic', banner: '정복왕 아가멤논을 꺾고 반신이 되어라!' },
    roster: [
      { name: '벨레로폰', personality: 'specialized' },
      { name: '오리온', personality: 'opportunistic' },
      { name: '카스토르', personality: 'balanced' },
    ],
  },
  {
    id: 'god', name: '신', min: 2500, icon: '🌟', color: '#ffd700', glow: true, ai: 'hard',
    theme: '올림포스 — 신들의 영역',
    boss: { name: '제우스', title: '신들의 왕', personality: 'balanced', banner: '신들의 왕을 넘어서라 — 신에 오를 자여!' },
    roster: [
      { name: '제우스', personality: 'balanced' },
      { name: '아테나', personality: 'specialized' },
      { name: '아레스', personality: 'opportunistic' },
    ],
  },
];

export const MAX_TIER = TIERS[TIERS.length - 1];

// ---------- 난이도 2축: 티어 기반 × 플레이어 선택 ----------
// 유효 난이도 = clamp(티어 베이스 + 플레이어 보정, 0, 3)
// 티어 베이스: easy=0 / normal=1 / hard=2
// 플레이어 보정: easy=-1 / normal=0 / hard=+1 / veryhard=+2
export const DIFF_ORDER = ['easy', 'normal', 'hard', 'veryhard'];
export const DIFF_LABEL = { easy: '쉬움', normal: '보통', hard: '어려움', veryhard: '매우어려움' };
const TIER_BASE = { easy: 0, normal: 1, hard: 2 };
const PLAYER_ADJ = { easy: -1, normal: 0, hard: 1, veryhard: 2 };

export function effectiveDifficulty(tierAi, playerDiff) {
  const base = TIER_BASE[tierAi] ?? 1;
  const adj = PLAYER_ADJ[playerDiff] ?? 0;
  const idx = Math.max(0, Math.min(3, base + adj));
  return DIFF_ORDER[idx];
}

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
export function tierProgressText(points, tierId = null) {
  const tier = tierId ? tierById(tierId) : tierFor(points);
  const idx = TIERS.indexOf(tier);
  const next = idx + 1 < TIERS.length ? TIERS[idx + 1] : null;
  const toGo = next ? next.min - points : 0;
  if (!next) return `${tier.icon} ${tier.name}에 올랐어요 👑`;
  if (toGo <= 0) return `${tier.icon} ${tier.name} — 👹 승급전 도전 가능!`;
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
