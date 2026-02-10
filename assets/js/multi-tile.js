// ===== CHEMSAGA — assets/js/multi-tile.js (FINAL & COMPLETE VERSION) =====

// Dynamic WebSocket URL based on current environment
const WS_PROTO = (location.protocol === 'https:') ? 'wss' : 'ws';
const WS_HOST  = location.hostname || '127.0.0.1';
const WS_PORT  = 8081; // Must match your game-server.js port
const GAME_WS_URL = `${WS_PROTO}://${WS_HOST}:${WS_PORT}`;

class MultiTileGame {
  constructor(ws, session) {
    this.ws = ws;                   // WebSocket connection
    this.session = session;         // Contains uid, room_id, username, etc.
    this.gameOver = false;          // Prevents actions after game ends
    this.players = new Map();       // Live player state (uid → { pos, score })

    console.log('%cMultiTileGame initialized for UID:', 'color: #4CAF50; font-weight: bold', this.session.uid);

    this.setupWsListener();
  }

  setupWsListener() {
    if (!this.ws) {
      console.error('WebSocket is null. Cannot set up listeners.');
      return;
    }

    this.ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch (e) {
        console.warn('Received invalid JSON:', event.data);
        return;
      }

      // Ignore messages from other rooms
      if (
  msg.room_id &&
  parseInt(msg.room_id, 10) !== parseInt(this.session.room_id, 10)
) return;


      // Initial state sync from server
      if (msg.type === 'state.sync') {
        this.players.clear();
        msg.players.forEach(p => this.players.set(p.uid, p));

        this.renderTiles();
        this.updatePlayerPanel();
        this.startGameTimer(msg.config.game_time_sec);
        this.updateAnsweredTiles(msg.answeredTiles || []);
        return;
      }

      // Player left the game (graceful or disconnect)
      if (msg.type === 'player.left') {
        const username = msg.username || msg.uid || 'Unknown';
        this.showNotification(`${username} has left the match.`);
        this.players.delete(msg.uid);
        this.updatePlayerPanel();
        console.log('PLAYER LEFT EVENT RECEIVED:', msg);
        return;
        
      }

      // Game over — from timer or server decision
      // Game over — authoritative from server (timer / quit / disconnect)
if (msg.type === 'game.over') {
  if (this.gameOver) return;
  this.gameOver = true;

  console.log('%cGAME OVER', 'color:red;font-size:16px;');
  console.table(msg.results || []);

  // Show final results (includes quit players)
  this.showResultsModal(msg.results || [], msg.reason || 'normal');

  return;
}


      // Roll result
      if (msg.type === 'roll.result') {
        this.handleRollResult(msg.uid, msg.roll);
        return;
      }

      // Move commit
      if (msg.type === 'move.commit') {
        const player = this.players.get(msg.uid);
        if (player) {
          player.pos = msg.to;
          this.movePlayerPiece(msg.uid, msg.from, msg.to);
        }
        return;
      }

      // Question show
      if (msg.type === 'question.show') {
        this.showQuestion(msg);
        return;
      }

      // Answer result
      if (msg.type === 'answer.result') {
        this.handleAnswerResult(msg);
        return;
      }

      // Turn update
      if (msg.type === 'turn.update') {
        this.highlightCurrentTurn(msg.turnUid);
        return;
      }

      // Add more handlers as needed...
      
    };

    // Optional: Handle connection close
    this.ws.onclose = () => {
      if (!this.gameOver) {
        console.warn('WebSocket closed unexpectedly.');
        this.showNotification('Connection lost. Returning to lobby...');
        setTimeout(() => this.forceRedirectToLobby(), 3000);
      }
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
  }

  // Render game board tiles
  renderTiles() {
    console.log('Rendering tiles with current player positions...');
    // Your tile rendering logic here
  }

  // Update sidebar player list
  updatePlayerPanel() {
    console.log(`Updating player panel — ${this.players.size} players online`);
    // Update DOM with current players
  }

  // Show toast/notification
  showNotification(message) {
    console.log(`%c[NOTIFICATION] ${message}`, 'background: #222; color: #bada55; padding: 4px 8px; border-radius: 4px;');
    // Implement toast UI if needed
    alert(message); // fallback
  }

  // ⭐ NEW HELPER: Forcing Redirection
forceRedirectToLobby() {
    // Redirect in scene2.html
    window.location.href = 'scene2.html'; 
}

// ⭐  Quit Logic
quitGameGracefully() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket not open or not connected. Redirecting...');
        this.forceRedirectToLobby();
        return;
    }

    // 1. Send quit message to server
    this.ws.send(JSON.stringify({
        type: 'player.quit',
        room_id: this.session.room_id,
        uid: this.session.uid,
        username: this.session.username || this.session.uid
    }));

    // 2. Locally mark game over
    this.gameOver = true;

    // 3. Close WS to trigger server-side removal
    this.ws.close(1000, 'Player quit gracefully');

    // 4. Redirect
    console.log('You quit the game. Redirecting...');
    this.forceRedirectToLobby();

    // Forcefully unlock turn logic on client
this.moveInProgress = false;
this.rollInFlight = false;
this.diceIsAnimating = false;
this.pendingQuestion = null;

clearAllTimeouts();
this.stopRollTimer();

if (this.questionOverlay) {
    this.questionOverlay.remove();
    this.questionOverlay = null;
}

}


  

  // Placeholder methods — implement these in your full version
  startGameTimer(seconds) { console.log(`Game timer started: ${seconds}s`); }
  updateAnsweredTiles(tiles) { console.log('Answered tiles:', tiles); }
  handleRollResult(uid, roll) { console.log(`${uid} rolled: ${roll}`); }
  movePlayerPiece(uid, from, to) { console.log(`${uid} moved from ${from} → ${to}`); }
  showQuestion(msg) { console.log('Question shown:', msg.q); }
  handleAnswerResult(msg) { console.log(`Answer ${msg.correct ? 'Correct' : 'Wrong'}!`); }
  highlightCurrentTurn(uid) { console.log(`Now ${uid}'s turn`); }
}

// Auto-attach to global boot instance (used by quit.js and others)
document.addEventListener('DOMContentLoaded', () => {
  if (window.ChemsagaMultiTileBoot) {
    console.log('%cMultiTileGame class ready and attached.', 'color: cyan');
  }
});

// ---- Elements list (1–100) ----
const elements = [
  { number: 1, symbol: 'H',  name: 'Hydrogen',  category: 'nonmetal',       icon: '💧' },
  { number: 2, symbol: 'He', name: 'Helium',    category: 'noble-gas',      icon: '🎈' },
  { number: 3, symbol: 'Li', name: 'Lithium',   category: 'alkali-metal',   icon: '🔋' },
  { number: 4, symbol: 'Be', name: 'Beryllium', category: 'alkaline-earth', icon: '🛠️' },
  { number: 5, symbol: 'B',  name: 'Boron',     category: 'metalloid',      icon: '🧪' },
  { number: 6, symbol: 'C',  name: 'Carbon',    category: 'nonmetal',       icon: '💎' },
  { number: 7, symbol: 'N',  name: 'Nitrogen',  category: 'nonmetal',       icon: '🌬️' },
  { number: 8, symbol: 'O',  name: 'Oxygen',    category: 'nonmetal',       icon: '🫁' },
  { number: 9, symbol: 'F',  name: 'Fluorine',  category: 'halogen',        icon: '🦷' },
  { number: 10, symbol: 'Ne', name: 'Neon',     category: 'noble-gas',      icon: '💡' },
  { number: 11, symbol: 'Na', name: 'Sodium',   category: 'alkali-metal',   icon: '🧂' },
  { number: 12, symbol: 'Mg', name: 'Magnesium',category: 'alkaline-earth', icon: '🔥' },
  { number: 13, symbol: 'Al', name: 'Aluminum', category: 'post-transition',icon: '🥫' },
  { number: 14, symbol: 'Si', name: 'Silicon',  category: 'metalloid',      icon: '💻' },
  { number: 15, symbol: 'P',  name: 'Phosphorus',category:'nonmetal',       icon: '🕯️' },
  { number: 16, symbol: 'S',  name: 'Sulfur',   category: 'nonmetal',       icon: '🌋' },
  { number: 17, symbol: 'Cl', name: 'Chlorine', category: 'halogen',        icon: '🏊' },
  { number: 18, symbol: 'Ar', name: 'Argon',    category: 'noble-gas',      icon: '🛡️' },
  { number: 19, symbol: 'K',  name: 'Potassium',category: 'alkali-metal',   icon: '🍌' },
  { number: 20, symbol: 'Ca', name: 'Calcium',  category: 'alkaline-earth', icon: '🦴' },
  { number: 21, symbol: 'Sc', name: 'Scandium', category: 'transition-metal', icon:'🚴' },
  { number: 22, symbol: 'Ti', name: 'Titanium', category: 'transition-metal', icon:'✈️' },
  { number: 23, symbol: 'V',  name: 'Vanadium', category: 'transition-metal', icon:'🔧' },
  { number: 24, symbol: 'Cr', name: 'Chromium', category: 'transition-metal', icon:'🚗' },
  { number: 25, symbol: 'Mn', name: 'Manganese',category:'transition-metal', icon:'⚒️' },
  { number: 26, symbol: 'Fe', name: 'Iron',     category:'transition-metal', icon:'🧲' },
  { number: 27, symbol: 'Co', name: 'Cobalt',   category:'transition-metal', icon:'🩺' },
  { number: 28, symbol: 'Ni', name: 'Nickel',   category:'transition-metal', icon:'🪙' },
  { number: 29, symbol: 'Cu', name: 'Copper',   category:'transition-metal', icon:'🔌' },
  { number: 30, symbol: 'Zn', name: 'Zinc',     category:'transition-metal', icon:'🛬' },
  { number: 31, symbol: 'Ga', name: 'Gallium',  category:'post-transition',  icon:'🌡️' },
  { number: 32, symbol: 'Ge', name: 'Germanium',category:'metalloid',        icon:'📡' },
  { number: 33, symbol: 'As', name: 'Arsenic',  category:'metalloid',        icon:'☠️' },
  { number: 34, symbol: 'Se', name: 'Selenium', category:'nonmetal',         icon:'📷' },
  { number: 35, symbol: 'Br', name: 'Bromine',  category:'halogen',          icon:'🧯' },
  { number: 36, symbol: 'Kr', name: 'Krypton',  category:'noble-gas',        icon:'💡' },
  { number: 37, symbol: 'Rb', name: 'Rubidium', category:'alkali-metal',     icon:'⏱️' },
  { number: 38, symbol: 'Sr', name: 'Strontium',category:'alkaline-earth',   icon:'🎇' },
  { number: 39, symbol: 'Y',  name: 'Yttrium',  category:'transition-metal', icon:'📺' },
  { number: 40, symbol: 'Zr', name: 'Zirconium',category:'transition-metal', icon:'💍' },
  { number: 41, symbol: 'Nb', name: 'Niobium',  category:'transition-metal', icon:'🚢' },
  { number: 42, symbol: 'Mo', name: 'Molybdenum',category:'transition-metal',icon:'🛠️' },
  { number: 43, symbol: 'Tc', name: 'Technetium',category:'transition-metal',icon:'🩻' },
  { number: 44, symbol: 'Ru', name: 'Ruthenium',category:'transition-metal', icon:'💿' },
  { number: 45, symbol: 'Rh', name: 'Rhodium',  category:'transition-metal', icon:'🚘' },
  { number: 46, symbol: 'Pd', name: 'Palladium',category:'transition-metal', icon:'🔩' },
  { number: 47, symbol: 'Ag', name: 'Silver',   category:'transition-metal', icon:'🥄' },
  { number: 48, symbol: 'Cd', name: 'Cadmium',  category:'transition-metal', icon:'🔋' },
  { number: 49, symbol: 'In', name: 'Indium',   category:'post-transition',  icon:'📱' },
  { number: 50, symbol: 'Sn', name: 'Tin',      category:'post-transition',  icon:'🍴' },
  { number: 51, symbol: 'Sb', name: 'Antimony', category:'metalloid',        icon:'🖨️' },
  { number: 52, symbol: 'Te', name: 'Tellurium',category:'metalloid',        icon:'☀️' },
  { number: 53, symbol: 'I',  name: 'Iodine',   category:'halogen',          icon:'🩹' },
  { number: 54, symbol: 'Xe', name: 'Xenon',    category:'noble-gas',        icon:'🚨' },
  { number: 55, symbol: 'Cs', name: 'Cesium',   category:'alkali-metal',     icon:'🕰️' },
  { number: 56, symbol: 'Ba', name: 'Barium',   category:'alkaline-earth',   icon:'🩺' },
  { number: 57, symbol: 'La', name: 'Lanthanum',category:'lanthanide',       icon:'🎥' },
  { number: 58, symbol: 'Ce', name: 'Cerium',   category:'lanthanide',       icon:'🪓' },
  { number: 59, symbol: 'Pr', name: 'Praseodymium',category:'lanthanide',    icon:'🟢' },
  { number: 60, symbol: 'Nd', name: 'Neodymium',category:'lanthanide',       icon:'🧲' },
  { number: 61, symbol: 'Pm', name: 'Promethium',category:'lanthanide',      icon:'☢️' },
  { number: 62, symbol: 'Sm', name: 'Samarium', category:'lanthanide',       icon:'🎧' },
  { number: 63, symbol: 'Eu', name: 'Europium', category:'lanthanide',       icon:'🟥' },
  { number: 64, symbol: 'Gd', name: 'Gadolinium',category:'lanthanide',      icon:'🩺' },
  { number: 65, symbol: 'Tb', name: 'Terbium',  category:'lanthanide',       icon:'🟩' },
  { number: 66, symbol: 'Dy', name: 'Dysprosium',category:'lanthanide',      icon:'💾' },
  { number: 67, symbol: 'Ho', name: 'Holmium',  category:'lanthanide',       icon:'🔬' },
  { number: 68, symbol: 'Er', name: 'Erbium',   category:'lanthanide',       icon:'📡' },
  { number: 69, symbol: 'Tm', name: 'Thulium',  category:'lanthanide',       icon:'🩻' },
  { number: 70, symbol: 'Yb', name: 'Ytterbium',category:'lanthanide',       icon:'⚖️' },
  { number: 71, symbol: 'Lu', name: 'Lutetium', category:'lanthanide',       icon:'💉' },
  { number: 72, symbol: 'Hf', name: 'Hafnium',  category:'transition-metal', icon:'🛩️' },
  { number: 73, symbol: 'Ta', name: 'Tantalum', category:'transition-metal', icon:'📲' },
  { number: 74, symbol: 'W',  name: 'Tungsten', category:'transition-metal', icon:'💡' },
  { number: 75, symbol: 'Re', name: 'Rhenium',  category:'transition-metal', icon:'🚀' },
  { number: 76, symbol: 'Os', name: 'Osmium',   category:'transition-metal', icon:'⚖️' },
  { number: 77, symbol: 'Ir', name: 'Iridium',  category:'transition-metal', icon:'🪐' },
  { number: 78, symbol: 'Pt', name: 'Platinum', category:'transition-metal', icon:'💍' },
  { number: 79, symbol: 'Au', name: 'Gold',     category:'transition-metal', icon:'🏆' },
  { number: 80, symbol: 'Hg', name: 'Mercury',  category:'transition-metal', icon:'🌡️' },
  { number: 81, symbol: 'Tl', name: 'Thallium', category:'post-transition',  icon:'⚠️' },
  { number: 82, symbol: 'Pb', name: 'Lead',     category:'post-transition',  icon:'🪨' },
  { number: 83, symbol: 'Bi', name: 'Bismuth',  category:'post-transition',  icon:'💊' },
  { number: 84, symbol: 'Po', name: 'Polonium', category:'metalloid',        icon:'☢️' },
  { number: 85, symbol: 'At', name: 'Astatine', category:'halogen',          icon:'🧬' },
  { number: 86, symbol: 'Rn', name: 'Radon',    category:'noble-gas',        icon:'🏠' },
  { number: 87, symbol: 'Fr', name: 'Francium', category:'alkali-metal',     icon:'⚡' },
  { number: 88, symbol: 'Ra', name: 'Radium',   category:'alkaline-earth',   icon:'🕰️' },
  { number: 89, symbol: 'Ac', name: 'Actinium', category:'actinide',         icon:'🌟' },
  { number: 90, symbol: 'Th', name: 'Thorium',  category:'actinide',         icon:'⚛️' },
  { number: 91, symbol: 'Pa', name: 'Protactinium',category:'actinide',      icon:'🔬' },
  { number: 92, symbol: 'U',  name: 'Uranium',  category:'actinide',         icon:'☢️' },
  { number: 93, symbol: 'Np', name: 'Neptunium',category:'actinide',         icon:'🔭' },
  { number: 94, symbol: 'Pu', name: 'Plutonium',category:'actinide',         icon:'💣' },
  { number: 95, symbol: 'Am', name: 'Americium',category:'actinide',         icon:'🚨' },
  { number: 96, symbol: 'Cm', name: 'Curium',   category:'actinide',         icon:'🔬' },
  { number: 97, symbol: 'Bk', name: 'Berkelium',category:'actinide',         icon:'🧪' },
  { number: 98, symbol: 'Cf', name: 'Californium',category:'actinide',       icon:'🔍' },
  { number: 99, symbol: 'Es', name: 'Einsteinium',category:'actinide',       icon:'🧠' },
  { number: 100,symbol:'Fm', name: 'Fermium',   category:'actinide',         icon:'🔬' }
];

// ---- DOM refs ----
const gridContainer      = document.getElementById('gridContainer');
const diceEl             = document.getElementById('dice');
const rollBtn            = document.getElementById('rollBtn');
const gameTimerEl        = document.getElementById('game-timer');
const rollTimerContainer = document.getElementById('rollTimerContainer');
const rollTimerEl        = document.getElementById('roll-timer');

function setText(el, txt) { if (el) el.textContent = txt; }

// ---- timeout helpers ----
let activeTimeouts = [];
function setSafeTimeout(fn, ms) {
  const id = setTimeout(() => {
    activeTimeouts = activeTimeouts.filter(x => x !== id);
    fn();
  }, ms);
  activeTimeouts.push(id);
  return id;
}
function clearAllTimeouts() {
  activeTimeouts.forEach(clearTimeout);
  activeTimeouts = [];
}

// Pull avatar src by uid from roster
function getAvatarForUid(uid) {
  const img = document.querySelector(`.player[data-uid="${uid}"] .avatar-img`);
  return img ? img.getAttribute('src') : './assets/img/c4.png';
}

const ChemsagaMultiTileBoot = {
  quitGameGracefully() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        console.warn('WS not connected. Redirecting...');
        window.location.href = 'scene2.html';
        return;
    }

    // Send quit message to server
    this.ws.send(JSON.stringify({
        type: 'player.quit',
        room_id: this.session.room_id,
        uid: this.session.uid,
        username: this.session.username || this.session.uid
    }));

    // Prevent further actions
    this.gameOver = true;

    try { this.ws.close(1000, 'Player quit'); } catch {}

    window.location.href = 'scene2.html';
},

  session: null,
  ws: null,

  tiles: [],
  tileCenters: [],
  tokenSize: 28,

  players: new Map(), // uid -> { uid, pos, score, tokenEl }
  turnUid: null,

  gameConfig: { game_time_sec: 1200, time_per_question_sec: 10 },
  gameTimeLeft: 1200,
  gameTimerInterval: null,

  // dice & movement
  diceIsAnimating: false,
  pendingMove: null,
  rollInFlight: false,

  // movement + question sync
  moveInProgress: false,
  pendingQuestion: null,

  // roll timer
  rollTimerInterval: null,

  // questions
  questionOverlay: null,
  questionTick: null,

  // tiles answered correctly (dimmed + should be skipped)
  answeredTiles: new Set(),

  // game over state
  gameOver: false,

  start(session) {
    this.session = session;
    this.createGrid();
    this.computeTileCenters();
    window.addEventListener('resize', () => {
      this.computeTileCenters();
      requestAnimationFrame(() => this.computeTileCenters());
    });

    this.bindUI();
    this.connectWS();
  },
  // ---- Board ----
  createGrid() {
    this.tiles = [];
    gridContainer.innerHTML = '';
    elements.forEach((e, i) => {
      const tile = document.createElement('div');
      tile.className = `element-tile ${e.category}`;
      tile.dataset.index = i;
      tile.dataset.number = e.number;

      const symbol = document.createElement('div');
      symbol.className = 'symbol';
      symbol.textContent = e.symbol;

      const icon = document.createElement('div');
      icon.className = 'icon';
      icon.textContent = e.icon;

      tile.appendChild(symbol);
      tile.appendChild(icon);
      gridContainer.appendChild(tile);
      this.tiles.push(tile);
    });
  },

  computeTileCenters() {
    this.tileCenters = this.tiles.map(tile => {
      const left = tile.offsetLeft + tile.offsetWidth / 2 - this.tokenSize / 2;
      const top  = tile.offsetTop  + tile.offsetHeight / 2 - this.tokenSize / 2;
      return { left: Math.round(left), top: Math.round(top) };
    });
    for (const p of this.players.values()) {
      this.placeToken(p.uid, p.pos, true);
    }
  },

  // ---- Players & Tokens ----
  ensurePlayer(uid) {
    uid = String(uid);
    let p = this.players.get(uid);
    if (!p) {
      const token = document.createElement('div');
      token.className = 'token token-avatar';
      token.id = `token-${uid}`;
      token.style.width = this.tokenSize + 'px';
      token.style.height = this.tokenSize + 'px';
      token.style.left = '-9999px';
      token.style.top  = '-9999px';

      const avatar = document.createElement('div');
      avatar.className = 'token-img';
      avatar.style.backgroundImage = `url("${getAvatarForUid(uid)}")`;
      token.appendChild(avatar);

      gridContainer.appendChild(token);
      p = { uid, pos: 0, score: 0, tokenEl: token };
      this.players.set(uid, p);
    } else {
      const avatar = p.tokenEl?.querySelector('.token-img');
      if (avatar) avatar.style.backgroundImage = `url("${getAvatarForUid(uid)}")`;
    }
    return p;
  },

  placeToken(uid, pos, instant = false) {
    const p = this.ensurePlayer(uid);
    const clamped = Math.max(0, Math.min(elements.length - 1, pos));
    p.pos = clamped;

    const center = this.tileCenters[clamped];
    if (!center) return;
    const token = p.tokenEl;
    if (!token) return;

    if (instant) {
      const prev = token.style.transition;
      token.style.transition = 'none';
      token.style.left = center.left + 'px';
      token.style.top  = center.top  + 'px';
      token.offsetHeight;
      token.style.transition = prev || '';
    } else {
      token.style.transition = 'left 180ms linear, top 180ms linear';
      token.style.left = center.left + 'px';
      token.style.top  = center.top  + 'px';
    }
  },

  // 🔁 Movement animation that SKIPS answered (dimmed) tiles
  animateMove(uid, from, to, done) {
    from = Math.max(0, from);
    to   = Math.max(0, Math.min(elements.length - 1, to));

    const steps = [];

    if (to >= from) {
      for (let i = from + 1; i <= to; i++) {
        if (!this.answeredTiles.has(i)) steps.push(i);
      }
    } else {
      for (let i = from - 1; i >= to; i--) {
        if (!this.answeredTiles.has(i)) steps.push(i);
      }
    }

    this.moveInProgress = true;

    if (!steps.length) {
      this.placeToken(uid, to, true);
      this.moveInProgress = false;
      done && done();
      return;
    }

    steps.forEach((pos, idx) => {
      setSafeTimeout(() => {
        this.placeToken(uid, pos, false);
        this.bounceTile(pos);
        if (idx === steps.length - 1) {
          this.moveInProgress = false;
          done && done();
        }
      }, (idx + 1) * 200);
    });
  },

  bounceTile(i) {
    const tile = this.tiles[i];
    if (!tile) return;
    tile.classList.remove('tile-bounce');
    void tile.offsetWidth;
    tile.classList.add('tile-bounce');
    setSafeTimeout(() => tile.classList.remove('tile-bounce'), 250);
  },

  // ---- UI & Turn ----
  bindUI() {
    if (rollBtn) {
      rollBtn.addEventListener('click', () => {
        if (!this.ws || this.ws.readyState !== 1) return;
        if (this.turnUid !== this.session.uid) return;
        if (this.questionOverlay) return;
        if (this.gameOver) return;
        if (this.rollInFlight) return;
        this.rollInFlight = true;
        this.send('roll.request', { room_id: this.session.room_id });
      });
    }
    if (diceEl) {
      diceEl.addEventListener('click', () => {
        if (rollBtn && !rollBtn.disabled) rollBtn.click();
      });
    }
  },

  // 5s turn timer (no auto-roll, just pass turn)
  startRollTimer() {
    const myTurn = this.turnUid === this.session.uid;

    if (!myTurn || this.questionOverlay || this.gameOver) {
      this.stopRollTimer();
      rollTimerContainer?.classList.remove('visible');
      return;
    }

    this.stopRollTimer();

    let left = 5;
    setText(rollTimerEl, left);
    rollTimerContainer?.classList.add('visible');

    let firstTick = true;
    this.rollTimerInterval = setInterval(() => {
      if (this.turnUid !== this.session.uid || this.questionOverlay || this.gameOver) {
        this.stopRollTimer();
        return;
      }

      if (firstTick) { firstTick = false; return; }

      left--;
      setText(rollTimerEl, left);

      if (left <= 0) {
        this.stopRollTimer();
        this.rollInFlight = false;
        this.send('turn.skip', { room_id: this.session.room_id });

        if (rollBtn) {
          rollBtn.disabled = true;
          rollBtn.textContent = 'Passing…';
        }
      }
    }, 1000);
  },

  stopRollTimer() {
    if (this.rollTimerInterval) {
      clearInterval(this.rollTimerInterval);
      this.rollTimerInterval = null;
    }
    rollTimerContainer?.classList.remove('visible');
  },

  updateTurnHighlight() {
    document.querySelectorAll('.player').forEach(r => r.classList.remove('active'));
    if (this.turnUid) {
      const row = document.querySelector(`.player[data-uid="${this.turnUid}"]`);
      if (row) row.classList.add('active');
    }
    if (rollBtn) {
      const myTurn = this.turnUid === this.session.uid;
      rollBtn.disabled = !myTurn || !!this.questionOverlay || this.gameOver;
      rollBtn.textContent = myTurn
        ? (this.questionOverlay ? 'Answering...' : 'Roll')
        : 'Waiting...';
    }
    this.startRollTimer();
  },

  // Main game clock
  startGameClock() {
    if (this.gameTimerInterval) return;

    this.gameTimeLeft = this.gameConfig.game_time_sec || 1200;

    const tick = () => {
      if (this.gameOver) {
        clearInterval(this.gameTimerInterval);
        this.gameTimerInterval = null;
        return;
      }

      if (this.gameTimeLeft <= 0) {
        setText(gameTimerEl, '00:00');
        clearInterval(this.gameTimerInterval);
        this.gameTimerInterval = null;
        // client → server: time is up
        this.send('game.timeup', { room_id: this.session.room_id });
        return;
      }

      const m = Math.floor(this.gameTimeLeft / 60);
      const s = this.gameTimeLeft % 60;
      setText(
        gameTimerEl,
        `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
      this.gameTimeLeft--;
    };

    tick();
    this.gameTimerInterval = setInterval(tick, 1000);
  },

  handleTimeUp() {
    if (this.gameOver) return;
    this.gameOver = true;

    this.stopRollTimer();
    clearAllTimeouts();
    if (this.gameTimerInterval) {
      clearInterval(this.gameTimerInterval);
      this.gameTimerInterval = null;
    }

    if (rollBtn) {
      rollBtn.disabled = true;
      rollBtn.textContent = "Time's Up";
    }

    if (this.questionOverlay) {
      this.questionOverlay.remove();
      this.questionOverlay = null;
    }
    if (this.questionTick) {
      clearInterval(this.questionTick);
      this.questionTick = null;
    }

    this.updateTurnHighlight();
    this.showGameOverOverlay();
  },

  // 🎯 Time's Up overlay with FULL leaderboard (all players)
  showGameOverOverlay() {
    if (!this.players || this.players.size === 0) return;

    // Collect state + UI info
    const arr = Array.from(this.players.values()).map(p => {
      const uid = String(p.uid);
      const score = p.score || 0;

      const row = document.querySelector(`.player[data-uid="${uid}"]`);
      const name =
        row?.querySelector('.player-name')?.textContent.trim() ||
        row?.querySelector('.name')?.textContent.trim() ||
        `Player ${uid}`;

      const avatarImg = row?.querySelector('.avatar-img');
      const avatar =
        avatarImg?.getAttribute('src') || './assets/img/c4.png';

      return { uid, score, name, avatar };
    });

    if (!arr.length) return;

    // sort by score desc
    arr.sort((a, b) => b.score - a.score);

    const top = arr[0];
    const low = arr[arr.length - 1];

    // build leaderboard rows
    const rowsHtml = arr.map((p, idx) => {
      const rank = idx + 1;
      const isTop = (idx === 0);
      const isLow = (idx === arr.length - 1 && arr.length > 1);
      const badgeClass = isTop ? 'lb-rank top'
                       : isLow ? 'lb-rank low'
                       : 'lb-rank';
      return `
        <div class="lb-row">
          <div class="${badgeClass}">${rank}</div>
          <div class="lb-avatar">
            <img src="${p.avatar}" alt="${p.name}">
          </div>
          <div class="lb-info">
            <div class="lb-name">${p.name}</div>
            <div class="lb-score">Score: <span>${p.score}</span></div>
          </div>
        </div>
      `;
    }).join('');

    const overlay = document.createElement('div');
    overlay.className = 'timesup-overlay';

    const card = document.createElement('div');
    card.className = 'timesup-card';

    card.innerHTML = `
      <div class="timesup-title">Time's Up!</div>
      <div class="timesup-subtitle">Game Over • Final Scores</div>

      <div class="timesup-body">
        <div class="timesup-column timesup-top">
          <div class="label">Highest Score</div>
          <div class="player-row">
            <div class="avatar-ring">
              <img src="${top.avatar}" alt="${top.name}">
            </div>
            <div class="info">
              <div class="name">${top.name}</div>
              <div class="score">Score: <span>${top.score}</span></div>
            </div>
          </div>
        </div>

        <div class="timesup-column timesup-low">
          <div class="label">Lowest Score</div>
          <div class="player-row">
            <div class="avatar-ring">
              <img src="${low.avatar}" alt="${low.name}">
            </div>
            <div class="info">
              <div class="name">${low.name}</div>
              <div class="score">Score: <span>${low.score}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div class="timesup-leaderboard">
        <div class="lb-title">All Players</div>
        <div class="lb-list">
          ${rowsHtml}
        </div>
      </div>

      <div class="timesup-footer">
        <button class="timesup-btn">OK</button>
      </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const btn = card.querySelector('.timesup-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        overlay.remove();
        window.location.href = 'scene2.html';
      });
    }
  },

  // ---- WebSocket ----
  connectWS() {
    const { uid, room_id } = this.session;
    const url = `${GAME_WS_URL}?uid=${encodeURIComponent(uid)}&room_id=${encodeURIComponent(room_id)}`;

    const openWS = () => {
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.addEventListener('message', ev => {
        let msg; try { msg = JSON.parse(ev.data); } catch { return; }
        if (!msg || (msg.room_id && Number(msg.room_id) !== Number(room_id))) return;
        this.handle(msg);
      });

      ws.addEventListener('close', () => {
        setTimeout(() => {
          if (document.visibilityState !== 'hidden' && !this.gameOver) openWS();
        }, 800);
      });

      ws.addEventListener('error', () => {
        try { ws.close(); } catch {}
      });
    };

    openWS();
  },

  send(type, payload) {
    if (this.gameOver && (
      type === 'roll.request' ||
      type === 'turn.skip'   ||
      type === 'answer.submit'
    )) {
      return;
    }

    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify({ type, ...payload }));
    }
  },

  // ---- Message Router ----
  handle(msg) {
    switch (msg.type) {
      case 'state.sync':      return this.onStateSync(msg);
      case 'players.update':  return this.onPlayersUpdate(msg);
      case 'roll.result':     return this.onRollResult(msg);
      case 'move.commit':     return this.onMoveCommit(msg);
      case 'turn.update':     return this.onTurnUpdate(msg);
      case 'question.show':   return this.onQuestionShow(msg);
      case 'answer.result':   return this.onAnswerResult(msg);
      case 'game.over':       return this.onGameOver(msg);
      case 'error':           return this.onWsError(msg);
      case 'player.left':
  this.showSystemToast(`🔔 ${msg.username} has left the match`);
  break;

    }
  },

  onGameOver(msg) {
    this.handleTimeUp();
  },

  onWsError(msg) {
    console.warn('[GAME WS ERROR]', msg.error);
    this.rollInFlight = false;
    if (rollBtn) {
      const myTurn = this.turnUid === this.session.uid;
      rollBtn.disabled = !myTurn || !!this.questionOverlay || this.gameOver;
      rollBtn.textContent = myTurn ? 'Roll' : 'Waiting...';
    }
  },
showSystemToast(text) {
  const toast = document.createElement('div');
  toast.className = 'system-toast';
  toast.textContent = text;

  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 50);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
},

  onStateSync(msg) {
    if (msg.config) {
      if (msg.config.game_time_sec)         this.gameConfig.game_time_sec = msg.config.game_time_sec;
      if (msg.config.time_per_question_sec) this.gameConfig.time_per_question_sec = msg.config.time_per_question_sec;
    }

    (msg.players || []).forEach(p => {
      const pp = this.ensurePlayer(p.uid);
      pp.pos = p.pos || 0;
      pp.score = p.score || 0;
      this.placeToken(p.uid, pp.pos, true);
      this.updateScoreCard(p.uid, pp.score);
    });

    // restore answered tiles from server, if sent
    if (Array.isArray(msg.answeredTiles)) {
      this.answeredTiles = new Set(
        msg.answeredTiles
          .map(n => parseInt(n, 10))
          .filter(n => Number.isFinite(n))
      );
      this.answeredTiles.forEach(idx => {
        const t = this.tiles[idx];
        if (t) t.classList.add('answered');
      });
    }

    this.turnUid = msg.turnUid || null;
    this.updateTurnHighlight();
    this.startGameClock();
  },

  onPlayersUpdate(msg) {
    (msg.players || []).forEach(p => {
      const pp = this.ensurePlayer(p.uid);
      pp.pos = p.pos || 0;
      pp.score = p.score || 0;
      this.placeToken(p.uid, pp.pos, true);
      this.updateScoreCard(p.uid, pp.score);
    });
    if (msg.turnUid) {
      this.turnUid = msg.turnUid;
      this.updateTurnHighlight();
    }
  },

  // Dice-first: animate dice, then move
  onRollResult(msg) {
    const roll = msg.roll;
    if (!diceEl || typeof roll !== 'number') return;

    if (rollBtn) {
      rollBtn.disabled = true;
      rollBtn.textContent = 'Rolling...';
    }

    this.diceIsAnimating = true;
    diceEl.style.animation = 'rolling 0.9s ease-in-out';
    setSafeTimeout(() => {
      diceEl.style.animation = '';
      const faces = [
        { x: 0,    y: 0 },
        { x: -90,  y: 0 },
        { x: 0,    y: -90 },
        { x: 90,   y: 0 },
        { x: 0,    y: 90 },
        { x: 180,  y: 0 }
      ];
      const f = faces[(roll - 1) % 6] || faces[0];
      diceEl.style.transform = `rotateX(${f.x}deg) rotateY(${f.y}deg)`;
      this.diceIsAnimating = false;

      this.rollInFlight = false;

      if (this.pendingMove) {
        const { uid, from, to, afterMove } = this.pendingMove;
        this.pendingMove = null;
        this.animateMove(uid, from, to, typeof afterMove === 'function' ? afterMove : () => {});
      }
    }, 900);
  },

  onMoveCommit(msg) {
    const { uid, from, to } = msg;

    const afterMove = () => {
      if (this.pendingQuestion) {
        const qmsg = this.pendingQuestion;
        this.pendingQuestion = null;
        this._showQuestionNow(qmsg);
      }
    };

    if (this.diceIsAnimating) {
      this.pendingMove = { uid, from, to, afterMove };
      return;
    }

    this.animateMove(uid, from, to, afterMove);
  },

  onTurnUpdate(msg) {
    const prevMyTurn = (this.turnUid === this.session.uid);

    this.turnUid = String(msg.turnUid || '');
    if (rollBtn) {
      const myTurn = this.turnUid === this.session.uid;
      rollBtn.disabled = !myTurn || !!this.questionOverlay || this.gameOver;
      rollBtn.textContent = myTurn ? (this.questionOverlay ? 'Answering...' : 'Roll') : 'Waiting...';
    }
    this.updateTurnHighlight();

    const nowMyTurn = (this.turnUid === this.session.uid);
    if (prevMyTurn && !nowMyTurn) {
      this.rollInFlight = false;
    }
    if (!prevMyTurn && nowMyTurn) {
      this.rollInFlight = false;
    }
  },

  // ---- Question Flow ----
  onQuestionShow(msg) {
    if (this.gameOver) return;

    if (this.diceIsAnimating || this.moveInProgress) {
      this.pendingQuestion = msg;
      return;
    }
    this._showQuestionNow(msg);
  },

  _showQuestionNow(msg) {
    if (this.gameOver) return;

    if (this.questionOverlay) { this.questionOverlay.remove(); this.questionOverlay = null; }
    if (this.questionTick) { clearInterval(this.questionTick); this.questionTick = null; }

    this.stopRollTimer();

    const isMine    = String(msg.uid) === String(this.session.uid);
    const passive   = !!msg.passive;
    const canAnswer = isMine && !passive;

    const overlay = document.createElement('div');
    overlay.className = 'question-overlay' + (canAnswer ? '' : ' passive');

    const card = document.createElement('div');
    card.className = 'question-card';

    const total = msg.time_sec || this.gameConfig.time_per_question_sec || 10;
    let left    = total;

    const tileLabel = (typeof msg.tile_index === 'number')
      ? (msg.tile_index + 1)
      : '?';

    const titleText = canAnswer
      ? `Your Question — Tile ${tileLabel}`
      : `Player ${msg.uid}'s Question — Tile ${tileLabel}`;

    card.innerHTML = `
      <div class="question-header">
        <div class="player-badge">
          <span class="player-swatch"></span>
          <div class="title">${titleText}</div>
        </div>
        <div class="meta"><div class="timer" id="question-timer">${left}</div></div>
      </div>
      <div class="question-text">${msg.q || ''}</div>
      <div class="choices" id="question-choices"></div>
      <div class="feedback" id="question-feedback"></div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    this.questionOverlay = overlay;

    const choicesWrap = card.querySelector('#question-choices');
    const choices     = Array.isArray(msg.choices) ? msg.choices : [];

    if (!choices.length) {
      choicesWrap.innerHTML = `<div style="opacity:0.7;font-size:13px;">No choices available.</div>`;
    } else {
      choices.forEach((c, idx) => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        const label = ['A','B','C','D'][idx] || String.fromCharCode(65 + idx);
        btn.innerHTML = `
          <div style="font-size:12px;opacity:.85">${label}</div>
          <div style="margin-top:6px">${c}</div>
        `;

        if (!canAnswer) {
          btn.disabled = true;
          btn.style.opacity = 0.8;
          btn.style.cursor = 'default';
        } else {
          btn.addEventListener('click', () => {
            choicesWrap.querySelectorAll('button').forEach(b => b.disabled = true);
            this.send('answer.submit', {
              room_id: this.session.room_id,
              qid: msg.qid,
              choice_index: idx
            });
          });
        }

        choicesWrap.appendChild(btn);
      });
    }

    const timerEl = card.querySelector('#question-timer');
    this.questionTick = setInterval(() => {
      if (this.gameOver) {
        clearInterval(this.questionTick);
        this.questionTick = null;
        return;
      }

      left--;
      if (timerEl) timerEl.textContent = left;
      if (left <= 0) {
        clearInterval(this.questionTick);
        this.questionTick = null;

        if (canAnswer) {
          this.send('answer.submit', {
            room_id: this.session.room_id,
            qid: msg.qid,
            choice_index: -1
          });
        }
      }
    }, 1000);

    this.updateTurnHighlight();
  },
  

  onAnswerResult(msg) {
    if (this.questionTick) { clearInterval(this.questionTick); this.questionTick = null; }

    // update scores
    if (msg.scores) {
      Object.entries(msg.scores).forEach(([uid, score]) => {
        const p = this.ensurePlayer(uid);
        p.score = score | 0;
        this.updateScoreCard(uid, p.score);
      });
    }

    // mark answered tile as dimmed + skippable
    if (typeof msg.tile_index === 'number' && msg.correct) {
      const idx  = msg.tile_index;
      const tile = this.tiles[idx];
      if (tile) {
        tile.classList.add('answered');
        this.answeredTiles.add(idx);
      }
    }

    if (this.questionOverlay) {
      const fb = this.questionOverlay.querySelector('#question-feedback');
      if (fb) {
        if (String(msg.uid) === String(this.session.uid)) fb.textContent = msg.correct ? 'Correct!' : 'Incorrect.';
        else fb.textContent = `Player ${msg.uid} answered ${msg.correct ? 'correctly' : 'incorrectly'}.`;
      }
      setSafeTimeout(() => {
        this.questionOverlay?.remove();
        this.questionOverlay = null;
        this.updateTurnHighlight();
      }, 700);
    } else {
      this.updateTurnHighlight();
    }
  },

  updateScoreCard(uid, score) {
    const el = document.querySelector(`.score-card[data-uid="${uid}"]`);
    if (el) el.textContent = score;
  }
};
window.ChemsagaMultiTileBoot = ChemsagaMultiTileBoot;

// ---- small layout helper ----
(function () {
  const root = document.documentElement;
  function tweak() {
    const h = window.innerHeight;
    if (h < 520) root.style.setProperty('--dock-gap', '0px');
    else root.style.removeProperty('--dock-gap');
  }
  addEventListener('resize', tweak);
  addEventListener('orientationchange', tweak);
  tweak();
  
})();

