// 싱글모드 게임 종료 시 메타 정산 (한 번에).
// 멀티플레이어에서는 호출하지 않음 (완전 바닐라).
// ctx: {
//   won, rank(1-4), points, turns(인간 턴), difficulty(플레이어 선택), aiDifficulty(실효),
//   heroName, leagueMode(bool), evolved(신격화 횟수), track: { reserve, take },
//   dateStr: 'YYYY-MM-DD', season: 'YYYY-MM',
//   promotionMatch(bool), promotionTo(승급 목표 티어 id | null) — 승급전 승리 시 승급
// }

import {
  addHeroXP, heroXpFor, addLeaguePoints, leaguePointsFor, promoteTier,
  completeDaily, completeChal, loadChal,
} from '../storage/store.js?v=1791282537';
import { dailyChallenge, weeklyChallenge, isChallengeComplete } from '../data/daily.js?v=1791282537';
import { TIERS, tierById } from '../data/league.js?v=1791282537';

export function settleMeta(storage, ctx) {
  const out = { xp: null, league: null, daily: null, weekly: null };

  // 1. 영웅 육성 (싱글 전용, 전투력 없음·명예만)
  if (ctx.heroName) {
    const gained = heroXpFor(ctx.rank, ctx.difficulty);
    const r = addHeroXP(storage, ctx.heroName, gained);
    out.xp = { hero: ctx.heroName, gained, level: r.level, title: r.title, leveledUp: r.leveledUp };
  }

  // 2. 올림포스 리그 (리그전에서만)
  // 승급은 승급전(보스전) 1등 승리로만 발생. 일반 게임은 포인트만 적립.
  if (ctx.leagueMode) {
    const gained = leaguePointsFor(ctx.rank, ctx.difficulty);
    const r = addLeaguePoints(storage, gained, ctx.season);
    let tierId = r.tier;
    let promoted = false;
    if (ctx.promotionMatch && ctx.rank === 1 && ctx.promotionTo) {
      tierId = promoteTier(storage, ctx.season);
      promoted = true;
    }
    const tier = tierById(tierId);
    const tIdx = TIERS.findIndex((t) => t.id === tierId);
    const next = tIdx + 1 < TIERS.length ? TIERS[tIdx + 1] : null;
    const pending = !promoted && r.pending ? { ...r.pending, boss: tierById(r.pending.to).boss } : null;
    out.league = {
      gained, points: r.points, tier, promoted, next,
      toGo: next ? next.min - r.points : 0, pending,
      bossBeaten: promoted ? tierById(ctx.promotionTo)?.boss ?? null : null,
    };
  }

  // 3. 일일/주간 도전
  const chalCtx = {
    won: ctx.won, heroName: ctx.heroName, turns: ctx.turns,
    aiDifficulty: ctx.aiDifficulty, evolved: ctx.evolved, track: ctx.track,
  };
  const daily = dailyChallenge(ctx.dateStr);
  if (isChallengeComplete(daily, chalCtx)) {
    const r = completeDaily(storage, daily.id, ctx.dateStr);
    out.daily = { name: daily.name, desc: daily.desc, isNew: r.isNew, streak: r.streak };
  }
  const weekly = weeklyChallenge(ctx.dateStr);
  if (isChallengeComplete(weekly, chalCtx)) {
    const c = loadChal(storage);
    const isNew = !c.completed[weekly.id];
    if (isNew) completeChal(storage, weekly.id);
    out.weekly = { name: weekly.name, desc: weekly.desc, isNew };
  }

  return out;
}
