// ============================================================================
// 향후 멀티플레이 랭크전용, 현재 미사용 (UNUSED)
// 기존 싱글모드 올림포스 리그 저장소 코드를 보존한 것.
// UI/게임플로우에서는 참조하지 않음.
// ============================================================================

import { readJSON, writeJSON, isObj, DIFF_MULT } from '../../storage/store.js?v=1791287115';

// ---------- League ----------
// { v:1, season: "YYYY-MM", points, tier: 달성 티어 id, best: { [season]: tierId }, history: [...] }
// 싱글모드 리그전에서만 가산. 멀티플레이어는 바닐라.
// 승급은 승급전(보스전) 승리로만 발생 — 포인트가 임계값을 넘었다고 자동 승급하지 않음.

export const LEAGUE_KEY = 'odo-league-v1';
const RANK_POINTS = [100, 60, 30, 10];

export function leaguePointsFor(rank, difficulty) {
  return Math.round((RANK_POINTS[rank - 1] ?? 10) * (DIFF_MULT[difficulty] ?? 1));
}

// store.js는 league.js를 import하지 않음 (순환 방지) — 티어 판정은 아래 경량 테이블 사용
const LEAGUE_TIER_MINS = [
  ['mortal', 0], ['warrior', 300], ['hero', 700], ['champion', 1200], ['demigod', 1800], ['god', 2500],
];
export const TIER_ORDER = LEAGUE_TIER_MINS.map(([id]) => id);
function tierForPoints(points) {
  let t = 'mortal';
  for (const [id, min] of LEAGUE_TIER_MINS) if (points >= min) t = id;
  return t;
}
function writeLeague(storage, l) {
  writeJSON(storage, LEAGUE_KEY, { v: 1, season: l.season, points: l.points, tier: l.tier, best: l.best, history: l.history });
}

export function loadLeague(storage, season) {
  let o = readJSON(storage, LEAGUE_KEY);
  if (!isObj(o) || o.v !== 1) o = { v: 1, season, points: 0, tier: 'mortal', best: {}, history: [] };
  let rolled = null;
  if (o.season !== season && typeof o.season === 'string' && o.season) {
    // 시즌 롤오버: 최종 티어 기록 후 리셋
    const prevTier = o.tier ?? tierForPoints(o.points | 0);
    rolled = { season: o.season, tier: prevTier, points: o.points | 0 };
    o.best[o.season] = prevTier;
    o.history.push({ season: o.season, tier: prevTier, points: o.points | 0 });
    o.history = o.history.slice(-12);
    o.season = season;
    o.points = 0;
    o.tier = 'mortal';
    writeLeague(storage, o);
  }
  // 구 데이터 마이그레이션: tier 필드 없으면 포인트 기준 판정 (기존 달성 인정)
  if (typeof o.tier !== 'string' || !TIER_ORDER.includes(o.tier)) o.tier = tierForPoints(o.points | 0);
  return {
    v: 1, season: o.season, points: o.points | 0, tier: o.tier,
    best: isObj(o.best) ? o.best : {}, history: Array.isArray(o.history) ? o.history : [],
    rolled,
  };
}

// 다음 티어 승급전 대기 여부: { from, to, min } | null
// (현재 티어의 다음 티어 임계값 이상 포인트 보유 시 승급전 모드)
export function pendingPromotion(points, tierId) {
  const idx = TIER_ORDER.indexOf(tierId);
  if (idx < 0 || idx >= TIER_ORDER.length - 1) return null;
  const to = TIER_ORDER[idx + 1];
  const min = LEAGUE_TIER_MINS[idx + 1][1];
  if (points < min) return null;
  return { from: tierId, to, min };
}

// 리그 포인트 가산 (자동 승급 없음 — 승급은 승급전 승리로만)
export function addLeaguePoints(storage, pts, season) {
  const l = loadLeague(storage, season);
  l.points += Math.max(0, pts | 0);
  writeLeague(storage, l);
  return { points: l.points, tier: l.tier, pending: pendingPromotion(l.points, l.tier) };
}

// 승급전 승리 시 티어 1단계 상승 → 새 티어 id
export function promoteTier(storage, season) {
  const l = loadLeague(storage, season);
  const idx = TIER_ORDER.indexOf(l.tier);
  if (idx >= 0 && idx < TIER_ORDER.length - 1) l.tier = TIER_ORDER[idx + 1];
  writeLeague(storage, l);
  return l.tier;
}

