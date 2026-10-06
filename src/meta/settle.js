// 싱글모드 게임 종료 시 메타 정산 (한 번에).
// 멀티플레이어에서는 호출하지 않음 (완전 바닐라).
// ctx: {
//   won, rank(1-4), points, turns(인간 턴), difficulty(플레이어 선택), aiDifficulty(실효),
//   heroName, journeyMode(bool), evolved(신격화 횟수), track: { reserve, take },
//   bossBeaten(격파한 보스 이름 | null)
// }

import { addHeroXP, heroXpFor } from '../storage/store.js?v=1791288149';

export function settleMeta(storage, ctx) {
  const out = { xp: null };

  // 영웅 육성 (싱글 전용, 전투력 없음·명예만)
  if (ctx.heroName) {
    const gained = heroXpFor(ctx.rank, ctx.difficulty);
    const r = addHeroXP(storage, ctx.heroName, gained);
    out.xp = { hero: ctx.heroName, gained, level: r.level, title: r.title, leveledUp: r.leveledUp };
  }

  return out;
}
