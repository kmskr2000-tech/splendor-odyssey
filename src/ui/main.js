// DOM glue: renders controller state into regions, wires taps, and paces AI turns.

// 자가업데이트 (iOS 홈화면 웹앱 캐시 대책): 배포된 version.json과 window.__V가
// 다르면 ?v= 를 붙여 리로드한다. param 값 비교로 무한루프 방지.
try {
  const __v = await fetch('assets/version.json', { cache: 'no-store', signal: AbortSignal.timeout(5000) })
    .then(r => r.json()).then(j => String(j.v));
  const __qv = new URLSearchParams(location.search).get('v');
  if (__v && __v !== 'undefined' && __v !== String(window.__V) && __qv !== __v) {
    const __u = new URL(location.href);
    __u.searchParams.set('v', __v);
    location.replace(__u.toString());
  }
} catch (e) { /* 버전 확인 실패 시 조용히 진행 */ }

import { CARDS } from '../data/cards.js?v=1791288149';
import { ALL_OPPONENTS } from '../data/heroes.js?v=1791288149';
import { ACHIEVEMENTS, checkAchievements } from '../data/achievements.js?v=1791288149';
import { CHALLENGES, challengeWon } from '../data/challenges.js?v=1791288149';
import { JOURNEY_HEROES, journeyStagesOf, journeyStageOf, JOURNEY_ENDING } from '../data/journey.js?v=1791288149';
import { createController } from './controller.js?v=1791288149';
import * as V from './view.js?v=1791288149';
import { getBonuses, getPoints, bonusList } from '../core/engine.js?v=1791288149';
import { browserStorage, loadDex, loadSave, saveGame, clearSave, recordCatch, recordGame, loadOptions, saveOptions, loadAchv, unlockAchv, loadRecords, recordResult, victoryScore, loadChal, completeChal, loadHero, getHero, loadJourney, startJourneySlot, advanceJourneyStage, clearJourneySlot, wipeAll, dexSummary } from '../storage/store.js?v=1791288149';
import { settleMeta } from '../meta/settle.js?v=1791288149';
import { NetSession } from '../net/session.js?v=1791288149';

// In-app browser guard: KakaoTalk/etc. popups die when swiped away, killing
// multiplayer. iOS can't force-open Safari from JS, so detect and guide.
const INAPP_RE = /KAKAOTALK|Instagram|FBAN|FBAV|FB_IAB|Line\/|NAVER|DaumApp|Whale|MiuiBrowser/i;
function showInAppGuide() {
  try {
    const ua = navigator.userAgent || '';
    if (!INAPP_RE.test(ua) || sessionStorage.getItem('inapp-dismissed')) return;
    const bar = document.createElement('div');
    bar.id = 'inappbar';
    bar.innerHTML = `<div><b>📱 Safari에서 열어주세요</b><br><small>인앱 브라우저(팝업)는 실수로 내리면 게임 연결이 끊겨요.<br>메뉴(•••) → 'Safari로 열기' 또는 '다른 브라우저로 열기'를 눌러주세요.</small></div>
      <button id="inapp-copy">URL 복사</button><button id="inapp-x" aria-label="닫기">✕</button>`;
    document.body.prepend(bar);
    document.getElementById('inapp-x').onclick = () => {
      bar.remove();
      try { sessionStorage.setItem('inapp-dismissed', '1'); } catch {}
    };
    document.getElementById('inapp-copy').onclick = async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        document.getElementById('inapp-copy').textContent = '복사됨!';
      } catch {}
    };
  } catch {}
}
showInAppGuide();

const params = new URLSearchParams(location.search);
const AI_DELAY = params.has('fast') ? 0 : 1600; // ?fast=1 skips the pacing delay (tests)
const AI_NAMES = ['오디세우스', '헤라클레스', '아킬레우스', '페르세우스'];

const regions = {
  header: ['header', V.headerHTML],
  tutorial: ['tutorial', () => V.tutorialHTML(tutorial)],
  help: ['help', () => V.helpHTML(ctrl, options, tutorial)],
  chbanner: ['chbanner', () => V.challengeBannerHTML(ctrl)],
  opponents: ['opponents', V.opponentsHTML],
  board: ['board', V.boardHTML],
  supply: ['supply', V.supplyHTML],
  me: ['me', V.meHTML],
  log: ['log', V.logHTML],
  actionbar: ['actionbar', V.actionBarHTML],
  sheet: ['sheet', V.sheetHTML],
};
const cache = {};
let ctrl = null;
let aiTimer = null;
let dexOpen = false;
let rulesOpen = false;
let howtoOpen = false;
let achvOpen = false;
let recordsOpen = false;
let chalOpen = false;
let tutorial = null; // { step } — guided first-game tutorial
let optionsOpen = false;
let wipeConfirm = false; // 설정: 데이터 초기화 확인 중
let quitConfirm = false; // 게임 중 타이틀로 가기 확인 중
let diffPending = false; // 일반전: 난이도 선택 화면 표시 중
let net = null; // NetSession while in multiplayer menu/lobby/game
let netNotice = ''; // one-shot notice shown on the start/net screen
let netHelpOpen = false;
let introDone = false; // intro splash shown once per page load
let modeDone = false; // mode select shown after intro
let singleMode = 'normal'; // 'journey' | 'normal' — 싱글 세부 모드
// 신의 여정 상태
let journeySlot = null; // 선택된 슬롯 인덱스 (0-2)
let journeyStageIntro = null; // 스테이지 인트로 표시 중인 스테이지 번호
let journeyEnding = false; // 엔딩 화면 표시
const storage = browserStorage();
const options = loadOptions(storage);

const $ = (id) => document.getElementById(id);

function setHTML(id, html) {
  if (cache[id] === html) return; // keeps animated sprites from restarting needlessly
  cache[id] = html;
  $(id).innerHTML = html;
}

function render() {
  checkChallenge();
  if (ctrl) for (const [id, fn] of Object.values(regions)) setHTML(id, fn(ctrl));
  let overlay;
  if (!introDone) {
    overlay = V.introHTML();
  } else if (!modeDone && !ctrl) {
    overlay = V.modeHTML();
  } else if (netHelpOpen && net) {
    overlay = V.netHelpHTML();
  } else if (net && !ctrl) {
    overlay = V.netHTML(net, netNotice);
    netNotice = '';
  } else if (net && ctrl && !ctrl.finished && net.dropped && Object.keys(net.dropped).length > 0) {
    overlay = V.rejoinWaitHTML(net);
    netNotice = '';
  } else if (quitConfirm && ctrl && !ctrl.finished) {
    overlay = V.quitConfirmHTML();
  } else {
    overlay = !ctrl ? singleStartHTML() : ctrl.finished ? V.endHTML(ctrl) : '';
    netNotice = '';
  }
  if (ctrl?.challengeDone) overlay = V.challengeEndHTML(ctrl.challengeDone === 'won', ctrl.challenge);
  if (dexOpen) overlay = V.dexHTML(loadDex(storage), CARDS);
  else if (rulesOpen) overlay = V.rulesHTML();
  else if (howtoOpen) overlay = V.howtoHTML();
  else if (achvOpen) overlay = V.achvHTML(loadAchv(storage).unlocked);
  else if (recordsOpen) overlay = V.recordsHTML(loadRecords(storage));
  else if (chalOpen) overlay = V.challengeListHTML(loadChal(storage).completed);
  else if (optionsOpen) overlay = V.optionsHTML(options, wipeConfirm);
  setHTML('overlay', overlay);
  scheduleAI();
}

// Resolves challenge win/lose. Win: goal met. Lose: turn limit hit or normal game end.
function checkChallenge() {
  if (!ctrl?.challenge || ctrl.challengeDone) return;
  if (ctrl.finished) { ctrl.challengeDone = 'lost'; return; }
  if (challengeWon(ctrl.challenge, ctrl, getPoints, bonusList)) {
    ctrl.challengeDone = 'won';
    completeChal(storage, ctrl.challenge.id);
    return;
  }
  if (ctrl.humanTurns >= ctrl.challenge.maxTurns) ctrl.challengeDone = 'lost';
}

function scheduleAI() {
  if (aiTimer || !ctrl || ctrl.finished || ctrl.isHumanTurn) return;
  // In multiplayer, only the host acts for AI seats; guests wait for the relay.
  if (net && net.phase === 'playing' && net.role !== 'host') return;
  // Only schedule when it's actually an AI's turn (no polling during humans' turns).
  if (!ctrl.game.players[ctrl.game.current].isAI) return;
  aiTimer = setTimeout(() => {
    aiTimer = null;
    if (ctrl) {
      const snap = snapshotMovables();
      ctrl.stepAI();
      render();
      animateAIFromSnap(snap);
    }
  }, AI_DELAY);
}

// ---------- fly animations ----------

const REDUCED_MOTION = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Detached-but-clonable refs to cards on the table and balls in the supply,
// captured BEFORE a state change so we can fly a clone to its destination.
// Rects must be read here too — after render() the nodes are detached and measure zero.
function snapshotMovables() {
  const snap = new Map();
  document.querySelectorAll('[data-action="card"]').forEach((el) =>
    snap.set('card:' + el.dataset.card, { el, rect: el.getBoundingClientRect() }));
  document.querySelectorAll('#supply [data-action="ball"]').forEach((el) =>
    snap.set('ball:' + el.dataset.color, { el, rect: el.getBoundingClientRect() }));
  return snap;
}

function flyClone(src, dstEl, ms = 650) {
  if (!src || !dstEl || REDUCED_MOTION) return;
  const r1 = src.rect;
  const r2 = dstEl.getBoundingClientRect();
  if (!r1.width || !r2.width) return;
  const clone = src.el.cloneNode(true);
  clone.removeAttribute('data-action');
  Object.assign(clone.style, {
    position: 'fixed', left: r1.left + 'px', top: r1.top + 'px',
    width: r1.width + 'px', height: r1.height + 'px', margin: '0',
    zIndex: 60, pointerEvents: 'none',
  });
  document.body.appendChild(clone);
  const dx = r2.left + r2.width / 2 - (r1.left + r1.width / 2);
  const dy = r2.top + r2.height / 2 - (r1.top + r1.height / 2);
  const anim = clone.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.7}px, ${dy * 0.7 - 24}px) scale(.7)`, opacity: 1, offset: 0.7 },
      { transform: `translate(${dx}px, ${dy}px) scale(.4)`, opacity: 0.85 },
    ],
    { duration: ms, easing: 'cubic-bezier(.3,.7,.4,1)' },
  );
  anim.onfinish = () => clone.remove();
}

function flyBalls(snap, colors, dstEl) {
  colors.forEach((c, i) => {
    const src = snap.get('ball:' + c);
    if (src) setTimeout(() => flyClone(src, dstEl, 500), i * 90);
  });
}

function animateAIFromSnap(snap) {
  const ev = ctrl.lastAIEvent;
  if (!ev) return;
  const dst = document.querySelector(`.opp[data-id="${ev.player}"]`);
  if (!dst) return;
  if (ev.type === 'buy' || ev.type === 'abilityBuy' || ev.type === 'reserve') {
    flyClone(snap.get('card:' + ev.cardId), dst);
  } else if (ev.type === 'takeBalls' || ev.type === 'abilityTake') {
    flyBalls(snap, ev.colors, dst);
  } else if (ev.type === 'takeTwo') {
    flyBalls(snap, [ev.color, ev.color], dst);
  }
}

const cardsById = new Map(CARDS.map((c) => [c.id, c]));
let caughtLegend = false; // this game's legend catch flag (for achievements)
let achvToasts = []; // newly unlocked achievements waiting to toast
let achvToastTimer = null;
let infoToastTimer = null;

// 일반 정보 토스트 (업적 토스트와 같은 영역 사용)
function showInfoToast(html, ms = 4000) {
  const el = document.getElementById('achvtoast');
  if (!el) return;
  el.innerHTML = `<div class="achvtoast-in">${html}</div>`;
  el.style.display = 'block';
  clearTimeout(infoToastTimer);
  infoToastTimer = setTimeout(() => { el.style.display = 'none'; el.innerHTML = ''; }, ms);
}

// ---------- meta view helpers (single-player) ----------

function heroesView() {
  const out = {};
  for (const name of AI_NAMES) out[name] = getHero(storage, name);
  return out;
}

function queueAchvToasts(list) {
  achvToasts = achvToasts.concat(list);
  renderAchvToast();
}

function renderAchvToast() {
  const el = document.getElementById('achvtoast');
  if (!el) return;
  const a = achvToasts[0];
  el.innerHTML = a ? `<div class="achvtoast-in"><span class="achvicon">${a.icon}</span><div><b>업적 달성!</b><br>${a.name}</div></div>` : '';
  el.style.display = a ? 'block' : 'none';
  clearTimeout(achvToastTimer);
  if (a) achvToastTimer = setTimeout(() => { achvToasts = achvToasts.slice(1); renderAchvToast(); }, 3000);
}

const hooks = {
  onCatch: (cardId, kind) => {
    recordCatch(storage, cardId, kind);
    const card = cardsById.get(cardId);
    if (card && (card.tier === 'rare' || card.tier === 'legend')) caughtLegend = true;
  },
  onChange: () => { if (ctrl && !ctrl.finished && !ctrl.challenge) saveGame(storage, ctrl.snapshot()); },
  onEnd: (won) => {
    recordGame(storage, won);
    if (ctrl) {
      const me = ctrl.me;
      const bonusColors = new Set();
      for (const card of me.tableau) for (const b of bonusList(card)) bonusColors.add(b);
      const rank = ctrl.game.ranking.find((r) => r.player === ctrl.human)?.rank ?? 4;
      const journey = ctrl.journey;
      const stageN = journey?.stage ?? 0;
      const bossBeaten = (won && rank === 1 && ctrl.boss) ? ctrl.boss : null;
      const points = getPoints(me);
      // 2위와의 점수차 (우승 시)
      let margin = 0;
      if (won && rank === 1) {
        const runner = ctrl.game.ranking.find((r) => r.rank === 2);
        if (runner) margin = points - (runner.points ?? 0);
      }
      // 기록 먼저 정산 (연승·누적 신격화 업적에 필요)
      const isSingleGame = !ctrl.mp && !ctrl.challenge;
      const rec = recordResult(storage, {
        won, points, turns: ctrl.game.turn, difficulty: ctrl.difficulty,
        hero: isSingleGame ? ctrl.humanName : undefined, evos: me.evolved.length,
      });
      ctrl.lastScore = rec.score;
      ctrl.lastBest = rec.isBest;
      const recs = loadRecords(storage);
      const dexSum = dexSummary(loadDex(storage), CARDS);
      const ctx = {
        won,
        turns: ctrl.game.turn,
        evolutions: me.evolved.length,
        difficulty: ctrl.difficulty,
        points,
        margin,
        bonusColors,
        masterTokens: me.tokens?.master ?? 0,
        caughtLegend,
        journeyMode: !!journey,
        journeyStage: (won && rank === 1 && journey) ? stageN : 0,
        rank,
        bossBeaten,
        streak: recs.curStreak,
        totalEvos: recs.totalEvos,
        dexCaught: dexSum.caught,
      };
      const newly = checkAchievements(ctx, loadAchv(storage).unlocked);
      if (newly.length) {
        unlockAchv(storage, newly.map((a) => a.id));
        queueAchvToasts(newly);
      }
      // 메타 정산: 싱글모드(챌린지·튜토리얼 제외)에서만. 멀티는 완전 바닐라.
      // - XP: 실제 영웅 이름으로 플레이할 때만 (여정 모드 오디세우스, 일반전 "나"는 제외)
      if (isSingleGame) {
        ctrl.metaResult = settleMeta(storage, {
          won, rank, points: ctx.points, turns: ctrl.humanTurns,
          difficulty: ctrl.difficulty, aiDifficulty: ctrl.aiDifficulty,
          heroName: (journey && ctrl.humanName !== '나') ? ctrl.humanName : null,
          journeyMode: !!journey,
          evolved: me.evolved.length, track: ctrl.track,
          bossBeaten,
        });
      }
      // 신의 여정: 1등 승리 시 다음 스테이지 해금
      if (journey && won && rank === 1) {
        advanceJourneyStage(storage, journey.slot, stageN);
        const total = journeyStagesOf(journey.hero).length;
        if (stageN >= total) {
          journeyEnding = true; // 엔딩!
        } else {
          journeyStageIntro = stageN + 1; // 다음 스테이지 인트로
        }
      } else if (journey) {
        journeyStageIntro = stageN; // 패배 시 재도전 (같은 스테이지 인트로)
      }
    }
    clearSave(storage);
    caughtLegend = false;
  },
};

function resumeGame() {
  const save = loadSave(storage, CARDS);
  if (!save) return;
  ctrl = createController({ cards: CARDS, seed: save.seed, humanName: save.humanName, aiNames: save.aiNames, resume: { game: save.game, log: save.log, difficulty: save.difficulty, aiDifficulty: save.aiDifficulty, journeyMode: save.journeyMode, boss: save.boss, journey: save.journey, aiPersonalities: save.aiPersonalities, track: save.track }, hooks });
  // 여정 모드 이어하기 시 슬롯 복원
  if (save.journey) { journeySlot = save.journey.slot; singleMode = 'journey'; modeDone = true; }
  Object.keys(cache).forEach((k) => delete cache[k]);
  window.__ctrl = ctrl;
  render();
}

// ---------- multiplayer ----------

function openNet() {
  if (net) return;
  net = new NetSession({
    onRender: () => render(),
    onGameStart: (c) => {
      clearTimeout(aiTimer); aiTimer = null;
      ctrl = c;
      Object.keys(cache).forEach((k) => delete cache[k]);
      window.__ctrl = ctrl; // debugging / automated tests
      render();
    },
    onGameEnd: () => { net = null; ctrl = null; render(); },
    onNotice: (msg) => { netNotice = msg; render(); },
  });
  net.myName = options.playerName || ''; // pre-fill saved name
  render();
}

function savePlayerName(name) {
  const clean = String(name || '').trim().slice(0, 12);
  if (clean && clean !== options.playerName) {
    options.playerName = clean;
    saveOptions(storage, options);
  }
}

const netInputVal = (id) => document.getElementById(id)?.value ?? '';

function startTutorial() {
  singleMode = 'normal';
  startGame('나');
  tutorial = { step: 0 };
  render();
}

function tutAdvance() {
  if (tutorial && tutorial.step < 3) {
    tutorial.step += 1;
    render();
  }
}

// ---------- 신의 여정 ----------

// 현재 슬롯의 진행 중인 스테이지 (다음에 플레이할 스테이지 번호)
function journeyNextStage() {
  const j = loadJourney(storage);
  const s = j.slots[journeySlot];
  if (!s) return 1;
  return Math.min(s.stage + 1, journeyStagesOf(s.hero).length);
}

// 여정 스테이지 게임 시작 (사용자 난이도가 스테이지 기본 강도에 가감됨)
function startJourneyStage(slotIdx, stageN) {
  const j = loadJourney(storage);
  const slot = j.slots[slotIdx];
  if (!slot) return;
  const stage = journeyStageOf(slot.hero, stageN);
  if (!stage) return;
  const seedParam = params.get('seed');
  const seed = seedParam !== null ? Number(seedParam) : (crypto.getRandomValues(new Uint32Array(1))[0] || 1);
  const aiNames = stage.opponents.slice();
  const userDiff = options.difficulty;
  const scenario = {
    aiDifficulty: V.effectiveJourneyDifficulty(stage.aiDifficulty, userDiff),
    boss: stage.boss ? stage.boss.name : null,
    journey: { slot: slotIdx, hero: slot.hero, stage: stageN },
  };
  journeySlot = slotIdx;
  journeyStageIntro = null;
  journeyEnding = false;
  clearSave(storage);
  ctrl = createController({
    cards: CARDS, seed, humanName: slot.hero, aiNames, hooks,
    difficulty: userDiff, scenario,
  });
  saveGame(storage, ctrl.snapshot());
  Object.keys(cache).forEach((k) => delete cache[k]);
  window.__ctrl = ctrl;
  render();
}

function singleStartHTML() {
  // 일반전: 난이도 선택 화면
  if (diffPending) {
    return V.diffSelectHTML(options.difficulty);
  }
  // 신의 여정 모드
  if (singleMode === 'journey') {
    const j = loadJourney(storage);
    // 엔딩 화면
    if (journeyEnding) {
      const slot = j.slots[journeySlot];
      const ending = JOURNEY_ENDING[slot?.hero];
      return V.journeyEndingHTML(slot?.hero ?? '', ending);
    }
    // 슬롯이 선택되고 비어있으면 영웅 선택
    if (journeySlot !== null && !j.slots[journeySlot] && journeyStageIntro === null) {
      return V.journeyHeroesHTML(JOURNEY_HEROES);
    }
    // 스테이지 인트로
    if (journeyStageIntro !== null && journeySlot !== null) {
      const slot = j.slots[journeySlot];
      const stage = journeyStageOf(slot.hero, journeyStageIntro);
      return V.journeyStageHTML(slot.hero, stage, options.difficulty);
    }
    // 슬롯 선택
    return V.journeySlotsHTML(j.slots);
  }
  // 일반전: 기존 startHTML (이어하기/도감/옵션)
  return V.startHTML({
    save: loadSave(storage, CARDS), dex: loadDex(storage), cards: CARDS, options, notice: netNotice,
    heroes: heroesView(),
  });
}

function startGame(humanName) {
  const seedParam = params.get('seed');
  const seed = seedParam !== null ? Number(seedParam) : (crypto.getRandomValues(new Uint32Array(1))[0] || 1);
  // 일반전: 전체 캐릭터 풀에서 랜덤 3명 (보스도 등장 가능, BOSS 태그 없이)
  const pool = [...ALL_OPPONENTS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const aiNames = pool.slice(0, 3);
  clearSave(storage); // a new game replaces any saved one
  ctrl = createController({ cards: CARDS, seed, humanName, aiNames, hooks, difficulty: options.difficulty });
  // 일반전 "나"의 아바타 (옵션 고정 또는 seed 기반 랜덤)
  if (humanName === '나') ctrl.playerAvatar = V.resolvePlayerAvatar(options, seed);
  saveGame(storage, ctrl.snapshot());
  Object.keys(cache).forEach((k) => delete cache[k]);
  window.__ctrl = ctrl; // debugging / automated tests
  render();
  // 일반전 "나": 이번 판의 랜덤 능력 안내
  if (humanName === '나' && ctrl.me?.ability) {
    const names = { refreshRow: '기책', takeFour: '괴력', masterBonus: '전리품', discount: '여신의 가호' };
    showInfoToast(`<span class="achvicon">✨</span><div><b>이번 판의 능력: ${names[ctrl.me.ability] ?? '능력'}</b><br>게임당 1회 사용할 수 있어요</div>`);
  }
}

// 시드 기반 셔플 후 n개 선택 (테스트 결정성 유지)
function pickRandom(arr, n, seed) {
  const a = arr.slice();
  let s = (seed >>> 0) || 1;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(n, a.length));
}

function startChallenge(id) {
  const ch = CHALLENGES.find((c) => c.id === id);
  if (!ch) return;
  chalOpen = false;
  tutorial = null;
  clearSave(storage); // challenges don't use the save slot
  const seed = (crypto.getRandomValues(new Uint32Array(1))[0] || 1);
  ctrl = createController({ cards: CARDS, seed, humanName: '나', aiNames: AI_NAMES.slice(0, 3), hooks, difficulty: ch.difficulty, challenge: ch });
  ctrl.applyChallengeSetup(ch);
  Object.keys(cache).forEach((k) => delete cache[k]);
  window.__ctrl = ctrl;
  render();
}

function quitToTitle() {
  if (net) net.end();
  ctrl = null; tutorial = null; optionsOpen = false; modeDone = false;
  quitConfirm = false; wipeConfirm = false; diffPending = false;
  clearTimeout(aiTimer); aiTimer = null;
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const d = el.dataset;
  switch (d.action) {
    case 'intro-tap': introDone = true; break;
    case 'mode-single': {
      singleMode = 'normal'; modeDone = true;
      journeySlot = null; journeyStageIntro = null; journeyEnding = false;
      // 일반전: 난이도 선택 화면 먼저
      diffPending = true;
      break;
    }
    case 'diff-start': {
      diffPending = false;
      // 일반전: "나"로 시작 (영웅 선택 스킵, 능력은 랜덤)
      startGame('나'); return;
    }
    case 'diff-back': {
      diffPending = false; modeDone = false;
      break;
    }
    case 'mode-journey': {
      singleMode = 'journey'; modeDone = true;
      journeySlot = null; journeyStageIntro = null; journeyEnding = false;
      break;
    }
    case 'journey-slot': {
      const idx = Number(d.v);
      const j = loadJourney(storage);
      journeySlot = idx;
      if (!j.slots[idx]) {
        // 빈 슬롯: 영웅 선택 화면으로 (journey-hero 액션에서 처리)
        journeyStageIntro = null;
      } else {
        // 진행 중 슬롯: 다음 스테이지 인트로로
        journeyStageIntro = journeyNextStage();
      }
      journeyEnding = false;
      break;
    }
    case 'journey-hero': {
      // 빈 슬롯에 영웅 지정 (오디세우스만 가능)
      const hero = JOURNEY_HEROES.find((h) => h.name === d.v);
      if (!hero || !hero.available) break;
      startJourneySlot(storage, journeySlot, hero.name);
      journeyStageIntro = 1;
      break;
    }
    case 'journey-slot-delete': {
      clearJourneySlot(storage, Number(d.v));
      if (journeySlot === Number(d.v)) journeySlot = null;
      break;
    }
    case 'journey-back': journeySlot = null; journeyStageIntro = null; journeyEnding = false; break;
    case 'journey-stage-start': {
      const j = loadJourney(storage);
      const slot = j.slots[journeySlot];
      if (slot) startJourneyStage(journeySlot, journeyStageIntro);
      break;
    }
    case 'journey-ending-close': {
      journeyEnding = false; journeySlot = null; journeyStageIntro = null;
      break;
    }
    case 'mode-back': {
      modeDone = false; singleMode = 'normal';
      journeySlot = null; journeyStageIntro = null; journeyEnding = false;
      break;
    }
    case 'mode-net': modeDone = true; openNet(); return;
    case 'start': startGame(d.name); return;
    case 'resume': resumeGame(); return;
    case 'dex': dexOpen = true; break;
    case 'dex-close': dexOpen = false; break;
    case 'rules': rulesOpen = true; break;
    case 'rules-close': rulesOpen = false; break;
    case 'howto': howtoOpen = true; break;
    case 'howto-close': howtoOpen = false; break;
    case 'achv': achvOpen = true; break;
    case 'achv-close': achvOpen = false; break;
    case 'records': recordsOpen = true; break;
    case 'records-close': recordsOpen = false; break;
    case 'challenge': chalOpen = true; break;
    case 'challenge-close': chalOpen = false; break;
    case 'challenge-start': startChallenge(d.id); return;
    case 'options': optionsOpen = true; break;
    case 'options-close': optionsOpen = false; break;
    case 'toggle-help':
      options.beginnerHelp = !options.beginnerHelp;
      saveOptions(storage, options);
      break;
    case 'toggle-sound':
      options.sound = options.sound === false;
      saveOptions(storage, options);
      break;
    case 'wipe-ask': wipeConfirm = true; break;
    case 'wipe-cancel': wipeConfirm = false; break;
    case 'wipe-yes': {
      wipeAll(storage);
      wipeConfirm = false;
      // 옵션도 초기화됐으므로 다시 로드
      Object.assign(options, loadOptions(storage));
      showInfoToast('<span class="achvicon">🗑️</span><div><b>모든 데이터가 초기화됐어요</b></div>');
      break;
    }
    case 'avatar': {
      const v = parseInt(d.v, 10);
      if (v >= -1 && v < 4) { options.playerAvatar = v; saveOptions(storage, options); }
      break;
    }
    case 'difficulty':
      if (['easy', 'normal', 'hard', 'veryhard'].includes(d.v)) {
        options.difficulty = d.v;
        saveOptions(storage, options);
      }
      break;
    case 'opp': ctrl.openOpp(d.id); break;
    case 'view-card':
      ctrl.viewCard(d.card, d.from === 'opp' ? { kind: 'opp', playerId: Number(d.pid) } : null);
      break;
    case 'view-back': {
      const from = ctrl.sheet && ctrl.sheet.from;
      ctrl.sheet = from || null;
      break;
    }
    case 'restart':
      quitToTitle(); break;
    case 'quit-confirm':
      if (ctrl && !ctrl.finished) quitConfirm = true;
      else quitToTitle();
      break;
    case 'quit-cancel': quitConfirm = false; break;
    case 'quit-yes': quitToTitle(); break;
    // ----- multiplayer -----
    case 'net': openNet(); break;
    case 'net-menu': if (net) { net.phase = 'menu'; netNotice = ''; } break;
    case 'net-host': if (net) { net.usePeer = true; net.phase = 'hostname'; netNotice = ''; } break;
    case 'net-join': if (net) { net.usePeer = true; net.phase = 'guestname'; netNotice = ''; } break;
    case 'net-manual': if (net) { net.usePeer = false; net.phase = 'menu'; netNotice = '수동 연결 모드: 코드를 두 번 주고받아야 해요.'; } break;
    case 'net-peer': if (net) { net.usePeer = true; net.phase = 'menu'; netNotice = ''; } break;
    case 'net-ai': if (net) {
      const n = Math.max(0, Math.min(4 - net.names.length, Number(d.n) || 0));
      net.aiCount = n;
      netNotice = '';
    } break;
    case 'net-help': netHelpOpen = true; break;
    case 'net-help-close': netHelpOpen = false; break;
    case 'net-host-create': if (net) { netNotice = ''; net.hostCreate(savePlayerName(netInputVal('netname'))); return; } break;
    case 'net-host-invite': if (net) { netNotice = ''; net.hostInvite(); return; } break;
    case 'net-host-accept': if (net) { netNotice = ''; net.hostAcceptAnswer(netInputVal('netanswer')); return; } break;
    case 'net-host-lobby': if (net) { net.phase = 'hostlobby'; netNotice = ''; } break;
    case 'net-host-start': if (net) { netNotice = ''; net.hostStart(); } break;
    case 'net-guest-next': if (net) { net.myName = savePlayerName(netInputVal('netname')); net.phase = 'guestjoin'; netNotice = ''; } break;
    case 'net-guest-join': if (net) { netNotice = ''; net.guestJoin(net.myName, netInputVal('netoffer')); return; } break;
    case 'net-copy': {
      const t = document.getElementById(d.from);
      if (t) { t.select(); try { navigator.clipboard.writeText(t.value); netNotice = '복사됐어요.'; } catch { netNotice = '복사가 안 되면 직접 드래그해서 복사해주세요.'; } }
      break;
    }
    case 'net-leave': if (net) { netHelpOpen = false; modeDone = false; net.end(); return; } break;
    case 'tutorial': startTutorial(); return;
    case 'tut-next': tutAdvance(); return;
    case 'tut-done': tutorial = null; break;
    case 'tut-skip': tutorial = null; break;
    case 'ball': ctrl.toggleBall(d.color); break;
    case 'clear': ctrl.clearSelection(); break;
    case 'confirm-balls': {
      const colors = [...ctrl.balls];
      const snap = snapshotMovables();
      ctrl.confirmBalls();
      if (tutorial && tutorial.step === 0) tutorial.step = 1;
      render();
      flyBalls(snap, colors, document.getElementById('me'));
      return;
    }
    case 'card': ctrl.openCard(d.card); break;
    case 'deck': ctrl.openDeck(d.tier); break;
    case 'close': ctrl.closeSheet(); break;
    case 'buy': {
      const snap = snapshotMovables();
      ctrl.buy(d.card);
      if (tutorial && tutorial.step === 1) tutorial.step = 2;
      render();
      flyClone(snap.get('card:' + d.card), document.getElementById('me'));
      return;
    }
    case 'reserve': {
      const snap = snapshotMovables();
      ctrl.reserveCard(d.card);
      if (tutorial && tutorial.step === 1) tutorial.step = 2;
      render();
      flyClone(snap.get('card:' + d.card), document.getElementById('me'));
      return;
    }
    case 'reserve-deck': ctrl.reserveDeck(d.tier); break;
    case 'discard': ctrl.toggleDiscard(d.token); break;
    case 'undiscard': ctrl.undoDiscard(d.token); break;
    case 'confirm-discard': ctrl.confirmDiscard(); break;
    case 'evolve': ctrl.evolve(d.card); break;
    case 'skip-evolve': ctrl.skipEvolve(); break;
    case 'pass': ctrl.pass(); break;
    case 'ability': ctrl.armAbility(); break;
    case 'ability-cancel': ctrl.disarmAbility(); break;
    case 'ability-refresh': ctrl.abilityRefresh(d.tier); break;
    default: return;
  }
  render();
});

render();
