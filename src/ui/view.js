// Pure HTML-string renderers. Each takes the controller and returns markup; main.js owns the DOM.
// All text interpolated here comes from our own card data / constants (no user input).

import { COLORS, MASTER, PHASES, TOKEN_KEYS } from '../core/constants.js';
import { getBonuses, getPoints, tokenCount, bonusList, isSpecial } from '../core/engine.js';
import { BALLS, TRAINERS, evoText } from './controller.js';
import { dexSummary } from '../storage/store.js';
import { abilityInfo, isBoss } from '../data/heroes.js';

import { ACHIEVEMENTS } from '../data/achievements.js';
import { CHALLENGES, challengeProgress } from '../data/challenges.js';

const diffLabel = { easy: '쉬움', normal: '보통', hard: '어려움' };

const ASSET = 'assets';
const AV = (typeof window !== 'undefined' && window.__V) ? `?v=${window.__V}` : '';
export const ballSrc = (key) => `${ASSET}/items/${BALLS[key].file}.${BALLS[key].ext || 'png'}${AV}`;
const mythSrc = (id) => `${ASSET}/myth/${id}.webp${AV}`;

const ballImg = (key, cls = 'miniball') => `<img class="${cls}" src="${ballSrc(key)}" alt="${BALLS[key].name}">`;
// 캐릭터 얼굴 (플레이어블 4영웅 + 승급전 보스 5명 + 구 영웅 3명은 리그 상대로 재사용)
const HERO_FACE = {
  '오디세우스': 'hero-odysseus',
  '헤라클레스': 'hero-heracles',
  '아킬레우스': 'hero-achilles',
  '페르세우스': 'hero-perseus',
  '미노타우로스': 'hero-minotaur',
  '메두사': 'hero-medusa',
  '히드라': 'hero-hydra',
  '아가멤논': 'hero-agamemnon',
  '제우스': 'hero-zeus',
  '다이달로스': 'hero-daidalos',
  '파트로클로스': 'hero-patroklos',
  '네스토르': 'hero-nestor',
  // 신의 여정 보스 (오디세우스 편)
  '키르케': 'boss-kirke',
  '스킬라': 'boss-skylla',
  '포세이돈': 'boss-poseidon',
};
export const heroFaceSrc = (name) => HERO_FACE[name] ? `${ASSET}/heroes/${HERO_FACE[name]}.webp${AV}` : null;
// 플레이어("나") 아바타: -1 = 랜덤(게임마다), 0~3 = 고정
export const playerAvatarSrc = (idx) => `${ASSET}/heroes/player-${(idx % 4) + 1}.webp`;
export const resolvePlayerAvatar = (options, seed = 0) => {
  const pick = options?.playerAvatar ?? -1;
  return playerAvatarSrc(pick === -1 ? seed % 4 : pick);
};
// 스토리 보스 여부 (게임 화면에서 BOSS 태그·금테두리용)
export const bossOf = (ctrl, p) => !!(ctrl?.boss && ctrl.boss === p?.name);
// Escape user-supplied text (multiplayer names). Card data is trusted; names are not.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const staticSprite = (card, cls = 'tiny') => `<img class="${cls}" src="${mythSrc(card.id)}" alt="">`;
const animSprite = (card) =>
  `<img class="sprite" src="${ASSET}/anim/${card.id}.gif" onerror="this.onerror=null;this.src='${mythSrc(card.id)}'" alt="${card.name}">`;

const tierLabel = { 1: '1단계', 2: '2단계', 3: '3단계', rare: '희귀', legend: '전설' };

// ---------- cards ----------

export function cardHTML(card, ctrl, { zone = 'table', buyable = false, buyableNext = false, animated = true, interactive = true } = {}) {
  const bonuses = bonusList(card);
  const special = isSpecial(card);
  const cost = COLORS.filter((c) => card.cost[c])
    .map((c) => `<span class="costchip">${ballImg(c)}${card.cost[c]}</span>`).join('')
    + (special ? `<span class="costchip">${ballImg(MASTER)}1</span>` : '');
  const classes = ['card', `b-${bonuses[0]}`, special ? card.tier : '', buyable ? 'buyable' : '', buyableNext && !buyable ? 'buyable-next' : ''].filter(Boolean).join(' ');
  const tag = special ? `<span class="tag ${card.tier}">${tierLabel[card.tier]}</span><br>` : '';
  const attrs = interactive ? `data-action="card" data-card="${card.id}" data-zone="${zone}"` : 'disabled';
  return `<button class="${classes}" ${attrs}>
    ${card.points ? `<span class="pts">${card.points}</span>` : ''}
    <span class="bonusicons">${bonuses.map((b) => ballImg(b, 'bonusdotimg')).join('')}</span>
    ${animated ? animSprite(card) : `<img class="sprite" src="${mythSrc(card.id)}" alt="${card.name}">`}
    <span class="nm">${tag}${card.name}</span>
    <span class="cost">${cost}</span>
    <span class="evo">${evoText(card, ctrl.cardsById)}</span>
  </button>`;
}

const emptySlot = () => '<div class="card empty"></div>';

function tierRow(ctrl, key) {
  const s = ctrl.state;
  const reservableDeck = ['1', '2', '3'].includes(key);
  const deckN = s.decks[key].length;
  const canDeck = reservableDeck && ctrl.canReserve() && deckN > 0;
  const deck = `<button class="deck px" ${canDeck ? `data-action="deck" data-tier="${key}"` : 'disabled'}>
      <b>${deckN}</b>${tierLabel[key]}</button>`;
  const cards = s.table[key].map((card) => (card ? cardHTML(card, ctrl, { buyable: ctrl.canBuy(card.id), buyableNext: ctrl.canBuyAfterTake(card.id) }) : emptySlot())).join('');
  return { deck, cards };
}

export function boardHTML(ctrl) {
  const rows = ['3', '2', '1'].map((key) => {
    const { deck, cards } = tierRow(ctrl, key);
    return `<div class="tier-row">${deck}<div class="cards">${cards}</div></div>`;
  }).join('');
  const rare = tierRow(ctrl, 'rare');
  const legend = tierRow(ctrl, 'legend');
  return `${rows}<div class="tier-row special">
    <div class="half">${rare.deck}<div class="cards">${rare.cards}</div></div>
    <div class="half">${legend.deck}<div class="cards">${legend.cards}</div></div>
  </div>`;
}

// ---------- header / opponents ----------

export function headerHTML(ctrl) {
  const s = ctrl.state;
  let badge;
  if (ctrl.finished) badge = '게임 종료';
  else if (ctrl.isHumanTurn) badge = '▶ 당신의 차례';
  else badge = `${ctrl.current.name} 차례`;
  const last = ctrl.lastRound ? `<div class="lastround">마지막 라운드! ${s.players[s.endTriggeredBy].name}이(가) 18점 달성</div>` : '';
  const netbadge = ctrl.mp ? `<div class="netbadge">📡 대전 ${ctrl.mp.names.length}인</div>` : '';
  return `<div class="header">
      <div class="title">Odyssey: The Card<small>오디세이아 · DOT EDITION</small></div>
      <button class="rulesbtn" data-action="rules">룰 설명</button>
      <button class="rulesbtn opt" data-action="options" aria-label="설정">⚙</button>
      ${netbadge}
      <div class="turn ${ctrl.isHumanTurn ? 'mine' : ''}">${badge}</div>
    </div>${last}`;
}

const bonusPips = (p) => {
  const b = getBonuses(p);
  return COLORS.map((c) => `<span class="pip d-${c}" title="${BALLS[c].name}">${b[c]}</span>`).join('');
};

export function opponentsHTML(ctrl) {
  const s = ctrl.state;
  return s.players.filter((p) => p.id !== ctrl.human).map((p) => {
    const tk = TOKEN_KEYS.filter((k) => p.tokens[k] > 0)
      .map((k) => `<span class="otp">${ballImg(k, 'mini2')}${p.tokens[k]}</span>`).join('');
    return `
    <button class="opp px ${s.current === p.id && !ctrl.finished ? 'active' : ''}" data-action="opp" data-id="${p.id}">
      <div class="nm">${heroFaceSrc(p.name) ? `<img class="tface${bossOf(ctrl, p) ? ' bossface' : ''}" src="${heroFaceSrc(p.name)}" alt="">` : ''}${bossOf(ctrl, p) ? '👹 BOSS ' : (p.isAI ? 'AI ' : '📡 ')}${esc(p.name)}</div>
      <div class="sc">${getPoints(p)}</div>
      <div class="olbl2">가호(할인)</div>
      <div class="pips">${bonusPips(p)}</div>
      <div class="olbl2">가진 가호</div>
      <div class="otks2">${tk || '<span class="none">없음</span>'}</div>
      <div class="meta">찜 ${p.hand.length} · 영입 ${p.tableau.length}<br><span class="more">눌러서 자세히</span></div>
    </button>`;
  }).join('');
}

// ---------- supply ----------

export function supplyHTML(ctrl) {
  const s = ctrl.state;
  const sel = (c) => ctrl.balls.filter((x) => x === c).length;
  const canPick = ctrl.isHumanTurn && s.phase === PHASES.ACTION;
  return TOKEN_KEYS.map((k) => {
    const n = sel(k);
    const empty = s.supply[k] === 0;
    const pickable = canPick && k !== MASTER;
    return `<button class="ball ${n ? 'sel' : ''} ${empty ? 'empty' : ''}" ${pickable ? `data-action="ball" data-color="${k}"` : 'disabled'}>
      <span class="ballwrap">${ballImg(k, 'ballspr')}${n ? `<span class="selcount">×${n}</span>` : ''}</span>
      <span class="bnm">${BALLS[k].name}</span><span class="cnt">${s.supply[k]}개</span></button>`;
  }).join('');
}

// ---------- my area ----------

function tokensHTML(ctrl) {
  const me = ctrl.me;
  const discarding = ctrl.isHumanTurn && ctrl.state.phase === PHASES.DISCARD;
  return TOKEN_KEYS.map((k) => {
    const d = ctrl.discard[k] || 0;
    const attr = discarding && me.tokens[k] > 0 ? `data-action="discard" data-token="${k}"` : 'disabled';
    const minus = discarding && d ? `<button class="tkminus" data-action="undiscard" data-token="${k}" aria-label="${BALLS[k].name} 반환 취소">−</button>` : '';
    return `<span class="tkwrap"><button class="mytk ${d ? 'dsel' : ''}" ${attr}>${ballImg(k, 'mytkimg')}<span>${me.tokens[k]}</span>${d ? `<em>-${d}</em>` : ''}</button>${minus}</span>`;
  }).join('');
}

function tableauHTML(ctrl) {
  const me = ctrl.me;
  if (!me.tableau.length) return '<div class="empty-note">아직 영입한 존재가 없어요</div>';
  const evolvable = ctrl.evolvableIds();
  const groups = COLORS.map((c) => {
    const list = me.tableau.filter((card) => bonusList(card)[0] === c);
    if (!list.length) return '';
    return `<div class="grp g-${c}">${list.map((card) => `
      <button class="mp ${evolvable.has(card.id) ? 'evolvable' : ''}" data-action="view-card" data-card="${card.id}">${staticSprite(card)}
        <span>${card.name}${card.points ? ` <i>${card.points}점</i>` : ''}</span>
        ${bonusList(card).map((b) => ballImg(b, 'mini2')).join('')}
        ${evolvable.has(card.id) ? '<span class="ev">신격화 가능!</span>' : ''}</button>`).join('')}</div>`;
  });
  return groups.join('');
}

function handHTML(ctrl) {
  const me = ctrl.me;
  if (!me.hand.length) return '<div class="empty-note">찜한 카드 없음 (최대 3장)</div>';
  return me.hand.map((card) => `
    <button class="rsv ${ctrl.canBuy(card.id) ? 'buyable' : ctrl.canBuyAfterTake(card.id) ? 'buyable-next' : ''}" data-action="card" data-card="${card.id}" data-zone="hand" ${ctrl.isHumanTurn ? '' : 'disabled'}>
      ${staticSprite(card)}${card.name} <small>${tierLabel[card.tier]}${card.points ? ` · ${card.points}점` : ''}</small></button>`).join('');
}

export function meHTML(ctrl) {
  const me = ctrl.me;
  const b = getBonuses(me);
  const tc = tokenCount(me);
  const av = ctrl.playerAvatar ? `<img class="tface" src="${ctrl.playerAvatar}" alt="">` : '';
  return `<div class="row1">
      <div class="who">${av}${me.name}<span class="sc">${getPoints(me)}점</span></div>
      <div class="tkcount ${tc >= 10 ? 'full' : ''}">가호 ${tc}/10</div>
      <div class="evcount">신격화 ${me.evolved.length}회</div>
    </div>
    <div class="mytokens">${tokensHTML(ctrl)}</div>
    <div class="lbl">■ 가호 (할인)</div>
    <div class="pips big">${COLORS.map((c) => `<span class="pip d-${c}">${ballImg(c, 'mini2')}${b[c]}</span>`).join('')}</div>
    <div class="lbl">■ 영입한 존재 (${me.tableau.length})</div>
    <div class="mypoke">${tableauHTML(ctrl)}</div>
    <div class="lbl">■ 찜한 카드 (${me.hand.length}/3)</div>
    <div class="reserved">${handHTML(ctrl)}</div>`;
}

// ---------- action bar ----------

export function actionBarHTML(ctrl) {
  const s = ctrl.state;
  if (ctrl.finished) return '<div class="hint">게임이 끝났어요.</div>';
  if (!ctrl.isHumanTurn) {
    return aiToastHTML(ctrl) || `<div class="hint">${ctrl.current.name}이(가) 생각 중…</div>`;
  }
  const err = ctrl.message ? `<div class="hint err">${ctrl.message}</div>` : '';
  if (s.phase === PHASES.DISCARD) {
    const need = ctrl.discardNeed;
    const have = ctrl.discardCount();
    return `<div class="hint">가호가 10개를 넘었어요. 내 가호를 눌러 <b>${need}개</b> 반환하세요. 누를 때마다 +1, 빨간 − 로 되돌려요. (${have}/${need})</div>${err}
      <div class="btnrow"><button class="btn ghost" data-action="clear">초기화</button>
      <button class="btn primary" data-action="confirm-discard" ${have === need ? '' : 'disabled'}>${need}개 반환</button></div>`;
  }
  if (s.phase === PHASES.EVOLVE) {
    const opts = ctrl.evolveChoices().map((o) => {
      const from = ctrl.cardsById.get(o.cardId);
      const to = ctrl.cardsById.get(o.nextId);
      return `<button class="btn evo" data-action="evolve" data-card="${o.cardId}">${from.name} → ${to.name} 신격화</button>`;
    }).join('');
    return `<div class="hint evohint">신격화할 수 있어요! 한 장만 골라 신격화하거나 건너뛰세요.</div>${err}
      <div class="btnrow col">${opts}<button class="btn ghost" data-action="skip-evolve">신격화 안 함</button></div>`;
  }
  if (ctrl.canPass()) {
    return `<div class="hint">할 수 있는 행동이 없어요.</div>
      <div class="btnrow"><button class="btn primary" data-action="pass">차례 넘기기</button></div>`;
  }
  const n = ctrl.balls.length;
  const valid = ctrl.pendingValid();
  const pe = ctrl.pendingError();
  let hint = '가호를 고르거나, 카드를 눌러 영입·찜하기를 하세요.';
  if (n) {
    const names = ctrl.balls.map((c) => BALLS[c].name).join('·');
    hint = valid ? `${names} 선택! 가져가기를 눌러 턴을 마치세요.` : `${names} 선택 중 — ${pe ? ({ bad_ball_count: '서로 다른 가호를 3개까지 골라주세요.' }[pe] ?? '') : ''}`;
  }
  const label = n === 2 && ctrl.balls[0] === ctrl.balls[1] ? `${BALLS[ctrl.balls[0]].name} 2개 가져가기` : (n ? `가호 ${n}개 가져가기` : '가호 가져가기');
  // 영웅 능력 (싱글 전용, 게임당 1회)
  const ab = abilityInfo(ctrl.me.name);
  let abilityBar = '';
  if (ctrl.abilityArmed) {
    const armedHint = {
      discount: '✨ 명장의 손길 발동 중 — 카드를 눌러 할인 영입하세요.',
      masterBonus: '✨ 전리품 발동 중 — 카드를 눌러 영입하면 암브로시아 +1!',
      takeFour: '✨ 약탈 발동 중 — 서로 다른 가호 4종류를 고르세요.',
      refreshRow: '✨ 지혜 발동 중 — 새로고침할 줄을 고르세요.',
    }[ctrl.abilityArmed] || '';
    const refreshBtns = ctrl.abilityArmed === 'refreshRow'
      ? `<div class="btnrow">${['1', '2', '3', 'rare', 'legend'].map((t) => `<button class="btn alt" data-action="ability-refresh" data-tier="${t}">${tierLabel[t]} 🔄</button>`).join('')}</div>`
      : '';
    abilityBar = `<div class="hint abarmed">${armedHint}</div>${refreshBtns}
      <div class="btnrow"><button class="btn ghost" data-action="ability-cancel">능력 취소</button></div>`;
  } else if (ctrl.canUseAbility() && ab) {
    abilityBar = `<div class="btnrow"><button class="btn ability" data-action="ability">✨ 능력: ${ab.name}<small>${ab.desc} (1회)</small></button></div>`;
  }
  return `<div class="hint">${hint}</div>${err}${abilityBar}
    <div class="btnrow"><button class="btn ghost" data-action="clear" ${n ? '' : 'disabled'}>선택 취소</button>
    <button class="btn primary" data-action="confirm-balls" ${valid ? '' : 'disabled'}>${label}</button></div>`;
}

export function logHTML(ctrl) {
  if (!ctrl.log.length) return '';
  return `<div class="log">${ctrl.log.slice(-4).map((l) => `<div>${l}</div>`).join('')}</div>`;
}

export function aiToastHTML(ctrl) {
  const ev = ctrl.lastAIEvent;
  if (!ev || ctrl.isHumanTurn || ctrl.finished) return '';
  const p = ctrl.state.players[ev.player];
  if (!p) return '';
  const boss = !!ctrl.boss && ctrl.boss === p.name;
  const whoLabel = boss ? `👹 BOSS ${p.name}` : `AI ${p.name}`;
  let body = '';
  if (ev.type === 'takeBalls') body = `${ev.colors.map((c) => ballImg(c, 'ballspr')).join('')} 가져감`;
  else if (ev.type === 'takeTwo') body = `${ballImg(ev.color, 'ballspr')}<b>×2</b> 가져감`;
  else if (ev.type === 'buy') {
    const card = ctrl.cardsById.get(ev.cardId);
    body = card ? `${staticSprite(card)}<b>${card.name}</b> 영입!` : '영입 성공!';
  } else if (ev.type === 'reserve') {
    const card = ev.cardId ? ctrl.cardsById.get(ev.cardId) : null;
    body = card ? `${staticSprite(card)}<b>${card.name}</b> 찜!` : '덱에서 찜!';
  } else if (ev.type === 'evolve') {
    const from = ctrl.cardsById.get(ev.from);
    const to = ctrl.cardsById.get(ev.to);
    body = from && to ? `${staticSprite(from)} → ${staticSprite(to)}<b>신격화!</b>` : '신격화!';
  } else if (ev.type === 'abilityBuy' || ev.type === 'abilityTake' || ev.type === 'abilityRefresh') {
    // 능력 사용 토스트: "👹 BOSS 미노타우로스 — 폭식 사용!"
    const ab = abilityInfo(p.name);
    let detail = '';
    if (ev.type === 'abilityBuy') {
      const card = ctrl.cardsById.get(ev.cardId);
      detail = card ? ` ${staticSprite(card)}<b>${card.name}</b> 영입!` : ' 영입!';
    } else if (ev.type === 'abilityTake') {
      detail = ` ${ev.colors.map((c) => ballImg(c, 'ballspr')).join('')} 가져감`;
    } else {
      detail = ' 카드 진열 새로고침';
    }
    body = `${boss ? '👹' : '⚡'} <b>${ab?.name ?? '능력'}</b> 사용!${detail}`;
  } else return '';
  return `<div class="aitoast"><span class="who">${whoLabel}</span><span class="what">${body}</span></div>`;
}

// ---------- sheet + overlays ----------

function oppSheetHTML(p, ctrl) {
  const b = getBonuses(p);
  const tokens = TOKEN_KEYS.filter((k) => p.tokens[k] > 0)
    .map((k) => `<span class="otk">${ballImg(k, 'mini2')}${p.tokens[k]}</span>`).join('') || '없음';
  const groups = COLORS.map((c) => {
    const list = p.tableau.filter((card) => bonusList(card)[0] === c);
    if (!list.length) return '';
    return `<div class="grp g-${c}">${list.map((card) => `
      <button class="mp" data-action="view-card" data-card="${card.id}" data-from="opp" data-pid="${p.id}">${staticSprite(card)}<span>${card.name}${card.points ? ` <i>${card.points}점</i>` : ''}</span></button>`).join('')}</div>`;
  }).join('');
  const hand = p.hand.length
    ? p.hand.map((card) => `<button class="orsv" data-action="view-card" data-card="${card.id}" data-from="opp" data-pid="${p.id}">${staticSprite(card)}${card.name} <small>${tierLabel[card.tier]}${card.points ? ` · ${card.points}점` : ''}</small></button>`).join('')
    : '<div class="empty-note">없음</div>';
  return `<div class="sheet-back" data-action="close"></div><div class="sheet wide">
    <div class="sheet-title">${heroFaceSrc(p.name) ? `<img class="tface big" src="${heroFaceSrc(p.name)}" alt="">` : ''}${bossOf(ctrl, p) ? '👹 BOSS ' : (p.isAI ? 'AI ' : '📡 ')}${esc(p.name)} <small>· ${getPoints(p)}점 · 신격화 ${p.evolved.length}회</small></div>
    <div class="olbl">■ 가호 (할인)</div>
    <div class="pips big">${COLORS.map((c) => `<span class="pip d-${c}">${ballImg(c, 'mini2')}${b[c]}</span>`).join('')}</div>
    <div class="olbl">■ 가진 가호 (${tokenCount(p)}/10)</div>
    <div class="otks">${tokens}</div>
    <div class="olbl">■ 영입 (${p.tableau.length})</div>
    <div class="opoke">${groups || '<div class="empty-note">아직 없음</div>'}</div>
    <div class="olbl">■ 찜한 카드 (${p.hand.length}/3)</div>
    <div class="ohand">${hand}</div>
    <div class="btnrow"><button class="btn primary" data-action="close">닫기</button></div></div>`;
}

// have/need per color when the player can't afford a card (red = short)
function shortfallHTML(player, card) {
  const bonuses = getBonuses(player);
  const parts = COLORS.map((c) => {
    const need = Math.max(0, (card.cost[c] || 0) - bonuses[c]);
    if (!need) return '';
    const have = player.tokens[c] || 0;
    return `<span class="need ${have >= need ? 'ok' : 'lack'}">${ballImg(c, 'mini2')}${have}/${need}</span>`;
  }).join('');
  const masterNote = isSpecial(card) && !(player.tokens[MASTER] > 0)
    ? `<span class="need lack">${ballImg(MASTER, 'mini2')}암브로시아 필요</span>` : '';
  return parts + masterNote || '가호가 부족해요';
}

export function sheetHTML(ctrl) {
  const sh = ctrl.sheet;
  if (!sh) return '';
  if (sh.kind === 'opp') {
    const p = ctrl.state.players[sh.playerId];
    return p ? oppSheetHTML(p, ctrl) : '';
  }
  if (sh.kind === 'view') {
    const card = ctrl.cardsById.get(sh.cardId);
    if (!card) return '';
    const backBtn = sh.from && sh.from.kind === 'opp'
      ? `<button class="btn alt" data-action="view-back">← 상대 정보로</button>` : '';
    return `<div class="sheet-back" data-action="close"></div><div class="sheet">
      <div class="sheet-card">${cardHTML(card, ctrl, { interactive: false })}</div>
      <div class="sheet-info">
        <div class="sheet-title">${card.name}</div>
        <div class="paylbl">가호</div>
        <div class="pay">${bonusList(card).map((b) => ballImg(b)).join(' ')}</div>
        <div class="paylbl">신격화 정보</div>
        <div class="evoinfo">${evoText(card, ctrl.cardsById)}</div>
      </div>
      <div class="btnrow">${backBtn}<button class="btn primary" data-action="close">닫기</button></div></div>`;
  }
  if (sh.kind === 'deck') {
    return `<div class="sheet-back" data-action="close"></div><div class="sheet">
      <div class="sheet-title">${tierLabel[sh.tier]} 덱 맨 위 카드</div>
      <p class="sheet-p">뒷면 그대로 찜해요. 암브로시아가 남아 있으면 1개를 받아요.</p>
      <div class="btnrow"><button class="btn ghost" data-action="close">닫기</button>
      <button class="btn primary" data-action="reserve-deck" data-tier="${sh.tier}" ${ctrl.canReserve() ? '' : 'disabled'}>찜하기</button></div></div>`;
  }
  const card = ctrl.cardsById.get(sh.cardId);
  const inHand = ctrl.zone(card.id) === 'hand';
  const pay = ctrl.payment(card.id);
  let payText, payCls;
  if (pay) {
    payCls = '';
    payText = TOKEN_KEYS.filter((k) => pay[k]).map((k) => `${ballImg(k)}${pay[k]}`).join(' ') || '무료!';
  } else {
    payCls = 'no';
    payText = shortfallHTML(ctrl.me, card);
  }
  const canReserve = !inHand && !isSpecial(card) && ctrl.canReserve();
  const reserveNote = inHand ? '' : isSpecial(card) ? '희귀·전설은 찜 불가' : !ctrl.canReserve() ? '찜 한도(3장) 초과' : '';
  const armedBuy = ctrl.abilityArmed === 'discount' || ctrl.abilityArmed === 'masterBonus';
  const buyOk = armedBuy ? ctrl.canBuyAbility(card.id) : pay;
  const buyLabel = armedBuy
    ? `✨ 능력으로 영입${ctrl.abilityArmed === 'discount' ? ' (가호 1 할인)' : ' (+암브로시아)'}`
    : '영입하기';
  return `<div class="sheet-back" data-action="close"></div><div class="sheet">
    <div class="sheet-card">${cardHTML(card, ctrl, { interactive: false })}</div>
    <div class="sheet-info">
      <div class="sheet-title">${card.name}</div>
      <div class="paylbl">내가 낼 가호 (가호 할인 적용)</div>
      <div class="pay ${payCls}">${payText}</div>
      ${armedBuy && ctrl.abilityArmed === 'discount' && buyOk ? `<div class="note">✨ 명장의 손길: 가호 1개 할인 적용됨</div>` : ''}
      ${reserveNote ? `<div class="note">${reserveNote}</div>` : ''}
    </div>
    <div class="btnrow col">
      <button class="btn primary" data-action="buy" data-card="${card.id}" ${buyOk ? '' : 'disabled'}>${buyLabel}</button>
      ${inHand ? '' : `<button class="btn alt" data-action="reserve" data-card="${card.id}" ${canReserve ? '' : 'disabled'}>찜하기 (+암브로시아)</button>`}
      <button class="btn ghost" data-action="close">닫기</button>
    </div></div>`;
}

// ---------- intro splash (shown once per page load, before the title screen) ----------

export function introHTML() {
  const minis = ['legend-001', 'rare-001', 'm1-001'].map((id, i) =>
    `<img class="intro-card ic${i}" src="${mythSrc(id)}" alt="">`).join('');
  return `<div class="intro" data-action="intro-tap">
    <div class="intro-inner">
      <div class="intro-cards">${minis}</div>
      <div class="intro-title">Odyssey: The Card</div>
      <div class="intro-rules">90장의 카드 · 6종의 가호<br>가호를 모아 카드를 영입하고<br>18점을 먼저 완성하라</div>
      <div class="intro-tap">탭하여 시작</div>
    </div>
  </div>`;
}

export function modeHTML({ daily = null, weekly = null, chalDone = {}, streak = 0 } = {}) {
  const chalCard = (ch, label) => ch ? `
    <div class="dailycard ${chalDone[ch.id] ? 'done' : ''}">
      <span class="dico">${chalDone[ch.id] ? '✅' : (ch.kind === 'daily' ? '📅' : '🗓️')}</span>
      <div><b>${label} · ${ch.name}</b><br><small>${ch.desc}</small>
      ${ch.kind === 'daily' && streak > 0 ? `<br><small class="streak">🔥 ${streak}일 연속 클리어</small>` : ''}</div>
    </div>` : '';
  return `<div class="overlay"><div class="panel modepanel">
    <div class="titlebanner"><img src="assets/title-logo.webp" alt="Odyssey: The Card"><div class="titletxt">Odyssey: The Card<small>오디세이아 · DOT EDITION</small></div></div>
    <p class="sheet-p">가호를 모아 카드를 영입하는 턴제 전략 카드 게임이에요.<br>가호를 모아 카드를 영입하고, 신화를 먼저 완성(18점)하세요!</p>
    <div class="btnrow col modebtns">
      <button class="btn primary modebtn" data-action="mode-journey">🏛️ 신의 여정<small>오디세우스의 귀향 스토리 · 6 스테이지</small></button>
      <button class="btn alt modebtn" data-action="mode-single">⚔️ 일반전<small>🎲 랜덤 영웅으로 바로 시작</small></button>
      <button class="btn alt modebtn" data-action="mode-net">🌐 대전 모드<small>친구와 2~4인 멀티플레이</small></button>
    </div>
    <div class="dailies">${chalCard(daily, '오늘의 도전')}${chalCard(weekly, '이번 주 도전')}</div>
  </div></div>`;
}

// ---------- 신의 여정 UI ----------

// 슬롯 선택 화면
export function journeySlotsHTML(slots) {
  const slotHTML = (s, i) => {
    if (!s) {
      return `<button class="btn alt slotbtn empty" data-action="journey-slot" data-v="${i}">
        <span class="slotnum">슬롯 ${i + 1}</span><br><small>➕ 새 여정 시작</small>
      </button>`;
    }
    const stages = { '오디세우스': 6 }[s.hero] ?? 6;
    const done = s.stage >= stages;
    return `<div class="slotbtn filled">
      <button class="slotmain" data-action="journey-slot" data-v="${i}">
        <img class="tileface" src="${heroFaceSrc(s.hero) ?? ''}" alt="">
        <div><b>${esc(s.hero)}</b><br><small>${done ? '🌟 여정 완료!' : `스테이지 ${s.stage + 1} 진행 중`}</small></div>
      </button>
      <button class="slotdel" data-action="journey-slot-delete" data-v="${i}" title="삭제">🗑️</button>
    </div>`;
  };
  return `<div class="overlay"><div class="panel">
    <div class="title big">🏛️ 신의 여정</div>
    <p class="sheet-p">영웅을 정해 올림포스 정상까지 오르세요.<br>슬롯마다 영웅이 고정됩니다.</p>
    <div class="slotlist">${slots.map(slotHTML).join('')}</div>
    <div class="btnrow"><button class="btn" data-action="mode-back">← 모드 선택</button></div>
  </div></div>`;
}

// 빈 슬롯 영웅 선택 (오디세우스만 가능)
export function journeyHeroesHTML(heroes) {
  const tiles = heroes.map((h) => h.available
    ? `<button class="tile" data-action="journey-hero" data-v="${h.name}">
        <img class="tileface" src="assets/heroes/${h.face}.webp" alt="">
        <div><b>${h.name}</b><br><small>${h.title}</small></div>
      </button>`
    : `<div class="tile locked">
        <img class="tileface dim" src="assets/heroes/${h.face}.webp" alt="">
        <div><b>${h.name}</b><br><small>🔒 추후 업데이트 예정</small></div>
      </div>`).join('');
  return `<div class="overlay"><div class="panel">
    <div class="title big">영웅 선택</div>
    <p class="sheet-p">이 슬롯의 영웅을 정하세요. (변경 불가)</p>
    <div class="tiles">${tiles}</div>
    <div class="btnrow"><button class="btn" data-action="journey-back">← 슬롯 선택</button></div>
  </div></div>`;
}

// 스테이지 인트로 (스토리 화면)
export function journeyStageHTML(heroName, stage) {
  if (!stage) return '';
  const boss = stage.boss;
  const oppList = stage.opponents.map((o) => {
    const isB = boss && o === boss.name;
    const face = heroFaceSrc(o);
    return `<div class="oppchip ${isB ? 'boss' : ''}">${face ? `<img src="${face}" alt="">` : ''}<span>${isB ? '👹 ' : ''}${esc(o)}</span></div>`;
  }).join('');
  const diffLabel = { easy: '쉬움', normal: '보통', hard: '어려움', veryhard: '매우 어려움' }[stage.aiDifficulty] ?? '';
  return `<div class="overlay"><div class="panel">
    <div class="title big">스테이지 ${stage.n}<small>${esc(stage.name)}</small></div>
    <div class="storybox">${stage.story.map((l) => `<p>${esc(l)}</p>`).join('')}</div>
    <p class="sheet-p"><b>상대:</b></p>
    <div class="oppchips">${oppList}</div>
    ${boss ? `<p class="sheet-p boss-warn">👹 <b>${esc(boss.name)}</b> (${esc(boss.title)}) — 1등 승리 시 다음 스테이지!</p>`
      : `<p class="sheet-p">1등 승리 시 다음 스테이지 해금!</p>`}
    <p class="sheet-p"><small>AI 강도: ${diffLabel}</small></p>
    <div class="btnrow">
      <button class="btn" data-action="journey-back">← 슬롯 선택</button>
      <button class="btn primary" data-action="journey-stage-start">⚔️ 도전!</button>
    </div>
  </div></div>`;
}

// 엔딩 화면
export function journeyEndingHTML(heroName, ending) {
  if (!ending) return '';
  return `<div class="overlay"><div class="panel">
    <div class="title big">🌟 ${esc(ending.title)}</div>
    <div class="storybox">${ending.lines.map((l) => `<p>${esc(l)}</p>`).join('')}</div>
    <p class="sheet-p"><small>${esc(ending.teaser)}</small></p>
    <div class="btnrow"><button class="btn primary" data-action="journey-ending-close">확인</button></div>
  </div></div>`;
}

export function startHTML({ save = null, dex = null, cards = [], options = null, notice = '', heroes = null } = {}) {
  const sum = dex ? dexSummary(dex, cards) : null;
  const diff = options?.difficulty ?? 'normal';
  const resume = save
    ? `<button class="btn primary resume" data-action="resume">이어하기<small>${save.humanName} · ${save.game.turn}턴째 · ${new Date(save.savedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</small></button>`
    : '';
  const tiles = TRAINERS.map((t, i) => {
    const h = heroes?.[t];
    const ab = abilityInfo(t);
    return `<button class="tile t${i}" data-action="start" data-name="${t}">`
      + `${heroFaceSrc(t) ? `<img class="tileface" src="${heroFaceSrc(t)}" alt="">` : `<span class="tilebox"></span>`}`
      + `<span class="tname">${t}</span>`
      + `${h ? `<span class="lvbadge">Lv.${h.level} · ${h.title}</span><span class="xpbar"><span style="width:${h.need ? Math.min(100, Math.round(h.cur / h.need * 100)) : 100}%"></span></span>` : ''}`
      + `${ab ? `<small class="abdesc">✨ ${ab.name}: ${ab.desc}</small>` : ''}</button>`;
  }).join('');
  const multLabel = { easy: '×0.7', normal: '×1.0', hard: '×1.4', veryhard: '×2.0' };
  const diffPreview = `<div class="difflabel">AI 난이도<small>보상 ×0.7 / ×1.0 / ×1.4 / ×2.0</small></div>
    <div class="diffrow">
      ${[['easy', '쉬움'], ['normal', '보통'], ['hard', '어려움'], ['veryhard', '매우어려움']].map(([v, l]) =>
        `<button class="diffbtn ${diff === v ? 'sel' : ''}" data-action="difficulty" data-v="${v}">${l}<small>${multLabel[v]}</small></button>`).join('')}
    </div>`;
  return `<div class="overlay"><div class="panel">
    <div class="titlebanner"><img src="assets/title-logo.webp" alt="Odyssey: The Card"><div class="titletxt">Odyssey: The Card<small>오디세이아 · DOT EDITION</small></div></div>
    <p class="sheet-p">영웅을 골라 AI 3명과 4인전을 시작해요.<br>신화를 먼저 완성(18점)하는 영웅이 승리!</p>
    ${notice ? `<p class="sheet-p warn">${esc(notice)}</p>` : ''}
    ${resume}
    <div class="tiles">${tiles}</div>
    ${diffPreview}
    <p class="sheet-p">AI의 플레이 스타일(전문화·견제·균형)은 매 게임 랜덤으로 정해져요. 🤫</p>
    <p class="sheet-p">영웅 능력은 게임당 1회씩! AI 영웅도 사용해요.</p>
    ${save ? '<p class="sheet-p warn">새로 시작하면 저장된 게임은 사라져요.</p>' : ''}
    <div class="btnrow"><button class="btn alt" data-action="dex">신화도감 ${sum ? `${sum.caught}/${sum.total}` : ''}</button>
    <button class="btn alt" data-action="rules">룰 설명</button>
    <button class="btn alt" data-action="options">⚙ 설정</button></div>
    <div class="btnrow"><button class="btn alt" data-action="achv">🏆 업적</button>
    <button class="btn alt" data-action="records">📊 기록</button>
    <button class="btn alt" data-action="chal">📜 도전과제</button></div>
    <div class="btnrow"><button class="btn" data-action="mode-back">← 모드 선택</button></div>
  </div></div>`;
}

export function rulesHTML() {
  return `<div class="overlay"><div class="panel rulespanel">
    <div class="title big">룰 설명</div>
    <div class="rules">
      <p class="homage">가호 수집 → 카드 영입 → 18점 경쟁!<br>카드를 모을수록 가호 할인이 쌓이는 전략 카드 게임이에요.</p>
      <h4>■ 목표</h4>
      <p><b>18점</b>을 먼저 모으면 마지막 라운드! 전원이 같은 턴 수를 마치면 종료, 최고점이 승리해요.</p>
      <h4>■ 내 차례에 하는 일 (하나만 선택)</h4>
      <p>① <b>서로 다른 가호 3개</b> 가져오기 (암브로시아 제외)<br>
      ② <b>같은 가호 2개</b> 가져오기 (공급처에 4개 이상 남았을 때만)<br>
      ③ <b>카드 찜하기</b> (최대 3장, 암브로시아 1개를 받아요 · 희귀/전설은 찜 불가)<br>
      ④ <b>영입</b> (가호를 내고 카드를 가져와요)<br>
      <span style="color:#4ade80">■</span> <b>초록 테두리</b>=지금 바로 영입할 수 있음 · <span style="color:#60a5fa">■</span> <b>파랑 테두리</b>=고른 가호를 가져가면 다음 턴에 영입할 수 있음</p>
      <h4>■ 가호 = 할인</h4>
      <p>영입한 존재의 가호 1개(희귀/전설은 2개)마다 해당 가호 1개씩 영구 할인! 게임 끝까지 유지돼요.</p>
      <h4>■ 신격화</h4>
      <p>내 턴이 끝나면, 필요한 가호를 가진 존재는 다음 단계로 <b>신격화</b>할 수 있어요. 점수와 가호가 올라가요. (1→2→3단계만 가능)</p>
      <h4>■ 가호 10개 제한</h4>
      <p>암브로시아 포함 10개를 넘기면, 초과분을 골라 반환해야 해요.</p>
      <h4>■ 암브로시아</h4>
      <p>어떤 가호든 1개로 대체할 수 있는 만능 가호! <b>희귀/전설 존재를 영입하려면 암브로시아 1개가 꼭 필요</b>해요.</p>
      <h4>■ 동점 처리</h4>
      <p>① 신격화 횟수가 많은 쪽 → ② 그래도 동점이면 앞면 카드가 적은 쪽이 이겨요.</p>
    </div>
    <div class="btnrow"><button class="btn primary" data-action="rules-close">닫기</button></div>
  </div></div>`;
}

export function tutorialHTML(tut) {
  if (!tut) return '';
  const steps = [
    `<b>STEP 1</b> 가호를 모아보세요!<br>서로 다른 가호 3개를 누른 뒤 <b>[가져가기]</b>를 누르세요.`,
    `<b>STEP 2</b> 존재를 영입해보세요!<br>카드를 누르면 필요한 가호를 확인할 수 있어요. 가호가 모자라면 몇 턴 더 모아보세요.`,
    `<b>STEP 3</b> 가호 획득!<br>영입한 존재의 가호는 게임 끝까지 1개씩 영구 할인돼요.`,
    `<b>STEP 4</b> 18점을 먼저 모으면 승리!<br>카드를 미리 <b>[찜하기]</b>로 확보하거나, 가호를 모아 <b>신격화</b>시켜보세요. 행운을 빌어요!`,
  ];
  const last = tut.step >= steps.length - 1;
  const mid = tut.step === 2;
  return `<div class="tutbanner">
    <div class="tuttext">${steps[Math.min(tut.step, steps.length - 1)]}</div>
    <div class="tutbtns">
      ${mid ? '<button class="btn primary" data-action="tut-next">다음</button>' : ''}
      ${last ? '<button class="btn primary" data-action="tut-done">시작하기</button>' : ''}
      <button class="btn ghost" data-action="tut-skip">건너뛰기</button>
    </div>
  </div>`;
}

export function optionsHTML(options) {
  const av = options.playerAvatar ?? -1;
  const avBtns = [-1, 0, 1, 2, 3].map((i) =>
    `<button class="avbtn ${av === i ? 'sel' : ''}" data-action="avatar" data-v="${i}">${i === -1 ? '🎲' : `<img src="${playerAvatarSrc(i)}" alt="아바타 ${i + 1}">`}</button>`
  ).join('');
  return `<div class="overlay"><div class="panel">
    <div class="title big">설정</div>
    <button class="optrow" data-action="toggle-help">
      <span>초보자 팁 표시</span>
      <span class="toggle ${options.beginnerHelp ? 'on' : ''}">${options.beginnerHelp ? '켬' : '끔'}</span>
    </button>
    <p class="sheet-p">게임 중 상황에 맞는 도움말을 보여줘요.</p>
    <div class="difflabel">내 아바타</div>
    <div class="avrow">${avBtns}</div>
    <p class="sheet-p">일반전에서 "나"의 모습이에요. 🎲는 매 게임 랜덤.</p>
    <div class="btnrow"><button class="btn ghost" data-action="restart">타이틀로 돌아가기</button></div>
    <div class="btnrow"><button class="btn primary" data-action="options-close">닫기</button></div>
  </div></div>`;
}

function beginnerTip(ctrl) {
  const s = ctrl.state;
  if (s.phase === PHASES.DISCARD) return '가호가 10개를 넘었어요. 아래 내 가호를 눌러 초과분을 반환하세요.';
  if (s.phase === PHASES.EVOLVE) return '신격화 찬스! 조건을 만족한 존재를 신격화하면 점수와 가호가 올라가요.';
  if (!ctrl.isHumanTurn) return null;
  const n = ctrl.balls.length;
  if (n > 0) {
    return ctrl.pendingValid()
      ? '좋아요! [가져가기]를 누르면 가호를 가져오고 턴이 끝나요.'
      : '서로 다른 가호 3개, 또는 같은 가호 2개(공급처에 4개 이상 남았을 때)를 고를 수 있어요.';
  }
  for (const key of ['1', '2', '3', 'rare', 'legend']) {
    for (const card of s.table[key] || []) {
      if (card && ctrl.canBuy(card.id)) return '지금 바로 영입할 수 있는 존재가 있어요! 반짝이는 카드를 눌러보세요.';
    }
  }
  return '신화 완성(18점)이 목표! 가호를 모아서 존재를 영입하세요. 가호가 쌓이면 할인이 커져요.';
}

export function helpHTML(ctrl, options, tutorial) {
  if (!options.beginnerHelp || !ctrl || ctrl.finished || tutorial) return '';
  const tip = beginnerTip(ctrl);
  if (!tip) return '';
  return `<div class="helpbanner"><span class="helptag">TIP</span><span>${tip}</span></div>`;
}

export function dexHTML(dex, cards) {
  const sum = dexSummary(dex, cards);
  const order = { 1: 1, 2: 2, 3: 3, rare: 4, legend: 5 };
  const list = [...cards].sort((a, b) => order[a.tier] - order[b.tier] || a.dex - b.dex);
  const cell = (c) => {
    const e = dex.caught[c.id];
    return e
      ? `<div class="dexcell got"><img src="${mythSrc(c.id)}" alt="${c.name}"><span class="dn">${c.name}</span><span class="dc">×${e.n}${e.evolved ? ` · 신격화 ${e.evolved}` : ''}</span></div>`
      : `<div class="dexcell"><img class="sil" src="${mythSrc(c.id)}" alt=""><span class="dn">???</span><span class="dc">${tierLabel[c.tier]}</span></div>`;
  };
  const g = dex.games;
  return `<div class="overlay"><div class="panel dexpanel">
    <div class="title big">신화도감<small>영입한 존재 ${sum.caught}/${sum.total} · ${g.played}판 ${g.won}승</small></div>
    <div class="dexgrid">${list.map(cell).join('')}</div>
    <div class="btnrow"><button class="btn primary" data-action="dex-close">닫기</button></div>
  </div></div>`;
}

export function endHTML(ctrl) {
  const s = ctrl.state;
  const rows = s.ranking.map((r) => {
    const p = s.players[r.player];
    const face = p.id === ctrl.human && ctrl.playerAvatar
      ? `<img class="tface mini" src="${ctrl.playerAvatar}" alt="">`
      : (heroFaceSrc(p.name) ? `<img class="tface mini" src="${heroFaceSrc(p.name)}" alt="">` : '');
    return `<tr class="${r.rank === 1 ? 'win' : ''} ${p.id === ctrl.human ? 'me' : ''}"><td>${r.rank}</td><td>${face}${p.isAI ? 'AI ' : ''}${p.name}</td><td>${r.points}점</td><td>신격화 ${r.evolutions}</td><td>${r.pokemon}장</td></tr>`;
  }).join('');
  const top = s.ranking[0].player === ctrl.human;
  const scoreLine = ctrl.lastScore != null
    ? `<p class="scoreline">승리 점수 <b>${ctrl.lastScore}</b>${ctrl.lastBest ? ' <span class="newbest">NEW!</span>' : ''}</p>`
    : '';
  // 메타 정산 요약 (싱글모드 전용 — 멀티는 바닐라)
  const m = ctrl.metaResult;
  let metaLine = '';
  if (m) {
    const parts = [];
    if (m.xp) parts.push(`<div class="metarow">📈 ${m.xp.hero} +${m.xp.gained} XP → Lv.${m.xp.level} ${m.xp.title}${m.xp.leveledUp ? ' <b>🎉 레벨업!</b>' : ''}</div>`);
    if (m.league) {
      const ascended = m.league.promoted && m.league.tier.id === 'god';
      const beaten = m.league.bossBeaten ? `👹 ${m.league.bossBeaten.name} 격파! ` : '';
      const pendingHint = !m.league.promoted && m.league.pending
        ? ` 👹 <b>${m.league.pending.boss.name}</b> 승급전 도전 가능!`
        : '';
      parts.push(`<div class="metarow">🏆 리그 +${m.league.gained}점 → ${m.league.tier.icon} ${m.league.tier.name}`
        + `${m.league.promoted ? ` <b>${beaten}👑 승급!${ascended ? ' 신에 오르셨습니다!' : ''}</b>` : ` (${m.league.next ? `${m.league.next.name}까지 ${m.league.toGo}점` : '최고 티어'})${pendingHint}`}</div>`);
    }
    if (m.daily?.isNew) parts.push(`<div class="metarow">✅ 일일 도전 완료: ${m.daily.name}${m.daily.streak > 1 ? ` (🔥 ${m.daily.streak}일 연속)` : ''}</div>`);
    if (m.weekly?.isNew) parts.push(`<div class="metarow">✅ 주간 도전 완료: ${m.weekly.name}</div>`);
    if (parts.length) metaLine = `<div class="metabox">${parts.join('')}</div>`;
  }
  return `<div class="overlay"><div class="panel">
    <div class="title big">${top ? '우승!' : '게임 종료'}<small>${s.stalled ? '아무도 행동할 수 없어 종료됐어요' : '최종 순위'}</small></div>
    <table class="rank">${rows}</table>
    ${scoreLine}
    ${metaLine}
    <p class="sheet-p">동점은 신격화 횟수가 많은 쪽 → 앞면 카드 수가 적은 쪽이 이겨요.</p>
    <div class="btnrow"><button class="btn alt" data-action="dex">신화도감</button>
    <button class="btn primary" data-action="restart">다시 하기</button></div>
  </div></div>`;
}

export function achvHTML(unlocked) {
  const rows = ACHIEVEMENTS.map((a) => {
    const got = !!unlocked[a.id];
    const league = a.mode === 'league' ? '<span class="achvleague">🏆 리그</span>' : '';
    return `<div class="achvrow ${got ? 'got' : ''}"><span class="achvicon">${got ? a.icon : '🔒'}</span>
      <div><b>${a.name}</b>${league}<br><small>${a.desc}</small></div></div>`;
  }).join('');
  const n = Object.keys(unlocked).length;
  return `<div class="overlay"><div class="panel">
    <div class="title big">업적<small>${n}/${ACHIEVEMENTS.length} 달성</small></div>
    <div class="achvlist">${rows}</div>
    <div class="btnrow"><button class="btn primary" data-action="achv-close">닫기</button></div>
  </div></div>`;
}

export function recordsHTML(records) {
  const hist = records.history.slice().reverse().map((h) =>
    `<tr><td>${h.won ? '🏆' : '─'}</td><td>${h.score}</td><td>${h.points}점</td><td>${h.turns}턴</td><td>${diffLabel[h.difficulty] || ''}</td></tr>`).join('');
  const heroRows = Object.entries(records.byHero || {})
    .map(([name, h]) => `<div class="statrow"><span>${name}</span><span>${h.wins}승/${h.games}전 · ${h.games ? Math.round(h.wins / h.games * 100) : 0}%</span></div>`).join('');
  const stats = `
    <div class="statbox">
      ${records.bestStreak ? `<div class="statrow"><span>🔥 최다 연승</span><span>${records.bestStreak}연승${records.curStreak ? ` (진행 중 ${records.curStreak})` : ''}</span></div>` : ''}
      ${records.fastestWin ? `<div class="statrow"><span>⚡ 최단 턴 승리</span><span>${records.fastestWin.turns}턴</span></div>` : ''}
      ${records.mostPoints ? `<div class="statrow"><span>💯 최고 점수</span><span>${records.mostPoints.points}점</span></div>` : ''}
      ${heroRows ? `<div class="stathead">영웅별 승률</div>${heroRows}` : ''}
    </div>`;
  return `<div class="overlay"><div class="panel">
    <div class="title big">기록<small>최고 ${records.best}점 · ${records.wins}승/${records.games}전</small></div>
    ${stats}
    ${hist ? `<table class="rank"><tr><th></th><th>점수</th><th>결과</th><th>턴</th><th>난이도</th></tr>${hist}</table>` : '<p class="sheet-p">아직 기록이 없어요.</p>'}
    <div class="btnrow"><button class="btn primary" data-action="records-close">닫기</button></div>
  </div></div>`;
}

export function challengeListHTML(completed) {
  const rows = CHALLENGES.map((c) => {
    const done = !!completed[c.id];
    return `<button class="chalrow" data-action="challenge-start" data-id="${c.id}">
      <span class="chalicon">${done ? '✅' : '🎯'}</span>
      <div><b>${c.name}</b><br><small>${c.desc}</small></div></button>`;
  }).join('');
  return `<div class="overlay"><div class="panel">
    <div class="title big">챌린지<small>${Object.keys(completed).length}/${CHALLENGES.length} 클리어</small></div>
    <div class="achvlist">${rows}</div>
    <div class="btnrow"><button class="btn primary" data-action="challenge-close">닫기</button></div>
  </div></div>`;
}

export function challengeBannerHTML(ctrl) {
  if (!ctrl?.challenge || ctrl.challengeDone || ctrl.finished) return '';
  const p = challengeProgress(ctrl.challenge, ctrl, getPoints, bonusList);
  const left = Math.max(0, ctrl.challenge.maxTurns - ctrl.humanTurns);
  return `<div class="chbanner"><span>🎯 ${ctrl.challenge.name}</span><span>${p.cur}/${p.target}${p.label}</span><span>남은 턴 ${left}</span></div>`;
}

export function challengeEndHTML(won, challenge) {
  return `<div class="overlay"><div class="panel">
    <div class="title big">${won ? '챌린지 성공!' : '챌린지 실패'}<small>${challenge.name}</small></div>
    <p class="sheet-p">${won ? '목표를 달성했어요! 🎉' : `목표: ${challenge.desc}`}</p>
    <div class="btnrow"><button class="btn alt" data-action="challenge">다른 챌린지</button>
    <button class="btn primary" data-action="restart">타이틀로</button></div>
  </div></div>`;
}
export function netHelpHTML() {
  return `<div class="overlay"><div class="panel netpanel">
    <div class="title">📡 대전 방법</div>
    <div class="rules">
      <h4>■ 연결하기 (2~4인)</h4>
      <p>① 한 명이 <b>[방 만들기]</b>를 누르면 6자리 방 코드가 나와요.<br>
      ② 친구에게 코드를 알려주세요 (카톡, 문자 등).<br>
      ③ 친구는 <b>[참가하기]</b> → 코드 6자리 입력 → 연결 완료!<br>
      ④ 2~4명이 모이면 방장이 <b>[게임 시작]</b>을 눌러요.</p>
      <h4>■ 알아두면 좋아요</h4>
      <p>• 같은 와이파이가 아니어도 돼요. 인터넷만 되면 OK.<br>
      • 카톡 인앱 브라우저(팝업)보다 Safari·Chrome 앱에서 열면 안정적이에요.<br>
      • 실수로 나가도 60초 안에 같은 코드로 들어오면 이어서 할 수 있어요.<br>
      • 방장이 나가면 게임이 끝나요.<br>
      • 인원이 부족하면 남는 자리를 AI로 채울 수 있어요 (방장 로비에서 선택).<br>
      • 각자 자기 차례에만 둘 수 있어요.</p>
    </div>
    <div class="btnrow"><button class="btn primary" data-action="net-help-close">닫기</button></div>
  </div></div>`;
}

export function rejoinWaitHTML(net) {
  const rows = Object.keys(net.dropped || {}).map((k) => {
    const name = net.names[Number(k)] || '게스트';
    const left = net.dropped[k].left;
    return `<div class="roster-row">📡 ${esc(name)} 재연결 대기 중… ${left}초</div>`;
  }).join('');
  return `<div class="overlay"><div class="panel netpanel">
    <div class="title">📡 재연결 대기 중</div>
    <div class="roster">${rows}</div>
    <p class="sheet-p">다시 들어오면 이어서 할 수 있어요.<br><small>방 코드: ${esc(net.shortCode)} (친구에게 알려주세요)</small></p>
  </div></div>`;
}

export function netHTML(net, notice = '') {
  const roster = net.names.map((name, i) =>
    `<div class="roster-row">${i === 0 ? '👑' : '🎮'} ${esc(name)}${i === net.myIndex ? ' (나)' : ''}</div>`).join('');
  let body = '';
  switch (net.phase) {
    case 'menu': {
      const modeBtn = net.usePeer
        ? '<button class="btn ghost" data-action="net-manual">수동 연결 (서버 없이)</button>'
        : '<button class="btn ghost" data-action="net-peer">간편 연결로 돌아가기</button>';
      body = `<p class="sheet-p">친구와 대전해요.<br>${net.usePeer ? '방 코드 6자리만 입력하면 바로 연결돼요.' : '서버 없이 폰끼리 직접 연결돼요.'} (2~4인)</p>
        <div class="btnrow"><button class="btn primary" data-action="net-host">방 만들기</button>
        <button class="btn primary" data-action="net-join">참가하기</button></div>
        <div class="btnrow">${modeBtn}
        <button class="btn ghost" data-action="net-help">❓ 대전 방법</button></div>
        <div class="btnrow"><button class="btn ghost" data-action="net-leave">닫기</button></div>`;
      break;
    }
    case 'hostname':
      body = `<p class="sheet-p">대전에서 쓸 이름을 입력하세요.<br><small>한 번 정하면 다음부터 자동 입력돼요.</small></p>
        <input id="netname" class="netinput" maxlength="12" placeholder="이름" value="${esc(net.myName)}">
        <div class="btnrow"><button class="btn primary" data-action="net-host-create">방 만들기</button>
        <button class="btn ghost" data-action="net-menu">뒤로</button></div>`;
      break;
    case 'busy':
      body = `<p class="sheet-p">연결 중이에요...</p>`;
      break;
    case 'hostoffer':
      body = `${roster ? `<div class="roster">${roster}</div>` : ''}
        <p class="sheet-p">이 코드를 친구에게 보내주세요 (카톡 복붙).</p>
        <textarea class="netcode" readonly id="netoffer">${net.offerCode}</textarea>
        <div class="btnrow"><button class="btn alt" data-action="net-copy" data-from="netoffer">📋 복사</button></div>
        <p class="sheet-p">친구가 준 코드를 아래에 붙여넣고 연결하세요.</p>
        <textarea class="netcode" id="netanswer" placeholder="친구의 코드 붙여넣기"></textarea>
        <div class="btnrow"><button class="btn primary" data-action="net-host-accept">연결하기</button>
        ${net.names.length > 1 ? '<button class="btn alt" data-action="net-host-lobby">로비로</button>' : ''}
        <button class="btn ghost" data-action="net-leave">나가기</button></div>`;
      break;
    case 'hostlobby': {
      const codeHtml = net.usePeer && net.shortCode
        ? `<div class="shortcode"><span>방 코드</span><b>${esc(net.shortCode)}</b></div>
           <p class="sheet-p">친구에게 이 6자리 코드를 알려주세요.</p>`
        : '';
      const maxAi = Math.max(0, 4 - net.names.length);
      const aiBtns = [0, 1, 2, 3].filter((n) => n <= maxAi).map((n) =>
        `<button class="aibtn ${net.aiCount === n ? 'sel' : ''}" data-action="net-ai" data-n="${n}">${n === 0 ? '없음' : n + '명'}</button>`).join('');
      const total = net.names.length + net.aiCount;
      body = `${codeHtml}<div class="roster">${roster}</div>
        ${maxAi > 0 ? `<div class="airow"><span>🤖 남는 자리 AI로 채우기 <small>(어려움)</small></span><div class="aibtns">${aiBtns}</div></div>` : ''}
        <p class="sheet-p">${net.names.length}명${net.aiCount ? ` + AI ${net.aiCount}명` : ''} (총 ${total}인)</p>
        <div class="btnrow">
        ${!net.usePeer && net.names.length < 4 ? '<button class="btn alt" data-action="net-host-invite">➕ 게스트 초대</button>' : ''}
        <button class="btn primary" data-action="net-host-start" ${total < 2 ? 'disabled' : ''}>게임 시작</button>
        <button class="btn ghost" data-action="net-leave">나가기</button></div>`;
      break;
    }
    case 'guestname':
      body = `<p class="sheet-p">대전에서 쓸 이름을 입력하세요.<br><small>한 번 정하면 다음부터 자동 입력돼요.</small></p>
        <input id="netname" class="netinput" maxlength="12" placeholder="이름" value="${esc(net.myName)}">
        <div class="btnrow"><button class="btn primary" data-action="net-guest-next">다음</button>
        <button class="btn ghost" data-action="net-menu">뒤로</button></div>`;
      break;
    case 'guestjoin':
      body = net.usePeer
        ? `<p class="sheet-p">방장이 알려준 6자리 코드를 입력하세요.</p>
        <input id="netoffer" class="netinput code" maxlength="6" placeholder="예: KQ7X2P" autocomplete="off" autocapitalize="characters">
        <div class="btnrow"><button class="btn primary" data-action="net-guest-join">참가하기</button>
        <button class="btn ghost" data-action="net-menu">뒤로</button></div>`
        : `<p class="sheet-p">방장이 준 코드를 붙여넣으세요.</p>
        <textarea class="netcode" id="netoffer" placeholder="방장의 코드 붙여넣기"></textarea>
        <div class="btnrow"><button class="btn primary" data-action="net-guest-join">참가하기</button>
        <button class="btn ghost" data-action="net-menu">뒤로</button></div>`;
      break;
    case 'guestanswer':
      body = `<p class="sheet-p">이 코드를 방장에게 보내주세요.<br>방장이 입력하면 자동으로 연결돼요.</p>
        <textarea class="netcode" readonly id="netanswer2">${net.answerCode}</textarea>
        <div class="btnrow"><button class="btn alt" data-action="net-copy" data-from="netanswer2">📋 복사</button>
        <button class="btn ghost" data-action="net-leave">나가기</button></div>`;
      break;
    case 'guestlobby':
      body = `<div class="roster">${roster}</div>
        <p class="sheet-p">방장이 게임을 시작하기를 기다리는 중...</p>
        <div class="btnrow"><button class="btn ghost" data-action="net-leave">나가기</button></div>`;
      break;
    default:
      body = '';
  }
  return `<div class="overlay"><div class="panel netpanel">
    <div class="title">📡 대전 <small>멀티플레이</small></div>
    ${notice ? `<p class="sheet-p warn">${esc(notice)}</p>` : ''}
    ${body}
  </div></div>`;
}
