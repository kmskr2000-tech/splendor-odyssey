// localStorage persistence: Pokedex (cumulative caught record) and the in-progress game save.
// Storage is injected so tests can use a Map-backed fake; every access is try/catch'd because
// localStorage can throw (private mode, blocked site data) and the game must still run without it.

export const DEX_KEY = 'odo-dex-v1';
export const SAVE_KEY = 'odo-save-v1';
export const OPTS_KEY = 'odo-opts-v1';
export const ACHV_KEY = 'odo-achv-v1';
export const RECORDS_KEY = 'odo-records-v1';

export function browserStorage() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

export function readJSON(storage, key) {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function writeJSON(storage, key, value) {
  try { storage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

export const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

// ---------- Pokedex ----------
// { v:1, caught: { [cardId]: { n, first, last, evolved } }, games: { played, won } }

const emptyDex = () => ({ v: 1, caught: {}, games: { played: 0, won: 0 } });

export function loadDex(storage) {
  const d = readJSON(storage, DEX_KEY);
  if (!isObj(d) || d.v !== 1 || !isObj(d.caught)) return emptyDex();
  const dex = emptyDex();
  for (const [id, e] of Object.entries(d.caught)) {
    if (isObj(e) && Number.isInteger(e.n) && e.n > 0) {
      dex.caught[id] = { n: e.n, first: Number(e.first) || 0, last: Number(e.last) || 0, evolved: Math.max(0, e.evolved | 0) };
    }
  }
  if (isObj(d.games)) dex.games = { played: Math.max(0, d.games.played | 0), won: Math.max(0, d.games.won | 0) };
  return dex;
}

// kind: 'buy' (captured) | 'evolve' (obtained by evolution). Both count as "caught".
export function recordCatch(storage, cardId, kind = 'buy', now = Date.now()) {
  const dex = loadDex(storage);
  const e = dex.caught[cardId] ?? { n: 0, first: now, last: now, evolved: 0 };
  e.n += 1;
  e.last = now;
  if (kind === 'evolve') e.evolved += 1;
  dex.caught[cardId] = e;
  writeJSON(storage, DEX_KEY, dex);
  return dex;
}

export function recordGame(storage, won) {
  const dex = loadDex(storage);
  dex.games.played += 1;
  if (won) dex.games.won += 1;
  writeJSON(storage, DEX_KEY, dex);
  return dex;
}

export function dexSummary(dex, cards) {
  const ids = new Set(cards.map((c) => c.id));
  const caught = Object.keys(dex.caught).filter((id) => ids.has(id)).length;
  return { caught, total: cards.length };
}

// ---------- game save ----------
// { v:1, savedAt, seed, humanName, aiNames, log, game }  — game is the engine's plain-JSON state.

export function saveGame(storage, snap, now = Date.now()) {
  return writeJSON(storage, SAVE_KEY, { v: 1, savedAt: now, ...snap });
}

export function clearSave(storage) {
  try { storage?.removeItem(SAVE_KEY); } catch { /* ignore */ }
}

// Returns the save only when it is structurally sound AND resumable; anything else is dropped
// (a corrupt save must never brick the start screen).
export function loadSave(storage, cards) {
  const s = readJSON(storage, SAVE_KEY);
  if (!isObj(s) || s.v !== 1 || !isObj(s.game) || typeof s.humanName !== 'string' || !Array.isArray(s.aiNames)) return null;
  const g = s.game;
  if (!Array.isArray(g.players) || g.players.length < 2 || g.players.length > 4) return null;
  if (!isObj(g.supply) || !isObj(g.table) || !isObj(g.decks) || typeof g.rng !== 'number') return null;
  if (g.phase === 'finished' || g.ranking) return null;
  const ids = new Set(cards.map((c) => c.id));
  const known = (c) => isObj(c) && ids.has(c.id);
  for (const p of g.players) {
    if (!Array.isArray(p.tableau) || !Array.isArray(p.hand) || !Array.isArray(p.evolved) || !isObj(p.tokens)) return null;
    if (![...p.tableau, ...p.hand, ...p.evolved].every(known)) return null;
  }
  for (const k of Object.keys(g.table)) if (!Array.isArray(g.table[k]) || !g.table[k].every((c) => c === null || known(c))) return null;
  for (const k of Object.keys(g.decks)) if (!Array.isArray(g.decks[k]) || !g.decks[k].every(known)) return null;
  return s;
}

// ---------- Options ----------
// { v:1, beginnerHelp: bool }

const defaultOptions = () => ({ v: 1, beginnerHelp: true, difficulty: 'normal', personality: 'random', playerName: '', playerAvatar: -1 });

const DIFFS = new Set(['easy', 'normal', 'hard', 'veryhard']);
const PERSS = new Set(['random', 'specialized', 'opportunistic', 'balanced']);

export function loadOptions(storage) {
  const o = readJSON(storage, OPTS_KEY);
  if (!isObj(o)) return defaultOptions();
  const av = Number.isInteger(o.playerAvatar) && o.playerAvatar >= -1 && o.playerAvatar < 4 ? o.playerAvatar : -1;
  return {
    v: 1,
    beginnerHelp: o.beginnerHelp !== false,
    difficulty: DIFFS.has(o.difficulty) ? o.difficulty : 'normal',
    personality: PERSS.has(o.personality) ? o.personality : 'random',
    playerName: typeof o.playerName === 'string' ? o.playerName.slice(0, 12) : '',
    playerAvatar: av, // -1 = 랜덤, 0~3 = 고정
  };
}

export function saveOptions(storage, opts) {
  const av = Number.isInteger(opts.playerAvatar) && opts.playerAvatar >= -1 && opts.playerAvatar < 4 ? opts.playerAvatar : -1;
  writeJSON(storage, OPTS_KEY, {
    v: 1,
    beginnerHelp: !!opts.beginnerHelp,
    difficulty: DIFFS.has(opts.difficulty) ? opts.difficulty : 'normal',
    personality: PERSS.has(opts.personality) ? opts.personality : 'random',
    playerName: typeof opts.playerName === 'string' ? opts.playerName.slice(0, 12) : '',
    playerAvatar: av,
  });
}

// ---------- Achievements ----------
// { v:1, unlocked: { [id]: timestamp } }

export function loadAchv(storage) {
  const o = readJSON(storage, ACHV_KEY);
  if (!isObj(o) || !isObj(o.unlocked)) return { v: 1, unlocked: {} };
  return { v: 1, unlocked: o.unlocked };
}

export function unlockAchv(storage, ids, now = Date.now()) {
  const a = loadAchv(storage);
  let changed = false;
  for (const id of ids) {
    if (!a.unlocked[id]) { a.unlocked[id] = now; changed = true; }
  }
  if (changed) writeJSON(storage, ACHV_KEY, a);
  return changed;
}

// ---------- Records ----------
// Victory score: win ? 1000 + points*10 + max(0, 60-turns)*5 + diffBonus : points*10
// { v:1, best: number, games: number, wins: number, history: [{score, won, points, turns, difficulty, date}] }

const DIFF_BONUS = { easy: 0, normal: 100, hard: 200 };

export function victoryScore({ won, points, turns, difficulty }) {
  const base = points * 10 + Math.max(0, 60 - turns) * 5 + (DIFF_BONUS[difficulty] ?? 0);
  return won ? 1000 + base : base;
}

export function loadRecords(storage) {
  const o = readJSON(storage, RECORDS_KEY);
  if (!isObj(o)) return { v: 1, best: 0, games: 0, wins: 0, history: [], byHero: {}, curStreak: 0, bestStreak: 0, fastestWin: null, mostPoints: null };
  return {
    v: 1,
    best: typeof o.best === 'number' ? o.best : 0,
    games: typeof o.games === 'number' ? o.games : 0,
    wins: typeof o.wins === 'number' ? o.wins : 0,
    history: Array.isArray(o.history) ? o.history.slice(-20) : [],
    byHero: isObj(o.byHero) ? o.byHero : {},
    curStreak: Math.max(0, o.curStreak | 0),
    bestStreak: Math.max(0, o.bestStreak | 0),
    fastestWin: isObj(o.fastestWin) ? o.fastestWin : null,
    mostPoints: isObj(o.mostPoints) ? o.mostPoints : null,
  };
}

export function recordResult(storage, result, now = Date.now()) {
  const r = loadRecords(storage);
  const score = victoryScore(result);
  r.games += 1;
  if (result.won) r.wins += 1;
  r.best = Math.max(r.best, score);
  // 영웅별 승률
  if (typeof result.hero === 'string' && result.hero) {
    const h = r.byHero[result.hero] ?? { games: 0, wins: 0 };
    h.games += 1;
    if (result.won) h.wins += 1;
    r.byHero[result.hero] = h;
  }
  // 연승
  if (result.won) {
    r.curStreak += 1;
    r.bestStreak = Math.max(r.bestStreak, r.curStreak);
    if (!r.fastestWin || result.turns < r.fastestWin.turns) r.fastestWin = { turns: result.turns, date: now };
  } else {
    r.curStreak = 0;
  }
  // 최고 점수 (승패 무관)
  if (!r.mostPoints || result.points > r.mostPoints.points) r.mostPoints = { points: result.points, date: now };
  r.history.push({ score, ...result, date: now });
  r.history = r.history.slice(-20);
  writeJSON(storage, RECORDS_KEY, r);
  return { score, isBest: score >= r.best && score > 0 };
}

// ---------- Hero progression ----------
// { v:1, heroes: { [name]: { xp, level } } }
// 레벨은 명예 보상만 (전투력 없음). 칭호·배지·XP바로 표시.

export const HERO_KEY = 'odo-hero-v1';
export const HERO_XP_LEVELS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200];
export const HERO_TITLES = { 1: '신입', 3: '수습 영웅', 5: '노련한 영웅', 7: '명성 높은 영웅', 10: '살아있는 전설' };
export const DIFF_MULT = { easy: 0.7, normal: 1.0, hard: 1.4, veryhard: 2.0 };
const RANK_XP = [100, 60, 30, 20];

export function heroXpFor(rank, difficulty) {
  return Math.round((RANK_XP[rank - 1] ?? 20) * (DIFF_MULT[difficulty] ?? 1));
}

export function heroLevelFor(xp) {
  let level = 1;
  for (let i = 0; i < HERO_XP_LEVELS.length; i++) if (xp >= HERO_XP_LEVELS[i]) level = i + 1;
  return level;
}

export function heroTitleFor(level) {
  let title = HERO_TITLES[1];
  for (const [lv, t] of Object.entries(HERO_TITLES)) if (level >= Number(lv)) title = t;
  return title;
}

export function loadHero(storage) {
  const o = readJSON(storage, HERO_KEY);
  const heroes = {};
  if (isObj(o) && isObj(o.heroes)) {
    for (const [name, h] of Object.entries(o.heroes)) {
      if (isObj(h)) {
        const xp = Math.max(0, h.xp | 0);
        heroes[name] = { xp, level: heroLevelFor(xp) };
      }
    }
  }
  return { v: 1, heroes };
}

export function getHero(storage, name) {
  const h = loadHero(storage).heroes[name] ?? { xp: 0, level: 1 };
  const nextAt = h.level < 10 ? HERO_XP_LEVELS[h.level] : null;
  const curAt = HERO_XP_LEVELS[h.level - 1];
  return {
    xp: h.xp, level: h.level, title: heroTitleFor(h.level),
    cur: h.xp - curAt, need: nextAt == null ? 0 : nextAt - curAt,
  };
}

export function addHeroXP(storage, name, xp) {
  const h = loadHero(storage);
  const e = h.heroes[name] ?? { xp: 0, level: 1 };
  const before = e.level;
  e.xp += Math.max(0, xp | 0);
  e.level = heroLevelFor(e.xp);
  h.heroes[name] = e;
  writeJSON(storage, HERO_KEY, h);
  return { xp: e.xp, level: e.level, title: heroTitleFor(e.level), leveledUp: e.level > before, gained: xp };
}

// ---------- Journey (신의 여정 스토리 모드) ----------
// { v:1, slots: [ { hero, stage } | null × 3 ] }
// 슬롯당 영웅 고정, stage = 클리어한 최고 스테이지 번호 (0 = 시작 전)
export const JOURNEY_KEY = 'odo-journey-v1';
export const JOURNEY_SLOTS = 3;

function blankJourney() {
  return { v: 1, slots: Array(JOURNEY_SLOTS).fill(null) };
}

export function loadJourney(storage) {
  const o = readJSON(storage, JOURNEY_KEY);
  if (!isObj(o) || o.v !== 1 || !Array.isArray(o.slots)) return blankJourney();
  const slots = o.slots.slice(0, JOURNEY_SLOTS).map((s) =>
    (isObj(s) && typeof s.hero === 'string' && Number.isInteger(s.stage))
      ? { hero: s.hero, stage: s.stage, cleared: Array.isArray(s.cleared) ? s.cleared.filter(Number.isInteger) : [] }
      : null
  );
  while (slots.length < JOURNEY_SLOTS) slots.push(null);
  return { v: 1, slots };
}

function writeJourney(storage, j) {
  writeJSON(storage, JOURNEY_KEY, { v: 1, slots: j.slots });
}

// 슬롯에 새 여정 시작 (hero 고정)
export function startJourneySlot(storage, slotIdx, hero) {
  const j = loadJourney(storage);
  if (slotIdx < 0 || slotIdx >= JOURNEY_SLOTS) return j;
  j.slots[slotIdx] = { hero, stage: 0, cleared: [] };
  writeJourney(storage, j);
  return j;
}

// 스테이지 클리어 → 다음 스테이지 해금. clearStage: 클리어한 스테이지 번호
export function advanceJourneyStage(storage, slotIdx, clearStage) {
  const j = loadJourney(storage);
  const s = j.slots[slotIdx];
  if (!s) return j;
  if (clearStage === s.stage + 1) {
    s.stage = clearStage;
    if (!s.cleared.includes(clearStage)) s.cleared.push(clearStage);
  }
  writeJourney(storage, j);
  return j;
}

export function clearJourneySlot(storage, slotIdx) {
  const j = loadJourney(storage);
  if (slotIdx >= 0 && slotIdx < JOURNEY_SLOTS) j.slots[slotIdx] = null;
  writeJourney(storage, j);
  return j;
}

// ---------- Challenges ----------
// { v:1, completed: { [id]: timestamp } }

export const CHAL_KEY = 'odo-chal-v1';

export function loadChal(storage) {
  const o = readJSON(storage, CHAL_KEY);
  if (!isObj(o)) return { v: 1, completed: {}, streak: { count: 0, last: '' } };
  const streak = isObj(o.streak) ? o.streak : {};
  return {
    v: 1,
    completed: isObj(o.completed) ? o.completed : {},
    streak: { count: Math.max(0, streak.count | 0), last: typeof streak.last === 'string' ? streak.last : '' },
  };
}

export function completeChal(storage, id, now = Date.now()) {
  const c = loadChal(storage);
  if (!c.completed[id]) {
    c.completed[id] = now;
    writeJSON(storage, CHAL_KEY, c);
    return true;
  }
  return false;
}

// 일일 도전 완료 + 연속 클리어 스트릭 (dateStr: 'YYYY-MM-DD')
// 어제 완료했으면 +1, 오늘이면 유지, 그 외는 1로 리셋
export function completeDaily(storage, id, dateStr, now = Date.now()) {
  const c = loadChal(storage);
  let isNew = false;
  if (!c.completed[id]) {
    c.completed[id] = now;
    isNew = true;
    const dt = new Date(Number(dateStr.slice(0, 4)), Number(dateStr.slice(5, 7)) - 1, Number(dateStr.slice(8)) - 1);
    const yesterday = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    c.streak.count = c.streak.last === yesterday ? c.streak.count + 1 : (c.streak.last === dateStr ? c.streak.count : 1);
    c.streak.last = dateStr;
  }
  writeJSON(storage, CHAL_KEY, c);
  return { isNew, streak: c.streak.count };
}
