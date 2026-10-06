// 싱글모드 게임 종료 시 메타 정산 (한 번에).
// 멀티플레이어에서는 호출하지 않음 (완전 바닐라).
// ctx: {
//   won, rank(1-4), points, turns(인간 턴), difficulty(플레이어 선택), aiDifficulty(실효),
//   heroName, journeyMode(bool), evolved(신격화 횟수), track: { reserve, take },
//   dateStr: 'YYYY-MM-DD',
//   bossBeaten(격파한 보스 이름 | null)
// }

import {
  addHeroXP, heroXpFor,
  completeDaily, completeChal, loadChal,
} from '../storage/store.js?v=1791285379';
import { dailyChallenge, weeklyChallenge, isChallengeComplete } from '../data/daily.js?v=1791285379';

export function settleMeta(storage, ctx) {
  const out = { xp: null, daily: null, weekly: null };

  // 1. 영웅 육성 (싱글 전용, 전투력 없음·명예만)
  if (ctx.heroName) {
    const gained = heroXpFor(ctx.rank, ctx.difficulty);
    const r = addHeroXP(storage, ctx.heroName, gained);
    out.xp = { hero: ctx.heroName, gained, level: r.level, title: r.title, leveledUp: r.leveledUp };
  }

  // 2. 일일/주간 도전
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
