/* ======================================================================
   Blackjack Card Counter — Hi-Lo
   Pure vanilla JS. No frameworks, no build step.
   ====================================================================== */

(() => {
  "use strict";

  // ---------- Hi-Lo table ----------
  const HI_LO = {
    "2": 1, "3": 1, "4": 1, "5": 1, "6": 1,
    "7": 0, "8": 0, "9": 0,
    "10": -1, "J": -1, "Q": -1, "K": -1, "A": -1,
  };

  const CARDS_PER_DECK = 52;

  // ---------- State ----------
  const state = {
    runningCount: 0,
    decks: 6,
    cardsDealt: 0,          // total cards removed from shoe
    history: [],            // { card, delta } in order
  };

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const runningEl = $("runningCount");
  const runningHintEl = $("runningHint");
  const trueEl = $("trueCount");
  const trueHintEl = $("trueHint");
  const decksLeftHintEl = $("decksLeftHint");
  const betUnitsEl = $("betUnits");
  const betHintEl = $("betHint");
  const deckCountEl = $("deckCount");
  const dealtReadoutEl = $("dealtReadout");
  const penFillEl = $("penFill");
  const penBarEl = $("penBar");
  const penPctEl = $("penPct");
  const decksLeftEl = $("decksLeft");
  const historyRailEl = $("historyRail");
  const historyMetaEl = $("historyMeta");
  const countRunningCard = document.querySelector(".count-running");
  const countTrueCard = document.querySelector(".count-true");
  const countBetCard = document.querySelector(".count-bet");

  // ---------- Classification helper ----------
  function bucket(card) {
    const d = HI_LO[card];
    if (d > 0) return "low";
    if (d < 0) return "high";
    return "mid";
  }

  // ---------- Bet guide ----------
  function betFromTrue(tc) {
    if (tc < 1) return { units: 1, label: "flat bet" };
    if (tc < 2) return { units: 1, label: "flat bet" };
    if (tc < 3) return { units: 2, label: "slight edge" };
    if (tc < 4) return { units: 4, label: "strong edge" };
    if (tc < 5) return { units: 6, label: "big edge" };
    return { units: 8, label: "max spread" };
  }

  // ---------- Core render ----------
  function render({ animate = false } = {}) {
    const cardsRemaining = Math.max(0, state.decks * CARDS_PER_DECK - state.cardsDealt);
    const decksLeft = cardsRemaining / CARDS_PER_DECK;
    const safeDecksLeft = Math.max(decksLeft, 0.25); // floor to avoid divide-by-near-zero
    const tc = state.runningCount / safeDecksLeft;

    // Running count
    runningEl.textContent = (state.runningCount > 0 ? "+" : "") + state.runningCount;
    countRunningCard.classList.toggle("hot", state.runningCount > 0);
    countRunningCard.classList.toggle("cold", state.runningCount < 0);
    runningHintEl.textContent =
      state.runningCount > 0 ? "player favourable"
      : state.runningCount < 0 ? "house favourable"
      : "neutral";

    // True count
    const tcDisplay = (decksLeft <= 0)
      ? "—"
      : (tc >= 0 ? "+" : "") + tc.toFixed(1);
    trueEl.textContent = tcDisplay;
    countTrueCard.classList.toggle("hot", tc >= 1);
    countTrueCard.classList.toggle("cold", tc <= -1);
    decksLeftHintEl.textContent = decksLeft.toFixed(1);

    // Bet guide (only meaningful with cards left)
    const bet = betFromTrue(tc);
    if (decksLeft <= 0) {
      betUnitsEl.textContent = "—";
      betHintEl.textContent = "shuffle time";
    } else {
      betUnitsEl.textContent = bet.units + "×";
      betHintEl.textContent = bet.label;
    }
    countBetCard.classList.toggle("hot", bet.units >= 2 && decksLeft > 0);

    // Deck readout
    deckCountEl.textContent = state.decks;
    const total = state.decks * CARDS_PER_DECK;
    dealtReadoutEl.textContent = `${state.cardsDealt} / ${total}`;
    const pct = total > 0 ? (state.cardsDealt / total) * 100 : 0;
    penFillEl.style.width = pct.toFixed(1) + "%";
    penBarEl.setAttribute("aria-valuenow", pct.toFixed(0));
    penPctEl.textContent = pct.toFixed(0) + "% penetration";
    decksLeftEl.textContent = decksLeft.toFixed(1) + " decks left";

    // History meta
    historyMetaEl.textContent = state.history.length === 0
      ? "—"
      : `${state.history.length} card${state.history.length === 1 ? "" : "s"}`;

    if (animate) {
      countRunningCard.classList.remove("pulse");
      countTrueCard.classList.remove("pulse");
      // force reflow so animation restarts
      void countRunningCard.offsetWidth;
      countRunningCard.classList.add("pulse");
      countTrueCard.classList.add("pulse");
    }
  }

  function addMiniCard(card) {
    const el = document.createElement("div");
    el.className = "mini-card " + bucket(card);
    el.textContent = card;
    historyRailEl.appendChild(el);
    // keep scroll pinned to the end
    historyRailEl.scrollLeft = historyRailEl.scrollWidth;
    // cap visible history to last 40 for perf
    while (historyRailEl.children.length > 40) {
      historyRailEl.removeChild(historyRailEl.firstChild);
    }
  }

  function removeLastMiniCard() {
    const last = historyRailEl.lastElementChild;
    if (last) historyRailEl.removeChild(last);
  }

  // ---------- Actions ----------
  function applyCard(card, sourceButton) {
    const delta = HI_LO[card];
    if (delta === undefined) return;

    // Guard: if shoe is empty, just ignore
    const cardsRemaining = state.decks * CARDS_PER_DECK - state.cardsDealt;
    if (cardsRemaining <= 0) return;

    state.runningCount += delta;
    state.cardsDealt += 1;
    state.history.push({ card, delta });
    addMiniCard(card);
    render({ animate: true });

    if (sourceButton) {
      sourceButton.classList.remove("flash");
      void sourceButton.offsetWidth;
      sourceButton.classList.add("flash");
    }
  }

  function undo() {
    if (state.history.length === 0) return;
    const last = state.history.pop();
    state.runningCount -= last.delta;
    state.cardsDealt = Math.max(0, state.cardsDealt - 1);
    removeLastMiniCard();
    render({ animate: true });
  }

  function newShoe() {
    state.runningCount = 0;
    state.cardsDealt = 0;
    state.history = [];
    historyRailEl.innerHTML = "";
    render({ animate: true });
  }

  function fullReset() {
    state.decks = 6;
    newShoe();
  }

  function changeDecks(delta) {
    const next = Math.max(1, Math.min(12, state.decks + delta));
    if (next === state.decks) return;
    state.decks = next;
    // clamp dealt if user shrank the shoe
    state.cardsDealt = Math.min(state.cardsDealt, state.decks * CARDS_PER_DECK);
    render();
  }

  // ---------- Wire up count pane ----------
  document.querySelectorAll(".card-btn").forEach((btn) => {
    btn.addEventListener("click", () => applyCard(btn.dataset.card, btn));
  });
  document.querySelectorAll(".step").forEach((btn) => {
    btn.addEventListener("click", () => {
      const delta = btn.dataset.deck === "+1" ? +1 : -1;
      changeDecks(delta);
    });
  });
  $("undoBtn").addEventListener("click", undo);
  $("shuffleBtn").addEventListener("click", newShoe);
  $("resetBtn").addEventListener("click", fullReset);

  // ---------- Tabs ----------
  const panes = {
    count: document.querySelector('[data-pane="count"]'),
    practice: document.querySelector('[data-pane="practice"]'),
    help: document.querySelector('[data-pane="help"]'),
  };
  const tabs = document.querySelectorAll(".tab");
  let currentMode = "count";

  function setMode(mode) {
    if (!panes[mode]) return;
    currentMode = mode;
    Object.entries(panes).forEach(([key, el]) => {
      el.classList.toggle("hidden", key !== mode);
    });
    tabs.forEach((t) => {
      const active = t.dataset.mode === mode;
      t.classList.toggle("active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
    });
    if (mode !== "practice") practice.stop();
  }
  tabs.forEach((t) => t.addEventListener("click", () => setMode(t.dataset.mode)));

  // ---------- Keyboard ----------
  document.addEventListener("keydown", (e) => {
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;

    const key = e.key;
    const upper = key.toUpperCase();

    if (currentMode === "count") {
      if (/^[2-9]$/.test(key)) {
        const btn = document.querySelector(`.card-btn[data-card="${key}"]`);
        if (btn) applyCard(key, btn);
      } else if (key === "0" || upper === "T") {
        const btn = document.querySelector(`.card-btn[data-card="10"]`);
        if (btn) applyCard("10", btn);
      } else if (["J", "Q", "K", "A"].includes(upper)) {
        const btn = document.querySelector(`.card-btn[data-card="${upper}"]`);
        if (btn) applyCard(upper, btn);
      } else if (upper === "U" || key === "Backspace") {
        e.preventDefault();
        undo();
      } else if (upper === "R") {
        newShoe();
      } else if (key === "[") {
        changeDecks(-1);
      } else if (key === "]") {
        changeDecks(+1);
      }
    }

    if (key === "?") {
      setMode("help");
    }
  });

  // ---------- Practice mode ----------
  const practice = (() => {
    const flashCard = $("flashCard");
    const flashFace = $("flashFace");
    const shownEl = $("practiceShown");
    const actualEl = $("practiceActual");
    const answerEl = $("practiceAnswer");
    const guessEl = $("practiceGuess");
    const toggleBtn = $("practiceToggle");
    const checkBtn = $("practiceCheck");
    const resetBtn = $("practiceReset");
    const resultEl = $("practiceResult");
    const speedEl = $("speedSlider");
    const speedLabel = $("speedLabel");

    const CARDS = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];

    let count = 0;
    let shown = 0;
    let running = false;
    let timer = null;
    let speed = parseInt(speedEl.value, 10);

    function drawCard() {
      const card = CARDS[Math.floor(Math.random() * CARDS.length)];
      count += HI_LO[card];
      shown += 1;
      flashFace.textContent = card;
      flashCard.className = "flash-card flip " + bucket(card);
      // re-trigger animation
      void flashCard.offsetWidth;
      flashCard.classList.add("flip");
      shownEl.textContent = shown;
      actualEl.textContent = "hidden";
    }

    function tick() {
      drawCard();
    }

    function start() {
      if (running) return;
      running = true;
      toggleBtn.textContent = "Pause";
      resultEl.classList.add("hidden");
      tick();
      timer = setInterval(tick, speed);
    }

    function stop() {
      running = false;
      toggleBtn.textContent = shown === 0 ? "Start" : "Resume";
      if (timer) clearInterval(timer);
      timer = null;
    }

    function reset() {
      stop();
      count = 0;
      shown = 0;
      flashFace.textContent = "♠";
      flashCard.className = "flash-card";
      shownEl.textContent = "0";
      actualEl.textContent = "—";
      answerEl.textContent = "—";
      guessEl.value = "";
      resultEl.classList.add("hidden");
      toggleBtn.textContent = "Start";
    }

    function check() {
      const raw = guessEl.value.trim();
      if (raw === "") return;
      const guess = parseInt(raw, 10);
      if (Number.isNaN(guess)) return;
      stop();
      answerEl.textContent = (guess >= 0 ? "+" : "") + guess;
      actualEl.textContent = (count >= 0 ? "+" : "") + count;
      const correct = guess === count;
      resultEl.classList.remove("hidden", "correct", "wrong");
      resultEl.classList.add(correct ? "correct" : "wrong");
      resultEl.textContent = correct
        ? `✓ Nailed it. Running count was ${count >= 0 ? "+" : ""}${count} over ${shown} cards.`
        : `✗ Off by ${Math.abs(guess - count)}. Actual count was ${count >= 0 ? "+" : ""}${count}.`;
    }

    toggleBtn.addEventListener("click", () => (running ? stop() : start()));
    checkBtn.addEventListener("click", check);
    resetBtn.addEventListener("click", reset);
    guessEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") check();
    });
    speedEl.addEventListener("input", () => {
      speed = parseInt(speedEl.value, 10);
      speedLabel.textContent = (speed / 1000).toFixed(1);
      if (running) {
        clearInterval(timer);
        timer = setInterval(tick, speed);
      }
    });

    return { stop, reset };
  })();

  // ---------- Initial paint ----------
  render();
})();
