// 업적 (도전과제). check(ctx)에서 판정, ctx는 게임 종료 시점에 main.js에서 구성:
// { won, rank, turns, evolutions, difficulty, points, margin(우승 시 2위와의 점수차),
//   bonusColors:Set, masterTokens(보유 암브로시아), caughtLegend,
//   journeyMode, journeyStage(클리어한 스테이지 번호), bossBeaten(격파한 보스 이름),
//   streak(현재 연승), totalEvos(누적 신격화), dexCaught(도감 수집 수) }
// mode: 'common' (모든 모드) | 'journey' (신의 여정 전용)
// cat: 'story' | 'battle' | 'collect' | 'special' (UI 그룹핑용)

export const ACHV_CATS = [
  ['story', '📖 스토리'],
  ['battle', '⚔️ 전투'],
  ['collect', '📚 수집'],
  ['special', '✨ 특수'],
];

export const ACHIEVEMENTS = [
  // --- 스토리 (신의 여정 전용) ---
  { id: 'journey-start', cat: 'story', mode: 'journey', icon: '⛵', name: '항해 시작', desc: '신의 여정 스테이지 1 클리어', check: (c) => c.journeyMode && c.journeyStage >= 1 },
  { id: 'journey-2', cat: 'story', mode: 'journey', icon: '🏝️', name: '마녀의 섬 탈출', desc: '신의 여정 스테이지 2 클리어', check: (c) => c.journeyMode && c.journeyStage >= 2 },
  { id: 'journey-3', cat: 'story', mode: 'journey', icon: '🌊', name: '반환점', desc: '신의 여정 스테이지 3 클리어', check: (c) => c.journeyMode && c.journeyStage >= 3 },
  { id: 'journey-4', cat: 'story', mode: 'journey', icon: '🌀', name: '괴물의 협곡', desc: '신의 여정 스테이지 4 클리어', check: (c) => c.journeyMode && c.journeyStage >= 4 },
  { id: 'journey-5', cat: 'story', mode: 'journey', icon: '🌅', name: '귀향 눈앞에', desc: '신의 여정 스테이지 5 클리어', check: (c) => c.journeyMode && c.journeyStage >= 5 },
  { id: 'boss-kirke', cat: 'story', mode: 'journey', icon: '🧙', name: '마녀 격파', desc: '키르케 격파하기', check: (c) => c.bossBeaten === '키르케' },
  { id: 'boss-skylla', cat: 'story', mode: 'journey', icon: '👹', name: '괴물 처치', desc: '스킬라 격파하기', check: (c) => c.bossBeaten === '스킬라' },
  { id: 'boss-poseidon', cat: 'story', mode: 'journey', icon: '🔱', name: '바다의 신 초월', desc: '포세이돈 격파하기', check: (c) => c.bossBeaten === '포세이돈' },
  { id: 'journey-complete', cat: 'story', mode: 'journey', icon: '🌟', name: '신화 완성', desc: '오디세우스의 여정 완주하기', check: (c) => c.journeyMode && c.journeyStage >= 6 },

  // --- 전투 ---
  { id: 'first-win', cat: 'battle', mode: 'common', icon: '🏆', name: '첫 승리', desc: 'AI를 상대로 처음 승리하기', check: (c) => c.won },
  { id: 'streak-3', cat: 'battle', mode: 'common', icon: '🔥', name: '3연승', desc: '3연승 달성하기', check: (c) => c.won && c.streak >= 3 },
  { id: 'streak-5', cat: 'battle', mode: 'common', icon: '🔥', name: '5연승', desc: '5연승 달성하기', check: (c) => c.won && c.streak >= 5 },
  { id: 'big-win', cat: 'battle', mode: 'common', icon: '💯', name: '압도적 승리', desc: '24점 이상으로 승리하기', check: (c) => c.won && c.points >= 24 },
  { id: 'huge-margin', cat: 'battle', mode: 'common', icon: '💥', name: '완벽한 압승', desc: '10점 차 이상으로 승리하기', check: (c) => c.won && c.margin >= 10 },
  { id: 'speed-win', cat: 'battle', mode: 'common', icon: '⚡', name: '스피드러너', desc: '40턴 안에 승리하기', check: (c) => c.won && c.turns <= 40 },
  { id: 'blitz-win', cat: 'battle', mode: 'common', icon: '🌪️', name: '전광석화', desc: '20턴 안에 승리하기', check: (c) => c.won && c.turns <= 20 },
  { id: 'no-evo-win', cat: 'battle', mode: 'common', icon: '🌱', name: '순수 육성', desc: '신격화 없이 승리하기', check: (c) => c.won && c.evolutions === 0 },
  { id: 'evo-master', cat: 'battle', mode: 'common', icon: '🌀', name: '신격화 마스터', desc: '한 게임에서 5회 신격화하기', check: (c) => c.evolutions >= 5 },
  { id: 'hard-win', cat: 'battle', mode: 'common', icon: '👑', name: '진정한 챔피언', desc: '어려움 이상 난이도에서 승리하기', check: (c) => c.won && (c.difficulty === 'hard' || c.difficulty === 'veryhard') },

  // --- 수집 ---
  { id: 'dex-30', cat: 'collect', mode: 'common', icon: '📖', name: '수집가', desc: '신화도감 30장 수집하기', check: (c) => c.dexCaught >= 30 },
  { id: 'dex-60', cat: 'collect', mode: 'common', icon: '📚', name: '박물학자', desc: '신화도감 60장 수집하기', check: (c) => c.dexCaught >= 60 },
  { id: 'dex-90', cat: 'collect', mode: 'common', icon: '🏛️', name: '신화 완성자', desc: '신화도감 90장 모두 수집하기', check: (c) => c.dexCaught >= 90 },
  { id: 'legend-catch', cat: 'collect', mode: 'common', icon: '✨', name: '전설 영입', desc: '전설 존재 영입하기', check: (c) => c.caughtLegend },
  { id: 'evo-10-total', cat: 'collect', mode: 'common', icon: '🌀', name: '신격화 장인', desc: '누적 10회 신격화하기', check: (c) => c.totalEvos >= 10 },

  // --- 특수 ---
  { id: 'rainbow', cat: 'special', mode: 'common', icon: '🌈', name: '무지개', desc: '6종의 가호를 모두 보유하기', check: (c) => c.bonusColors.size >= 6 },
  { id: 'master-hoard', cat: 'special', mode: 'common', icon: '🏺', name: "신들의 양식", desc: '암브로시아 5개 보유한 채 승리하기', check: (c) => c.won && c.masterTokens >= 5 },
];

export function checkAchievements(ctx, unlocked) {
  return ACHIEVEMENTS.filter((a) =>
    !unlocked[a.id] &&
    (a.mode === 'common' || (a.mode === 'journey' && ctx.journeyMode)) &&
    a.check(ctx)
  );
}
