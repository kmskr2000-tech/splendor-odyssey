// Pokemon Splendor rule engine. Pure functions over a plain-JSON state.
// applyAction never mutates its input: it returns a new state (cheap lookahead for AI).

import {
  COLORS, MASTER, TOKEN_KEYS, MASTER_TOTAL, TOKENS_PER_COLOR, MAX_TOKENS, MAX_HAND,
  WIN_POINTS, TIER_KEYS, RESERVABLE_TIER_KEYS, TABLE_SLOTS, SPECIAL_TIER_KEYS, PHASES,
  RULE_CHOICES,
} from './constants.js?v=1791285379';
import { nextInt, shuffle } from './rng.js?v=1791285379';

const ok = (state, events) => ({ ok: true, state, events });
const fail = (error) => ({ ok: false, error });

const zeroTokens = () => Object.fromEntries(TOKEN_KEYS.map((k) => [k, 0]));
const sumValues = (obj) => Object.values(obj).reduce((a, b) => a + b, 0);
const isCount = (n) => Number.isInteger(n) && n >= 0;

// ---------- queries ----------

export function tokenCount(player) {
  return sumValues(player.tokens);
}

export function bonusList(card) {
  return Array.isArray(card.bonus) ? card.bonus : [card.bonus];
}

export function getBonuses(player) {
  const bonuses = Object.fromEntries(COLORS.map((c) => [c, 0]));
  for (const card of player.tableau) {
    for (const b of bonusList(card)) bonuses[b] += 1;
  }
  return bonuses;
}

export function getPoints(player) {
  return player.tableau.reduce((sum, card) => sum + card.points, 0);
}

export function isSpecial(card) {
  return SPECIAL_TIER_KEYS.includes(String(card.tier));
}

export function getCurrentPlayer(state) {
  return state.players[state.current];
}

function findOnTable(state, cardId) {
  for (const key of TIER_KEYS) {
    const idx = state.table[key].findIndex((c) => c && c.id === cardId);
    if (idx >= 0) return { key, idx, card: state.table[key][idx] };
  }
  return null;
}

// 색상별 필요 가호 수 (할인 적용: 가장 많이 필요한 가호부터 차감)
function colorNeeds(player, card, discount = 0) {
  const bonuses = getBonuses(player);
  const needs = COLORS.map((c) => Math.max(0, (card.cost[c] || 0) - bonuses[c]));
  let disc = Math.max(0, discount | 0);
  const order = needs.map((_, i) => i).sort((a, b) => needs[b] - needs[a]);
  for (const i of order) {
    if (disc <= 0) break;
    const t = Math.min(disc, needs[i]);
    needs[i] -= t;
    disc -= t;
  }
  return needs;
}

// Returns payment ({color: n, ..., master: m}) or null when unaffordable.
// discount: 다이달로스 "명장의 손길" — 가호 1개 할인.
export function computePayment(player, card, discount = 0) {
  const needs = colorNeeds(player, card, discount);
  const payment = zeroTokens();
  let deficit = 0;
  COLORS.forEach((c, i) => {
    const pay = Math.min(needs[i], player.tokens[c]);
    payment[c] = pay;
    deficit += needs[i] - pay;
  });
  payment[MASTER] = deficit + requiredExtraMasters(card);
  return payment[MASTER] <= player.tokens[MASTER] ? payment : null;
}

function requiredExtraMasters(card) {
  if (!isSpecial(card)) return 0;
  return RULE_CHOICES.specialMasterIsExtra ? RULE_CHOICES.specialMasterCount : 0;
}

// Validates an explicit payment. Returns error code or null.
function validatePayment(player, card, payment, discount = 0) {
  if (!payment || typeof payment !== 'object') return 'bad_payment';
  const needs = colorNeeds(player, card, discount);
  let deficit = 0;
  for (const k of Object.keys(payment)) {
    if (!TOKEN_KEYS.includes(k)) return 'bad_payment';
  }
  for (const k of TOKEN_KEYS) {
    const v = payment[k] ?? 0;
    if (!isCount(v) || v > player.tokens[k]) return 'bad_payment';
  }
  for (let i = 0; i < COLORS.length; i++) {
    const pay = payment[COLORS[i]] ?? 0;
    if (pay > needs[i]) return 'overpay';
    deficit += needs[i] - pay;
  }
  const masters = payment[MASTER] ?? 0;
  const expected = deficit + requiredExtraMasters(card);
  if (isSpecial(card) && masters < RULE_CHOICES.specialMasterCount) return 'master_required';
  if (masters !== expected) return 'bad_payment';
  return null;
}

export function evolveOptions(state, player) {
  const bonuses = getBonuses(player);
  const options = [];
  for (const card of player.tableau) {
    if (!card.evolvesTo || !card.evolveReq) continue;
    if (!Object.entries(card.evolveReq).every(([c, n]) => bonuses[c] >= n)) continue;
    if (player.hand.some((c) => c.id === card.evolvesTo)) {
      options.push({ cardId: card.id, nextId: card.evolvesTo, from: 'hand' });
    } else if (findOnTable(state, card.evolvesTo)) {
      options.push({ cardId: card.id, nextId: card.evolvesTo, from: 'table' });
    }
  }
  return options;
}

export function getRanking(state) {
  const rows = state.players.map((p, i) => ({
    player: i,
    points: getPoints(p),
    evolutions: p.evolved.length,
    pokemon: p.tableau.length,
  }));
  rows.sort((a, b) => b.points - a.points || b.evolutions - a.evolutions || a.pokemon - b.pokemon || a.player - b.player);
  let rank = 0;
  rows.forEach((row, i) => {
    const prev = rows[i - 1];
    const tied = prev && prev.points === row.points && prev.evolutions === row.evolutions && prev.pokemon === row.pokemon;
    if (!tied) rank = i + 1;
    row.rank = rank;
  });
  return rows;
}

// ---------- setup ----------

// players: [{ name, isAI?, tileId? }], cards: full card list (see design doc 2.1).
export function createGame({ cards, players, seed = 1 }) {
  const n = players.length;
  if (n < 2 || n > 4) throw new Error('players must be 2-4');
  if (new Set(cards.map((c) => c.id)).size !== cards.length) throw new Error('duplicate card id');

  const state = {
    rng: seed >>> 0,
    config: { playerCount: n, tokensPerColor: TOKENS_PER_COLOR[n], masterTotal: MASTER_TOTAL },
    players: players.map((p, i) => ({
      id: i,
      name: p.name,
      isAI: !!p.isAI,
      tileId: p.tileId ?? i,
      ability: p.ability ?? null, // 영웅 고유 능력 id (싱글모드 전용, 게임당 1회)
      tokens: zeroTokens(),
      hand: [],
      tableau: [],
      evolved: [],
    })),
    supply: zeroTokens(),
    decks: {},
    table: {},
    startPlayer: 0,
    current: 0,
    turn: 0,
    phase: PHASES.ACTION,
    endTriggeredBy: null,
    passStreak: 0,
    stalled: false,
    ranking: null,
    abilityUsed: players.map(() => false), // 영웅 능력 사용 여부 (게임당 1회)
  };

  for (const c of COLORS) state.supply[c] = state.config.tokensPerColor;
  state.supply[MASTER] = MASTER_TOTAL;

  for (const key of TIER_KEYS) {
    const deck = cards.filter((c) => String(c.tier) === key).map((c) => structuredClone(c));
    shuffle(state, deck);
    state.decks[key] = deck;
    state.table[key] = Array.from({ length: TABLE_SLOTS[key] }, () => deck.shift() ?? null);
  }

  state.startPlayer = nextInt(state, n);
  state.current = state.startPlayer;
  return state;
}

// ---------- legal actions ----------

function combinations(arr, size) {
  if (size === 0) return [[]];
  const out = [];
  arr.forEach((v, i) => {
    for (const rest of combinations(arr.slice(i + 1), size - 1)) out.push([v, ...rest]);
  });
  return out;
}

function takeBallSizes(availableKinds) {
  if (availableKinds >= 3) return [3];
  return Array.from({ length: availableKinds }, (_, i) => i + 1); // 1..kinds (kinds <= 2)
}

// Discard is not enumerated (combinatorial): the hint carries the required count and
// the caller supplies a token map that the engine validates.
export function legalActions(state) {
  const player = getCurrentPlayer(state);
  if (state.phase === PHASES.FINISHED) return [];
  if (state.phase === PHASES.DISCARD) {
    return [{ type: 'discard', count: tokenCount(player) - MAX_TOKENS }];
  }
  if (state.phase === PHASES.EVOLVE) {
    return [
      ...evolveOptions(state, player).map((o) => ({ type: 'evolve', cardId: o.cardId })),
      { type: 'skipEvolve' },
    ];
  }

  const actions = [];
  const available = COLORS.filter((c) => state.supply[c] > 0);
  for (const size of takeBallSizes(available.length)) {
    for (const colors of combinations(available, size)) actions.push({ type: 'takeBalls', colors });
  }
  for (const c of COLORS) {
    if (state.supply[c] >= 4) actions.push({ type: 'takeTwo', color: c });
  }
  if (player.hand.length < MAX_HAND) {
    for (const key of RESERVABLE_TIER_KEYS) {
      for (const card of state.table[key]) {
        if (card) actions.push({ type: 'reserve', tier: Number(key), source: 'table', cardId: card.id });
      }
      if (state.decks[key].length > 0) actions.push({ type: 'reserve', tier: Number(key), source: 'deck' });
    }
  }
  const buyable = [...player.hand, ...TIER_KEYS.flatMap((k) => state.table[k].filter(Boolean))];
  for (const card of buyable) {
    const payment = computePayment(player, card);
    if (payment) actions.push({ type: 'buy', cardId: card.id, payment });
  }
  // 영웅 고유 능력 (싱글모드 전용, 게임당 1회)
  if (player.ability && !state.abilityUsed[state.current]) {
    if (player.ability === 'refreshRow') {
      for (const key of TIER_KEYS) {
        if (state.decks[key].length > 0) actions.push({ type: 'abilityRefresh', tier: key });
      }
    } else if (player.ability === 'takeFour') {
      const available = COLORS.filter((c) => state.supply[c] > 0);
      if (available.length >= 4) {
        for (const colors of combinations(available, 4)) actions.push({ type: 'abilityTake', colors });
      }
    } else if (player.ability === 'discount' || player.ability === 'masterBonus') {
      for (const card of buyable) {
        const payment = computePayment(player, card, player.ability === 'discount' ? 1 : 0);
        if (payment) actions.push({ type: 'abilityBuy', cardId: card.id, payment, ability: player.ability });
      }
    }
  }
  if (actions.length === 0) actions.push({ type: 'pass' });
  return actions;
}

// ---------- apply ----------

export function applyAction(state, action) {
  if (state.phase === PHASES.FINISHED) return fail('game_over');
  if (!action || typeof action.type !== 'string') return fail('bad_action');

  const s = structuredClone(state);
  const events = [];
  const player = getCurrentPlayer(s);
  const phaseOf = {
    takeBalls: PHASES.ACTION, takeTwo: PHASES.ACTION, reserve: PHASES.ACTION,
    buy: PHASES.ACTION, pass: PHASES.ACTION,
    abilityBuy: PHASES.ACTION, abilityTake: PHASES.ACTION, abilityRefresh: PHASES.ACTION,
    discard: PHASES.DISCARD,
    evolve: PHASES.EVOLVE, skipEvolve: PHASES.EVOLVE,
  };
  if (!(action.type in phaseOf)) return fail('unknown_action');
  if (phaseOf[action.type] !== s.phase) return fail('wrong_phase');

  let error = null;
  switch (action.type) {
    case 'takeBalls': error = doTakeBalls(s, player, action, events); break;
    case 'takeTwo': error = doTakeTwo(s, player, action, events); break;
    case 'reserve': error = doReserve(s, player, action, events); break;
    case 'buy': error = doBuy(s, player, action, events); break;
    case 'abilityBuy': error = doAbilityBuy(s, player, action, events); break;
    case 'abilityTake': error = doAbilityTake(s, player, action, events); break;
    case 'abilityRefresh': error = doAbilityRefresh(s, player, action, events); break;
    case 'pass': error = doPass(state, s, events); break;
    case 'discard': error = doDiscard(s, player, action, events); break;
    case 'evolve': error = doEvolve(s, player, action, events); break;
    case 'skipEvolve': events.push({ type: 'skipEvolve', player: s.current }); endTurn(s, events); break;
  }
  return error ? fail(error) : ok(s, events);
}

function doTakeBalls(s, player, { colors }, events) {
  if (!Array.isArray(colors) || colors.length === 0) return 'bad_colors';
  if (new Set(colors).size !== colors.length) return 'duplicate_color';
  if (colors.some((c) => !COLORS.includes(c))) return 'bad_colors';
  if (colors.some((c) => s.supply[c] < 1)) return 'supply_empty';
  const kinds = COLORS.filter((c) => s.supply[c] > 0).length;
  if (!takeBallSizes(kinds).includes(colors.length)) return 'bad_ball_count';
  for (const c of colors) {
    s.supply[c] -= 1;
    player.tokens[c] += 1;
  }
  s.passStreak = 0;
  events.push({ type: 'takeBalls', player: s.current, colors: [...colors] });
  afterAction(s, events);
  return null;
}

function doTakeTwo(s, player, { color }, events) {
  if (!COLORS.includes(color)) return 'bad_colors';
  if (s.supply[color] < 4) return 'supply_too_low';
  s.supply[color] -= 2;
  player.tokens[color] += 2;
  s.passStreak = 0;
  events.push({ type: 'takeTwo', player: s.current, color });
  afterAction(s, events);
  return null;
}

// Removes the card at table[key][idx] and refills the slot from the deck (null if empty).
function takeFromTable(s, key, idx) {
  const card = s.table[key][idx];
  s.table[key][idx] = s.decks[key].shift() ?? null;
  return card;
}

function doReserve(s, player, { source, tier, cardId }, events) {
  if (player.hand.length >= MAX_HAND) return 'hand_full';
  let card;
  if (source === 'deck') {
    const key = String(tier);
    if (!RESERVABLE_TIER_KEYS.includes(key)) return 'cannot_reserve';
    if (s.decks[key].length === 0) return 'deck_empty';
    card = s.decks[key].shift();
  } else if (source === 'table') {
    const found = findOnTable(s, cardId);
    if (!found) return 'card_not_found';
    if (!RESERVABLE_TIER_KEYS.includes(found.key)) return 'cannot_reserve';
    card = takeFromTable(s, found.key, found.idx);
  } else {
    return 'bad_source';
  }
  player.hand.push(card);
  let gotMaster = false;
  if (s.supply[MASTER] > 0) {
    s.supply[MASTER] -= 1;
    player.tokens[MASTER] += 1;
    gotMaster = true;
  }
  s.passStreak = 0;
  events.push({ type: 'reserve', player: s.current, cardId: card.id, source, gotMaster });
  afterAction(s, events);
  return null;
}

function doBuy(s, player, { cardId, payment }, events) {
  let card;
  let handIdx = player.hand.findIndex((c) => c.id === cardId);
  let found = null;
  if (handIdx >= 0) {
    card = player.hand[handIdx];
  } else {
    found = findOnTable(s, cardId);
    if (!found) return 'card_not_found';
    card = found.card;
  }
  let pay = payment;
  if (pay === undefined) {
    pay = computePayment(player, card);
    if (!pay) return 'cannot_afford';
  } else {
    const err = validatePayment(player, card, pay);
    if (err) return err;
  }
  for (const k of TOKEN_KEYS) {
    const v = pay[k] ?? 0;
    player.tokens[k] -= v;
    s.supply[k] += v;
  }
  if (handIdx >= 0) player.hand.splice(handIdx, 1);
  else takeFromTable(s, found.key, found.idx);
  player.tableau.push(card);
  s.passStreak = 0;
  events.push({ type: 'buy', player: s.current, cardId: card.id, payment: { ...pay } });
  afterAction(s, events);
  return null;
}

// ---------- hero abilities (single-player only, once per game) ----------

function checkAbility(s, player, abilityId) {
  if (player.ability !== abilityId) return 'no_ability';
  if (s.abilityUsed[s.current]) return 'ability_used';
  return null;
}

function findBuyCard(s, player, cardId) {
  const handIdx = player.hand.findIndex((c) => c.id === cardId);
  if (handIdx >= 0) return { card: player.hand[handIdx], handIdx, found: null };
  const found = findOnTable(s, cardId);
  if (!found) return null;
  return { card: found.card, handIdx: -1, found };
}

// 페르세우스 "여신의 가호" (가호 1개 할인) / 아킬레우스 "전리품" (암브로시아 1개 추가 획득)
function doAbilityBuy(s, player, { cardId, payment, ability }, events) {
  const aerr = checkAbility(s, player, ability);
  if (aerr) return aerr;
  if (ability !== 'discount' && ability !== 'masterBonus') return 'bad_ability';
  const slot = findBuyCard(s, player, cardId);
  if (!slot) return 'card_not_found';
  const discount = ability === 'discount' ? 1 : 0;
  let pay = payment;
  if (pay === undefined) {
    pay = computePayment(player, slot.card, discount);
    if (!pay) return 'cannot_afford';
  } else {
    const verr = validatePayment(player, slot.card, pay, discount);
    if (verr) return verr;
  }
  for (const k of TOKEN_KEYS) {
    const v = pay[k] ?? 0;
    player.tokens[k] -= v;
    s.supply[k] += v;
  }
  if (slot.handIdx >= 0) player.hand.splice(slot.handIdx, 1);
  else takeFromTable(s, slot.found.key, slot.found.idx);
  player.tableau.push(slot.card);
  s.abilityUsed[s.current] = true;
  let gotMaster = false;
  if (ability === 'masterBonus' && s.supply[MASTER] > 0) {
    s.supply[MASTER] -= 1;
    player.tokens[MASTER] += 1;
    gotMaster = true;
  }
  s.passStreak = 0;
  events.push({ type: 'abilityBuy', ability, player: s.current, cardId: slot.card.id, payment: { ...pay }, gotMaster });
  afterAction(s, events);
  return null;
}

// 헤라클레스 "괴력" — 가호 4종류 가져오기
function doAbilityTake(s, player, { colors }, events) {
  const aerr = checkAbility(s, player, 'takeFour');
  if (aerr) return aerr;
  if (!Array.isArray(colors) || colors.length !== 4) return 'bad_colors';
  if (new Set(colors).size !== 4) return 'duplicate_color';
  if (colors.some((c) => !COLORS.includes(c))) return 'bad_colors';
  if (colors.some((c) => s.supply[c] < 1)) return 'supply_empty';
  for (const c of colors) {
    s.supply[c] -= 1;
    player.tokens[c] += 1;
  }
  s.abilityUsed[s.current] = true;
  s.passStreak = 0;
  events.push({ type: 'abilityTake', player: s.current, colors: [...colors] });
  afterAction(s, events);
  return null;
}

// 오디세우스 "기책" — 진열된 카드 1줄 새로고침 (기존 카드는 덱 아래로)
function doAbilityRefresh(s, player, { tier }, events) {
  const aerr = checkAbility(s, player, 'refreshRow');
  if (aerr) return aerr;
  const key = String(tier);
  if (!TIER_KEYS.includes(key)) return 'bad_tier';
  if (s.decks[key].length === 0) return 'deck_empty';
  const olds = s.table[key].filter(Boolean);
  s.decks[key].push(...olds);
  s.table[key] = s.table[key].map(() => s.decks[key].shift() ?? null);
  s.abilityUsed[s.current] = true;
  s.passStreak = 0;
  events.push({ type: 'abilityRefresh', player: s.current, tier: key });
  endTurn(s, events);
  return null;
}

// A pass is only legal when no other action exists. `before` is the unmodified state.
function doPass(before, s, events) {
  const legal = legalActions(before);
  if (!(legal.length === 1 && legal[0].type === 'pass')) return 'pass_not_allowed';
  s.passStreak += 1;
  events.push({ type: 'pass', player: s.current });
  endTurn(s, events);
  if (s.passStreak >= s.config.playerCount && s.phase !== PHASES.FINISHED) {
    s.stalled = true; // a full round of passes: nobody can ever act again
    finishGame(s, events);
  }
  return null;
}

function doDiscard(s, player, { tokens }, events) {
  const need = tokenCount(player) - MAX_TOKENS;
  if (!tokens || typeof tokens !== 'object') return 'bad_discard';
  for (const k of Object.keys(tokens)) if (!TOKEN_KEYS.includes(k)) return 'bad_discard';
  for (const k of TOKEN_KEYS) {
    const v = tokens[k] ?? 0;
    if (!isCount(v) || v > player.tokens[k]) return 'bad_discard';
  }
  if (sumValues(tokens) !== need) return 'bad_discard_count';
  for (const k of TOKEN_KEYS) {
    const v = tokens[k] ?? 0;
    player.tokens[k] -= v;
    s.supply[k] += v;
  }
  events.push({ type: 'discard', player: s.current, tokens: { ...tokens } });
  toEvolvePhase(s, events);
  return null;
}

function doEvolve(s, player, { cardId }, events) {
  const option = evolveOptions(s, player).find((o) => o.cardId === cardId);
  if (!option) return 'cannot_evolve';
  let next;
  if (option.from === 'hand') {
    next = player.hand.splice(player.hand.findIndex((c) => c.id === option.nextId), 1)[0];
  } else {
    const found = findOnTable(s, option.nextId);
    next = takeFromTable(s, found.key, found.idx);
  }
  const idx = player.tableau.findIndex((c) => c.id === cardId);
  const [old] = player.tableau.splice(idx, 1, next);
  player.evolved.push(old);
  events.push({ type: 'evolve', player: s.current, from: old.id, to: next.id, source: option.from });
  endTurn(s, events);
  return null;
}

// ---------- turn flow ----------

function afterAction(s, events) {
  if (tokenCount(getCurrentPlayer(s)) > MAX_TOKENS) {
    s.phase = PHASES.DISCARD;
  } else {
    toEvolvePhase(s, events);
  }
}

function toEvolvePhase(s, events) {
  if (evolveOptions(s, getCurrentPlayer(s)).length > 0) s.phase = PHASES.EVOLVE;
  else endTurn(s, events);
}

// End-of-turn: trigger check runs AFTER evolution (evolving removes points).
function endTurn(s, events) {
  if (s.endTriggeredBy === null && getPoints(getCurrentPlayer(s)) >= WIN_POINTS) {
    s.endTriggeredBy = s.current;
    events.push({ type: 'endTriggered', player: s.current });
  }
  const next = (s.current + 1) % s.config.playerCount;
  if (s.endTriggeredBy !== null && next === s.startPlayer) {
    finishGame(s, events);
    return;
  }
  s.current = next;
  s.turn += 1;
  s.phase = PHASES.ACTION;
}

function finishGame(s, events) {
  s.phase = PHASES.FINISHED;
  s.ranking = getRanking(s);
  events.push({ type: 'gameEnd', ranking: s.ranking, stalled: s.stalled });
}
