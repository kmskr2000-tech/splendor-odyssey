// UI controller: holds the engine state plus transient selection state. No DOM access here,
// so it can be unit-tested and driven headlessly. All rules live in the engine; this layer
// only translates taps into engine actions and surfaces engine error codes.

import {
  COLORS, MASTER, PHASES, MAX_HAND,
  createGame, applyAction, legalActions, computePayment, evolveOptions, getCurrentPlayer, tokenCount,
} from '../core/index.js?v=1791283426';
import { chooseAction } from '../ai/heuristic.js?v=1791283426';
import { abilityOf, abilityInfo, PLAYABLE_HEROES, isBoss, personalityOf, ABILITY_IDS } from '../data/heroes.js?v=1791283426';
import { TIERS, effectiveDifficulty } from '../data/league.js?v=1791283426';

export const BALLS = {
  monster: { file: 'ball-thunder', ext: 'webp', name: '천둥의 가호', short: '천둥' },
  super: { file: 'ball-sea', ext: 'webp', name: '바다의 가호', short: '바다' },
  hyper: { file: 'ball-earth', ext: 'webp', name: '대지의 가호', short: '대지' },
  heal: { file: 'ball-life', ext: 'webp', name: '생명의 가호', short: '생명' },
  quick: { file: 'ball-sun', ext: 'webp', name: '태양의 가호', short: '태양' },
  master: { file: 'ball-divine', ext: 'webp', name: '암브로시아', short: '신성' },
};

export const TRAINERS = PLAYABLE_HEROES;

const ERROR_TEXT = {
  bad_ball_count: '서로 다른 가호 3개를 골라주세요 (남은 종류가 적으면 그만큼만).',
  supply_empty: '공급처에 없는 가호예요.',
  supply_too_low: '같은 가호 2개는 공급처에 4개 이상 남아야 해요.',
  hand_full: '찜한 카드는 최대 3장이에요.',
  cannot_reserve: '희귀·전설 카드는 찜할 수 없어요.',
  deck_empty: '덱에 카드가 없어요.',
  cannot_afford: '가호가 부족해서 영입할 수 없어요.',
  master_required: '희귀·전설은 암브로시아이 1개 필요해요.',
  bad_discard_count: '반환할 개수가 맞지 않아요.',
  discard_full: '필요한 개수를 다 골랐어요. 바꾸려면 − 로 줄이세요.',
  discard_owned: '가진 가호보다 많이 반환할 수 없어요.',
  cannot_evolve: '신격화할 수 없어요.',
  pass_not_allowed: '아직 할 수 있는 행동이 있어요.',
};

export const errorText = (code) => ERROR_TEXT[code] ?? `실행할 수 없어요 (${code})`;

// 유효 AI 난이도 = clamp(티어 베이스 + 플레이어 보정). 승급전은 보스 고정 강도.
function effectiveAiDifficulty({ leagueTier, difficulty, promotion }) {
  if (promotion) return 'hard';
  if (leagueTier) return effectiveDifficulty(leagueTier.ai, difficulty);
  return effectiveDifficulty('normal', difficulty); // 일반전 베이스 normal
}

// `resume` ({ game, log }) restores a saved game instead of dealing a new one.
// `hooks.onCatch(cardId, kind)` fires for the human's captures/evolutions, `hooks.onChange()` after
// every accepted action, `hooks.onEnd(won)` once when the game finishes (persistence lives outside).
// leagueTier: 올림포스 리그전 티어 객체 (AI 로스터·성격·난이도 적용). 멀티플레이어에서는 절대 사용하지 않음.
// promotion: { to: 승급 목표 티어 id, boss: 보스 이름 } | null — 승급전(보스전) 모드.
export function createController({ cards, seed, humanName = '나', aiNames = ['오디세우스', '헤라클레스', '아킬레우스'], resume = null, hooks = {}, difficulty = 'normal', challenge = null, mp = null, leagueTier = null, promotion = null }) {
  const cardsById = new Map(cards.map((c) => [c.id, c]));
  // mp: { names: [...humanNames], me: index, aiNames: [...] } — multiplayer.
  // Humans first, then AI seats (acted by the host, relayed to guests).
  const mpPlayers = mp ? [
    ...mp.names.map((name) => ({ name, isAI: false })),
    ...((mp.aiNames || []).map((name) => ({ name, isAI: true }))),
  ] : null;
  const playerCount = mpPlayers ? mpPlayers.length : 1 + aiNames.length;
  // 영웅 능력: 싱글모드 전용 (멀티는 완전 바닐라).
  // - 플레이어: 영웅 선택 시 고유 능력, "나"는 4종 중 랜덤 (seed 기반)
  // - AI: 보스만 사용
  const randAbility = ABILITY_IDS[seed % ABILITY_IDS.length];
  const abilityFor = (name, isAI) => {
    if (mp) return null;
    if (!isAI) return name === '나' ? randAbility : abilityOf(name);
    return isBoss(name) ? abilityOf(name) : null;
  };
  const game = resume?.game ?? createGame({
    cards,
    seed,
    players: mpPlayers ?? [{ name: humanName, isAI: false, ability: abilityFor(humanName, false) }, ...aiNames.map((name) => ({ name, isAI: true, ability: abilityFor(name, true) }))],
  });
  // 구버전 세이브 마이그레이션 (abilityUsed/ability 필드 없음)
  if (!Array.isArray(game.abilityUsed)) game.abilityUsed = game.players.map(() => false);
  for (const p of game.players) if (!('ability' in p)) p.ability = null;
  // createGame only copies whitelisted fields; re-attach the remote flag for mp humans.
  if (mp) game.players.forEach((p, i) => { p.remote = !p.isAI && i !== mp.me; });

  const ctrl = {
    game,
    cardsById,
    human: mp ? mp.me : 0,
    mp: mp ? { names: mp.names, me: mp.me } : null, // multiplayer session info
    balls: [], // selected supply colors (a repeated color means "take two")
    discard: {}, // token map selected for return
    sheet: null, // { kind: 'card', cardId } | { kind: 'deck', tier } | { kind: 'opp', playerId }
    message: '', // last engine error shown in the hint bar
    lastAIEvent: null, // most recent AI action event (for the action toast)
    log: resume?.log ? resume.log.slice(-6) : [], // recent human-readable events, newest last
    seed,
    humanName,
    aiNames,
    difficulty: resume?.difficulty ?? difficulty,
    // 리그전: AI 난이도는 티어 베이스 × 플레이어 선택. 승급전은 보스 고정 강도(hard).
    // 보상 배율에만 플레이어 선택 난이도 사용.
    aiDifficulty: resume?.aiDifficulty ?? effectiveAiDifficulty({ leagueTier, difficulty, promotion }),
    leagueMode: resume?.leagueMode ?? !!leagueTier,
    // 승급전(보스전): { to, boss } | null. 1등 승리 시 to 티어로 승급.
    promotion: resume?.promotion ?? promotion,
    get promotionMatch() { return !!this.promotion; },
    challenge: resume?.challenge ?? challenge,
    challengeDone: null, // 'won' | 'lost' once the challenge resolves
    humanTurns: 0, // completed turns by the human (for challenge limits)
    // 일일/주간 도전 집계용 (인간 행동만)
    track: resume?.track ?? { reserve: 0, take: {} },
    // 영웅 능력 armed 상태 (UI가 켜고 끔)
    abilityArmed: null,
    // Secret AI personalities: shuffled per game, hidden from the player.
    // 리그전은 티어 로스터의 고정 성격, 일반전은 27 캐릭터 풀의 고정 성격 사용.
    aiPersonalities: resume?.aiPersonalities ?? (leagueTier
      ? Array.from({ length: playerCount }, (_, i) => (i === 0 ? 'balanced' : leagueTier.roster[i - 1].personality))
      : ['balanced', ...aiNames.map(personalityOf)]),
    errors: 0, // failed applyAction calls (tests assert 0 for UI-generated actions)

    get state() { return this.game; },
    get me() { return this.game.players[this.human]; },
    get current() { return getCurrentPlayer(this.game); },
    get finished() { return this.game.phase === PHASES.FINISHED; },
    get isHumanTurn() { return !this.finished && this.game.current === this.human; },
    get lastRound() { return this.game.endTriggeredBy !== null && !this.finished; },
    get discardNeed() { return Math.max(0, tokenCount(this.me) - 10); },

    // ---- queries used by the view ----
    pendingAction() {
      const b = this.balls;
      if (b.length === 0) return null;
      if (b.length === 2 && b[0] === b[1]) return { type: 'takeTwo', color: b[0] };
      if (this.abilityArmed === 'takeFour' && b.length === 4 && new Set(b).size === 4) {
        return { type: 'abilityTake', colors: [...b] };
      }
      return { type: 'takeBalls', colors: [...b] };
    },
    pendingValid() {
      const a = this.pendingAction();
      return !!a && this.isHumanTurn && this.game.phase === PHASES.ACTION && applyAction(this.game, a).ok;
    },
    pendingError() {
      const a = this.pendingAction();
      if (!a) return null;
      const res = applyAction(this.game, a);
      return res.ok ? null : res.error;
    },
    canPass() {
      const legal = legalActions(this.game);
      return this.isHumanTurn && this.game.phase === PHASES.ACTION && legal.length === 1 && legal[0].type === 'pass';
    },
    payment(cardId) {
      const card = this.cardsById.get(cardId);
      return card ? computePayment(this.me, card) : null;
    },
    canBuy(cardId) {
      return this.isHumanTurn && this.game.phase === PHASES.ACTION && !!this.payment(cardId);
    },
    // Affordable if the currently selected balls were taken (blue highlight:
    // "buyable next turn"). False when already buyable now or nothing selected.
    canBuyAfterTake(cardId) {
      if (!this.isHumanTurn || this.game.phase !== PHASES.ACTION || !this.balls.length) return false;
      if (this.canBuy(cardId)) return false;
      const card = this.cardsById.get(cardId);
      if (!card) return false;
      const hypo = { ...this.me, tokens: { ...this.me.tokens } };
      for (const c of this.balls) hypo.tokens[c] = (hypo.tokens[c] || 0) + 1;
      return !!computePayment(hypo, card);
    },
    canReserve() {
      return this.isHumanTurn && this.game.phase === PHASES.ACTION && this.me.hand.length < MAX_HAND;
    },
    evolveChoices() {
      return this.isHumanTurn && this.game.phase === PHASES.EVOLVE ? evolveOptions(this.game, this.me) : [];
    },
    evolvableIds() {
      return new Set(evolveOptions(this.game, this.me).map((o) => o.cardId));
    },
    discardCount() {
      return Object.values(this.discard).reduce((a, b) => a + b, 0);
    },
    zone(cardId) {
      if (this.me.hand.some((c) => c.id === cardId)) return 'hand';
      return 'table';
    },

    // ---- hero abilities (single-player only) ----
    canUseAbility() {
      return !this.mp && this.isHumanTurn && this.game.phase === PHASES.ACTION
        && !!this.me.ability && !this.game.abilityUsed[this.human];
    },
    abilityUsedUp() {
      return !!this.game.abilityUsed[this.human];
    },
    armAbility() {
      if (this.canUseAbility()) { this.abilityArmed = this.me.ability; this.sheet = null; this.message = ''; }
    },
    disarmAbility() {
      this.abilityArmed = null;
      this.message = '';
    },
    // 능력으로 영입 시 지불액 (페르세우스 할인 적용)
    paymentAbility(cardId) {
      const card = this.cardsById.get(cardId);
      if (!card || this.abilityArmed !== 'discount') return null;
      return computePayment(this.me, card, 1);
    },
    canBuyAbility(cardId) {
      if (this.abilityArmed !== 'discount' && this.abilityArmed !== 'masterBonus') return false;
      if (!this.isHumanTurn || this.game.phase !== PHASES.ACTION) return false;
      const card = this.cardsById.get(cardId);
      if (!card) return false;
      return !!computePayment(this.me, card, this.abilityArmed === 'discount' ? 1 : 0);
    },
    abilityTakeFour() {
      if (this.abilityArmed !== 'takeFour') return null;
      return this.dispatch({ type: 'abilityTake', colors: [...this.balls] });
    },
    abilityRefresh(tier) {
      if (this.abilityArmed !== 'refreshRow') return null;
      return this.dispatch({ type: 'abilityRefresh', tier });
    },

    // ---- selection ----
    toggleBall(color) {
      if (!this.isHumanTurn || this.game.phase !== PHASES.ACTION || color === MASTER) return;
      this.message = '';
      this.sheet = null;
      const supply = this.game.supply[color];
      const b = this.balls;
      const isTwo = b.length === 2 && b[0] === b[1];
      if (isTwo) {
        this.balls = b[0] === color ? [] : supply > 0 ? [color] : [];
        if (b[0] !== color && supply === 0) this.message = errorText('supply_empty');
        return;
      }
      if (b.includes(color)) {
        if (b.length === 1 && supply >= 4) this.balls = [color, color];
        else this.balls = b.filter((c) => c !== color);
        return;
      }
      if (supply < 1) { this.message = errorText('supply_empty'); return; }
      const maxBalls = this.abilityArmed === 'takeFour' ? 4 : 3;
      if (b.length >= maxBalls) { this.message = errorText('bad_ball_count'); return; }
      this.balls = [...b, color];
    },
    clearSelection() {
      this.balls = [];
      this.discard = {};
      this.message = '';
    },
    // Tap = +1 (never wraps back to 0 — that surprised players). `undoDiscard` takes one back.
    toggleDiscard(token) {
      if (!this.isHumanTurn || this.game.phase !== PHASES.DISCARD) return;
      const owned = this.me.tokens[token];
      const cur = this.discard[token] || 0;
      if (this.discardCount() >= this.discardNeed) { this.message = errorText('discard_full'); return; }
      if (cur >= owned) { this.message = errorText('discard_owned'); return; }
      this.message = '';
      this.discard = { ...this.discard, [token]: cur + 1 };
    },
    undoDiscard(token) {
      if (!this.isHumanTurn || this.game.phase !== PHASES.DISCARD) return;
      const cur = this.discard[token] || 0;
      if (cur > 0) this.discard = { ...this.discard, [token]: cur - 1 };
      this.message = '';
    },

    openCard(cardId) {
      if (!this.isHumanTurn || this.game.phase !== PHASES.ACTION) return;
      this.balls = [];
      this.message = '';
      this.sheet = { kind: 'card', cardId };
    },
    openDeck(tier) {
      if (!this.isHumanTurn || this.game.phase !== PHASES.ACTION) return;
      this.balls = [];
      this.message = '';
      this.sheet = { kind: 'deck', tier };
    },
    openOpp(playerId) {
      this.sheet = { kind: 'opp', playerId: Number(playerId) };
    },
    viewCard(cardId, from = null) {
      if (this.cardsById.has(cardId)) this.sheet = { kind: 'view', cardId, from };
    },
    closeSheet() { this.sheet = null; },

    // ---- actions (all go through the engine) ----
    dispatch(action) {
      const actor = this.game.current;
      const turnBefore = this.game.turn;
      const res = applyAction(this.game, action);
      if (!res.ok) {
        this.errors += 1;
        this.message = errorText(res.error);
        return res;
      }
      this.game = res.state;
      if (actor === this.human && this.game.turn > turnBefore) this.humanTurns += 1;
      this.balls = [];
      this.discard = {};
      this.sheet = null;
      this.message = '';
      this.abilityArmed = null; // 능력 armed는 어떤 행동 후에도 해제
      // 일일/주간 도전 집계 (인간의 가호 획득·찜만 추적)
      if (actor === this.human) {
        for (const ev of res.events) {
          if (ev.type === 'reserve') this.track.reserve += 1;
          else if (ev.type === 'takeBalls' || ev.type === 'abilityTake') {
            for (const c of ev.colors) this.track.take[c] = (this.track.take[c] || 0) + 1;
          } else if (ev.type === 'takeTwo') {
            this.track.take[ev.color] = (this.track.take[ev.color] || 0) + 2;
          }
        }
      }
      for (const ev of res.events) {
        const line = describeEvent(ev, this);
        if (line) this.log.push(line);
        if (ev.player !== this.human && ['takeBalls', 'takeTwo', 'buy', 'reserve', 'evolve', 'abilityBuy', 'abilityTake', 'abilityRefresh'].includes(ev.type)) {
          this.lastAIEvent = ev;
        }
      }
      if (this.log.length > 6) this.log = this.log.slice(-6);
      for (const ev of res.events) {
        if (ev.player !== this.human) continue;
        if (ev.type === 'buy') hooks.onCatch?.(ev.cardId, 'buy');
        else if (ev.type === 'evolve') hooks.onCatch?.(ev.to, 'evolve');
      }
      if (this.finished) hooks.onEnd?.(this.game.ranking[0].player === this.human);
      hooks.onChange?.();
      return res;
    },
    confirmBalls() { const a = this.pendingAction(); return a ? this.dispatch(a) : null; },
    buy(cardId) {
      if (this.abilityArmed === 'discount' || this.abilityArmed === 'masterBonus') {
        return this.dispatch({ type: 'abilityBuy', cardId, ability: this.abilityArmed });
      }
      return this.dispatch({ type: 'buy', cardId });
    },
    reserveCard(cardId) {
      const card = this.cardsById.get(cardId);
      return this.dispatch({ type: 'reserve', tier: Number(card.tier), source: 'table', cardId });
    },
    reserveDeck(tier) { return this.dispatch({ type: 'reserve', tier: Number(tier), source: 'deck' }); },
    confirmDiscard() { return this.dispatch({ type: 'discard', tokens: { ...this.discard } }); },
    evolve(cardId) { return this.dispatch({ type: 'evolve', cardId }); },
    skipEvolve() { return this.dispatch({ type: 'skipEvolve' }); },
    pass() { return this.dispatch({ type: 'pass' }); },

    snapshot() {
      return { seed: this.seed, humanName: this.humanName, aiNames: this.aiNames, difficulty: this.difficulty, aiDifficulty: this.aiDifficulty, leagueMode: this.leagueMode, promotion: this.promotion, aiPersonalities: this.aiPersonalities, challenge: this.challenge, log: this.log, track: this.track, game: this.game };
    },

    // Grants the challenge's starting tokens/tableau (puzzle setup).
    applyChallengeSetup(ch) {
      const me = this.me;
      for (const [k, n] of Object.entries(ch.startTokens || {})) me.tokens[k] = (me.tokens[k] || 0) + n;
      for (const id of ch.startTableau || []) {
        for (const key of Object.keys(this.game.decks)) {
          const idx = this.game.decks[key].findIndex((c) => c.id === id);
          if (idx >= 0) { me.tableau.push(...this.game.decks[key].splice(idx, 1)); break; }
        }
      }
    },

    // One opponent action. Returns false when it is not an AI turn.
    stepAI(rnd) {
      if (this.finished || this.game.players[this.game.current].isAI !== true) return false;
      this.dispatch(chooseAction(this.game, rnd, this.aiDifficulty, this.aiPersonalities[this.game.current]));
      return true;
    },
  };
  return ctrl;
}

export function evoText(card, cardsById) {
  if (!card.evolvesTo) {
    if (card.tier === 'rare' || card.tier === 'legend') return '가호 2개 · 암브로시아 필수';
    return card.tier === 3 ? '최종 신격화' : '신격화 없음';
  }
  const next = cardsById.get(card.evolvesTo);
  const req = COLORS.filter((c) => card.evolveReq?.[c]).map((c) => `${BALLS[c].short} 가호 ${card.evolveReq[c]}`).join(' ');
  return `→ ${next?.name ?? '?'}<br>(${req})`;
}

export function describeEvent(ev, ctrl) {
  const who = ctrl.game.players[ev.player]?.name;
  const name = (id) => ctrl.cardsById.get(id)?.name ?? id;
  const balls = (map) => COLORS.concat(MASTER).filter((k) => map[k]).map((k) => `${BALLS[k].name}${map[k] > 1 ? ` ${map[k]}` : ''}`).join('·');
  switch (ev.type) {
    case 'takeBalls': return `${who}: ${ev.colors.map((c) => BALLS[c].name).join('·')} 가져감`;
    case 'takeTwo': return `${who}: ${BALLS[ev.color].name} 2개 가져감`;
    case 'abilityTake': { const ab = abilityInfo(who); return `${who}: ${ab?.name ?? '능력'}! ${ev.colors.map((c) => BALLS[c].name).join('·')} 가져감`; }
    case 'abilityRefresh': { const ab = abilityInfo(who); return `${who}: ${ab?.name ?? '능력'}! 카드 진열 새로고침`; }
    case 'reserve': return `${who}: ${ev.source === 'deck' ? '덱 위 카드를' : `${name(ev.cardId)}을(를)`} 찜`;
    case 'buy': return `${who}: ${name(ev.cardId)} 영입!`;
    case 'abilityBuy': { const ab = abilityInfo(who); return `${who}: ${name(ev.cardId)} 영입! (${ab?.name ?? '능력'}${ev.gotMaster ? ' +암브로시아' : ''})`; }
    case 'discard': return `${who}: ${balls(ev.tokens)} 반환`;
    case 'evolve': return `${who}: ${name(ev.from)} → ${name(ev.to)} 신격화!`;
    case 'pass': return `${who}: 차례 넘김`;
    case 'endTriggered': return `${who}가 18점 달성! 마지막 라운드`;
    case 'gameEnd': return '게임 종료';
    default: return null;
  }
}
