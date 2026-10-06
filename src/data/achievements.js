// Local achievements. Each has check(ctx) where ctx is built at game end:
// { won, turns, evolutions, difficulty, points, bonusColors:Set, caughtLegend,
//   journeyMode, journeyStage(클리어한 스테이지 번호), bossBeaten(격파한 보스 이름) }
// mode: 'common' (모든 모드) | 'journey' (신의 여정 전용)

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
  // --- 신의 여정 전용 업적 ---
  { id: 'journey-start', mode: 'journey', icon: '⛵', name: '항해 시작', desc: '신의 여정 첫 스테이지 클리어하기', check: (c) => c.journeyMode && c.journeyStage >= 1 },
  { id: 'journey-half', mode: 'journey', icon: '🌊', name: '반환점', desc: '신의 여정 3 스테이지 클리어하기', check: (c) => c.journeyMode && c.journeyStage >= 3 },
  { id: 'boss-kirke', mode: 'journey', icon: '👹', name: '마녀 격파', desc: '키르케 격파하기', check: (c) => c.bossBeaten === '키르케' },
  { id: 'boss-skylla', mode: 'journey', icon: '👹', name: '괴물 처치', desc: '스킬라 격파하기', check: (c) => c.bossBeaten === '스킬라' },
  { id: 'boss-poseidon', mode: 'journey', icon: '👹', name: '바다의 신 초월', desc: '포세이돈 격파하기', check: (c) => c.bossBeaten === '포세이돈' },
  { id: 'journey-complete', mode: 'journey', icon: '🌟', name: '신화 완성', desc: '오디세우스의 여정 완주하기', check: (c) => c.journeyMode && c.journeyStage >= 6 },
];

export function checkAchievements(ctx, unlocked) {
  return ACHIEVEMENTS.filter((a) =>
    !unlocked[a.id] &&
    (a.mode === 'common' || (a.mode === 'journey' && ctx.journeyMode)) &&
    a.check(ctx)
  );
}
