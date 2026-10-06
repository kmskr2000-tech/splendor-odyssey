// 일일/주간 도전: 날짜 시드 기반 결정적 생성 (같은 날 모두 같은 도전).
// 싱글모드에서만 정산 (멀티플레이어는 바닐라).

import { mondayOf } from './league.js?v=1791281681';

const GAHO = [
  { key: 'monster', name: '천둥' },
  { key: 'super', name: '바다' },
  { key: 'hyper', name: '대지' },
  { key: 'heal', name: '생명' },
  { key: 'quick', name: '태양' },
];

const HEROES = ['다이달로스', '아가멤논', '파트로클로스', '네스토르'];

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// dateStr: 'YYYY-MM-DD'
export function dailyChallenge(dateStr) {
  const h = hashStr('odo-daily:' + dateStr);
  const id = `daily-${dateStr}`;
  const kind = h % 3;
  if (kind === 0) {
    return { id, kind: 'daily', name: '절제의 미덕', desc: '찜 없이 승리하기', check: 'noReserve' };
  }
  if (kind === 1) {
    const c = GAHO[h % GAHO.length];
    return { id, kind: 'daily', name: `${c.name} 끊기`, desc: `${c.name}의 가호 없이 승리하기`, check: 'noColor', color: c.key, colorName: c.name };
  }
  const hero = HEROES[h % HEROES.length];
  return { id, kind: 'daily', name: `${hero}의 길`, desc: `${hero}(으)로 게임 끝까지 플레이하기`, check: 'hero', hero };
}

export function weeklyChallenge(dateStr) {
  const monday = mondayOf(dateStr);
  const h = hashStr('odo-weekly:' + monday);
  const id = `weekly-${monday}`;
  const pool = [
    { name: '전광석화', desc: '12턴 안에 승리하기', check: 'fastWin' },
    { name: '신들의 시험', desc: '어려움 상대에게 승리하기', check: 'hardWin' },
    { name: '순수한 승리', desc: '신격화 없이 승리하기', check: 'noEvolve' },
  ];
  return { id, kind: 'weekly', ...pool[h % pool.length] };
}

// ctx: { won, heroName, turns(인간 턴 수), aiDifficulty, evolved, track: { reserve, take: {color:n} } }
export function isChallengeComplete(ch, ctx) {
  switch (ch.check) {
    case 'noReserve': return !!ctx.won && (ctx.track?.reserve ?? 0) === 0;
    case 'noColor': return !!ctx.won && ((ctx.track?.take?.[ch.color] ?? 0) === 0);
    case 'hero': return ctx.heroName === ch.hero;
    case 'fastWin': return !!ctx.won && (ctx.turns ?? 99) <= 12;
    case 'hardWin': return !!ctx.won && ctx.aiDifficulty === 'hard';
    case 'noEvolve': return !!ctx.won && (ctx.evolved ?? 1) === 0;
    default: return false;
  }
}
