// Local achievements. Each has check(ctx) where ctx is built at game end:
// { won, turns, evolutions, difficulty, points, bonusColors:Set, caughtLegend,
//   leagueMode, promotionMatch, bossBeaten, promotedTo }
// mode: 'common' (양쪽 모드) | 'league' (리그전 전용)

export const ACHIEVEMENTS = [
  // --- 공통 업적 ---
  { id: 'first-win', mode: 'common', icon: '🏆', name: '첫 승리', desc: 'AI를 상대로 처음 승리하기', check: (c) => c.won },
  { id: 'speed-win', mode: 'common', icon: '⚡', name: '스피드러너', desc: '40턴 안에 승리하기', check: (c) => c.won && c.turns <= 40 },
  { id: 'big-win', mode: 'common', icon: '💯', name: '압도적 승리', desc: '24점 이상으로 승리하기', check: (c) => c.won && c.points >= 24 },
  { id: 'no-evo-win', mode: 'common', icon: '🌱', name: '순수 육성', desc: '신격화 없이 승리하기', check: (c) => c.won && c.evolutions === 0 },
  { id: 'evo-master', mode: 'common', icon: '🌀', name: '신격화 마스터', desc: '한 게임에서 5회 신격화하기', check: (c) => c.evolutions >= 5 },
  { id: 'rainbow', mode: 'common', icon: '🌈', name: '무지개', desc: '5개 신역의 가호를 모두 보유하기', check: (c) => c.bonusColors.size >= 5 },
  { id: 'legend-catch', mode: 'common', icon: '✨', name: '전설 영입', desc: '전설 존재 영입', check: (c) => c.caughtLegend },
  { id: 'hard-win', mode: 'common', icon: '👑', name: '진정한 챔피언', desc: '어려움 난이도에서 승리하기', check: (c) => c.won && (c.difficulty === 'hard' || c.difficulty === 'veryhard') },
  // --- 리그 전용 업적 ---
  { id: 'first-promotion', mode: 'league', icon: '🏅', name: '첫 승급', desc: '첫 승급전(보스전)에서 승리하기', check: (c) => c.leagueMode && c.promotionMatch && c.rank === 1 },
  { id: 'boss-minotaur', mode: 'league', icon: '👹', name: '미궁 정복', desc: '미노타우로스 격파하기', check: (c) => c.bossBeaten === '미노타우로스' },
  { id: 'boss-medusa', mode: 'league', icon: '👹', name: '고르곤 처치', desc: '메두사 격파하기', check: (c) => c.bossBeaten === '메두사' },
  { id: 'boss-hydra', mode: 'league', icon: '👹', name: '히드라 퇴치', desc: '히드라 격파하기', check: (c) => c.bossBeaten === '히드라' },
  { id: 'boss-agamemnon', mode: 'league', icon: '👹', name: '정복왕 격파', desc: '아가멤논 격파하기', check: (c) => c.bossBeaten === '아가멤논' },
  { id: 'boss-zeus', mode: 'league', icon: '👹', name: '신왕 초월', desc: '제우스 격파하기', check: (c) => c.bossBeaten === '제우스' },
  { id: 'reach-demigod', mode: 'league', icon: '✨', name: '반신 달성', desc: '반신 티어에 도달하기', check: (c) => c.promotedTo === 'demigod' },
  { id: 'reach-god', mode: 'league', icon: '🌟', name: '신 달성', desc: '신 티어에 도달하기', check: (c) => c.promotedTo === 'god' },
];

export function checkAchievements(ctx, unlocked) {
  return ACHIEVEMENTS.filter((a) =>
    !unlocked[a.id] &&
    (a.mode === 'common' || (a.mode === 'league' && ctx.leagueMode)) &&
    a.check(ctx)
  );
}
