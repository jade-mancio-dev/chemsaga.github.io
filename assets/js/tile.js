let pausedMoveState = null;
let pausedQuestionModal = null;
let pausedDiceState = null;
let pausedRollTime = null;

// ---- Safe Timeout System ----
let activeTimeouts = [];

function setSafeTimeout(fn, delay) {
  const id = setTimeout(() => {
    activeTimeouts = activeTimeouts.filter(t => t !== id);
    fn();
  }, delay);
  activeTimeouts.push(id);
  return id;
}

function clearAllTimeouts() {
  activeTimeouts.forEach(id => clearTimeout(id));
  activeTimeouts = [];
}

const elements = [
  { number: 1, symbol: 'H', name: 'Hydrogen', category: 'nonmetal', icon: '💧' },
  { number: 2, symbol: 'He', name: 'Helium', category: 'noble-gas', icon: '🎈' },
  { number: 3, symbol: 'Li', name: 'Lithium', category: 'alkali-metal', icon: '🔋' },
  { number: 4, symbol: 'Be', name: 'Beryllium', category: 'alkaline-earth', icon: '🛠️' },
  { number: 5, symbol: 'B', name: 'Boron', category: 'metalloid', icon: '🧪' },
  { number: 6, symbol: 'C', name: 'Carbon', category: 'nonmetal', icon: '💎' },
  { number: 7, symbol: 'N', name: 'Nitrogen', category: 'nonmetal', icon: '🌬️' },
  { number: 8, symbol: 'O', name: 'Oxygen', category: 'nonmetal', icon: '🫁' },
  { number: 9, symbol: 'F', name: 'Fluorine', category: 'halogen', icon: '🦷' },
  { number: 10, symbol: 'Ne', name: 'Neon', category: 'noble-gas', icon: '💡' },
  { number: 11, symbol: 'Na', name: 'Sodium', category: 'alkali-metal', icon: '🧂' },
  { number: 12, symbol: 'Mg', name: 'Magnesium', category: 'alkaline-earth', icon: '🔥' },
  { number: 13, symbol: 'Al', name: 'Aluminum', category: 'post-transition', icon: '🥫' },
  { number: 14, symbol: 'Si', name: 'Silicon', category: 'metalloid', icon: '💻' },
  { number: 15, symbol: 'P', name: 'Phosphorus', category: 'nonmetal', icon: '🕯️' },
  { number: 16, symbol: 'S', name: 'Sulfur', category: 'nonmetal', icon: '🌋' },
  { number: 17, symbol: 'Cl', name: 'Chlorine', category: 'halogen', icon: '🏊' },
  { number: 18, symbol: 'Ar', name: 'Argon', category: 'noble-gas', icon: '🛡️' },
  { number: 19, symbol: 'K', name: 'Potassium', category: 'alkali-metal', icon: '🍌' },
  { number: 20, symbol: 'Ca', name: 'Calcium', category: 'alkaline-earth', icon: '🦴' },
  { number: 21, symbol: 'Sc', name: 'Scandium', category: 'transition-metal', icon: '🚴' },
  { number: 22, symbol: 'Ti', name: 'Titanium', category: 'transition-metal', icon: '✈️' },
  { number: 23, symbol: 'V', name: 'Vanadium', category: 'transition-metal', icon: '🔧' },
  { number: 24, symbol: 'Cr', name: 'Chromium', category: 'transition-metal', icon: '🚗' },
  { number: 25, symbol: 'Mn', name: 'Manganese', category: 'transition-metal', icon: '⚒️' },
  { number: 26, symbol: 'Fe', name: 'Iron', category: 'transition-metal', icon: '🧲' },
  { number: 27, symbol: 'Co', name: 'Cobalt', category: 'transition-metal', icon: '🩺' },
  { number: 28, symbol: 'Ni', name: 'Nickel', category: 'transition-metal', icon: '🪙' },
  { number: 29, symbol: 'Cu', name: 'Copper', category: 'transition-metal', icon: '🔌' },
  { number: 30, symbol: 'Zn', name: 'Zinc', category: 'transition-metal', icon: '🛬' },
  { number: 31, symbol: 'Ga', name: 'Gallium', category: 'post-transition', icon: '🌡️' },
  { number: 32, symbol: 'Ge', name: 'Germanium', category: 'metalloid', icon: '📡' },
  { number: 33, symbol: 'As', name: 'Arsenic', category: 'metalloid', icon: '☠️' },
  { number: 34, symbol: 'Se', name: 'Selenium', category: 'nonmetal', icon: '📷' },
  { number: 35, symbol: 'Br', name: 'Bromine', category: 'halogen', icon: '🧯' },
  { number: 36, symbol: 'Kr', name: 'Krypton', category: 'noble-gas', icon: '💡' },
  { number: 37, symbol: 'Rb', name: 'Rubidium', category: 'alkali-metal', icon: '⏱️' },
  { number: 38, symbol: 'Sr', name: 'Strontium', category: 'alkaline-earth', icon: '🎇' },
  { number: 39, symbol: 'Y', name: 'Yttrium', category: 'transition-metal', icon: '📺' },
  { number: 40, symbol: 'Zr', name: 'Zirconium', category: 'transition-metal', icon: '💍' },
  { number: 41, symbol: 'Nb', name: 'Niobium', category: 'transition-metal', icon: '🚢' },
  { number: 42, symbol: 'Mo', name: 'Molybdenum', category: 'transition-metal', icon: '🛠️' },
  { number: 43, symbol: 'Tc', name: 'Technetium', category: 'transition-metal', icon: '🩻' },
  { number: 44, symbol: 'Ru', name: 'Ruthenium', category: 'transition-metal', icon: '💿' },
  { number: 45, symbol: 'Rh', name: 'Rhodium', category: 'transition-metal', icon: '🚘' },
  { number: 46, symbol: 'Pd', name: 'Palladium', category: 'transition-metal', icon: '🔩' },
  { number: 47, symbol: 'Ag', name: 'Silver', category: 'transition-metal', icon: '🥄' },
  { number: 48, symbol: 'Cd', name: 'Cadmium', category: 'transition-metal', icon: '🔋' },
  { number: 49, symbol: 'In', name: 'Indium', category: 'post-transition', icon: '📱' },
  { number: 50, symbol: 'Sn', name: 'Tin', category: 'post-transition', icon: '🍴' },
  { number: 51, symbol: 'Sb', name: 'Antimony', category: 'metalloid', icon: '🖨️' },
  { number: 52, symbol: 'Te', name: 'Tellurium', category: 'metalloid', icon: '☀️' },
  { number: 53, symbol: 'I', name: 'Iodine', category: 'halogen', icon: '🩹' },
  { number: 54, symbol: 'Xe', name: 'Xenon', category: 'noble-gas', icon: '🚨' },
  { number: 55, symbol: 'Cs', name: 'Cesium', category: 'alkali-metal', icon: '🕰️' },
  { number: 56, symbol: 'Ba', name: 'Barium', category: 'alkaline-earth', icon: '🩺' },
  { number: 57, symbol: 'La', name: 'Lanthanum', category: 'lanthanide', icon: '🎥' },
  { number: 58, symbol: 'Ce', name: 'Cerium', category: 'lanthanide', icon: '🪓' },
  { number: 59, symbol: 'Pr', name: 'Praseodymium', category: 'lanthanide', icon: '🟢' },
  { number: 60, symbol: 'Nd', name: 'Neodymium', category: 'lanthanide', icon: '🧲' },
  { number: 61, symbol: 'Pm', name: 'Promethium', category: 'lanthanide', icon: '☢️' },
  { number: 62, symbol: 'Sm', name: 'Samarium', category: 'lanthanide', icon: '🎧' },
  { number: 63, symbol: 'Eu', name: 'Europium', category: 'lanthanide', icon: '🟥' },
  { number: 64, symbol: 'Gd', name: 'Gadolinium', category: 'lanthanide', icon: '🩺' },
  { number: 65, symbol: 'Tb', name: 'Terbium', category: 'lanthanide', icon: '🟩' },
  { number: 66, symbol: 'Dy', name: 'Dysprosium', category: 'lanthanide', icon: '💾' },
  { number: 67, symbol: 'Ho', name: 'Holmium', category: 'lanthanide', icon: '🔬' },
  { number: 68, symbol: 'Er', name: 'Erbium', category: 'lanthanide', icon: '📡' },
  { number: 69, symbol: 'Tm', name: 'Thulium', category: 'lanthanide', icon: '🩻' },
  { number: 70, symbol: 'Yb', name: 'Ytterbium', category: 'lanthanide', icon: '⚖️' },
  { number: 71, symbol: 'Lu', name: 'Lutetium', category: 'lanthanide', icon: '💉' },
  { number: 72, symbol: 'Hf', name: 'Hafnium', category: 'transition-metal', icon: '🛩️' },
  { number: 73, symbol: 'Ta', name: 'Tantalum', category: 'transition-metal', icon: '📲' },
  { number: 74, symbol: 'W', name: 'Tungsten', category: 'transition-metal', icon: '💡' },
  { number: 75, symbol: 'Re', name: 'Rhenium', category: 'transition-metal', icon: '🚀' },
  { number: 76, symbol: 'Os', name: 'Osmium', category: 'transition-metal', icon: '⚖️' },
  { number: 77, symbol: 'Ir', name: 'Iridium', category: 'transition-metal', icon: '🪐' },
  { number: 78, symbol: 'Pt', name: 'Platinum', category: 'transition-metal', icon: '💍' },
  { number: 79, symbol: 'Au', name: 'Gold', category: 'transition-metal', icon: '🏆' },
  { number: 80, symbol: 'Hg', name: 'Mercury', category: 'transition-metal', icon: '🌡️' },
  { number: 81, symbol: 'Tl', name: 'Thallium', category: 'post-transition', icon: '⚠️' },
  { number: 82, symbol: 'Pb', name: 'Lead', category: 'post-transition', icon: '🪨' },
  { number: 83, symbol: 'Bi', name: 'Bismuth', category: 'post-transition', icon: '💊' },
  { number: 84, symbol: 'Po', name: 'Polonium', category: 'metalloid', icon: '☢️' },
  { number: 85, symbol: 'At', name: 'Astatine', category: 'halogen', icon: '🧬' },
  { number: 86, symbol: 'Rn', name: 'Radon', category: 'noble-gas', icon: '🏠' },
  { number: 87, symbol: 'Fr', name: 'Francium', category: 'alkali-metal', icon: '⚡' },
  { number: 88, symbol: 'Ra', name: 'Radium', category: 'alkaline-earth', icon: '🕰️' },
  { number: 89, symbol: 'Ac', name: 'Actinium', category: 'actinide', icon: '🌟' },
  { number: 90, symbol: 'Th', name: 'Thorium', category: 'actinide', icon: '⚛️' },
  { number: 91, symbol: 'Pa', name: 'Protactinium', category: 'actinide', icon: '🔬' },
  { number: 92, symbol: 'U', name: 'Uranium', category: 'actinide', icon: '☢️' },
  { number: 93, symbol: 'Np', name: 'Neptunium', category: 'actinide', icon: '🔭' },
  { number: 94, symbol: 'Pu', name: 'Plutonium', category: 'actinide', icon: '💣' },
  { number: 95, symbol: 'Am', name: 'Americium', category: 'actinide', icon: '🚨' },
  { number: 96, symbol: 'Cm', name: 'Curium', category: 'actinide', icon: '🔬' },
  { number: 97, symbol: 'Bk', name: 'Berkelium', category: 'actinide', icon: '🧪' },
  { number: 98, symbol: 'Cf', name: 'Californium', category: 'actinide', icon: '🔍' },
  { number: 99, symbol: 'Es', name: 'Einsteinium', category: 'actinide', icon: '🧠' },
  { number: 100, symbol: 'Fm', name: 'Fermium', category: 'actinide', icon: '🔬' }
];

const gridContainer = document.getElementById('gridContainer');
const dice = document.getElementById('dice');
const rollBtn = document.getElementById('rollBtn');
const aiDifficultyLabel = document.getElementById('ai-difficulty');
const gameTimer = document.getElementById('game-timer');
const rollTimerContainer = document.getElementById('rollTimerContainer');
const rollTimer = document.getElementById('roll-timer');

const players = [
  { name: 'Jade12900', tokenId: 'token-p0', pos: 0, previousPos: 0, scoreElem: document.getElementById('score-1'), score: 0, isAI: false },
  { name: 'AI',        tokenId: 'token-p1', pos: 0, previousPos: 0, scoreElem: document.getElementById('score-2'), score: 0, isAI: true }
];

let currentPlayerIndex = 0;
let isAnimating = false;
let tiles = [];
let tileCenters = [];
const tokenSize = 24;
const stepMs = 350;
const questions = [];
const answeredTiles = new Array(elements.length).fill(false);

// Game time
const GAME_DURATION_SEC = 20 * 60; // 20 minutes
let gameTimeLeft = GAME_DURATION_SEC;

let usedQuestions = new Array(elements.length).fill().map(() => []);
let rollDelayTimeout = null;
let rollTimerInterval = null;
let modalTimeout = null;
let modalInterval = null;
let gameOver = false;
let gameTimerInterval = null;
let diceRollTimeout = null;
let diceMoveTimeout = null;
let isPaused = false;
let isGameStarted = false;

// ===== Difficulty & AI tuning =====
const urlParams = new URLSearchParams(window.location.search);
const difficulty = urlParams.get('difficulty')?.toLowerCase() || 'easy';
let aiDifficulty;

switch (difficulty) {
  case 'normal':
    aiDifficulty = { correctChance: 0.70, fmCorrectChance: 0.50 };
    players[1].name = 'AI (Normal)';
    if (aiDifficultyLabel) aiDifficultyLabel.textContent = 'Normal';
    break;
  case 'hard':
    aiDifficulty = { correctChance: 0.88, fmCorrectChance: 0.65 };
    players[1].name = 'AI (Hard)';
    if (aiDifficultyLabel) aiDifficultyLabel.textContent = 'Hard';
    break;
  case 'easy':
  default:
    aiDifficulty = { correctChance: 0.45, fmCorrectChance: 0.25 };
    players[1].name = 'AI (Easy)';
    if (aiDifficultyLabel) aiDifficultyLabel.textContent = 'Easy';
    break;
}

// ===== Helpers for question generation =====
function shuffleArray(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function uniquePush(arr, val) {
  if (!arr.includes(val)) arr.push(val);
}

function pickDifferentNames(count, excludeName, poolLimit = elements.length) {
  const pool = elements.slice(0, poolLimit).map(e => e.name);
  const out = [];
  while (out.length < count) {
    const n = pool[Math.floor(Math.random() * pool.length)];
    if (n !== excludeName && !out.includes(n)) out.push(n);
  }
  return out;
}

function pickCategories(count, exclude) {
  const cats = [...new Set(elements.map(e => e.category))];
  const out = [];
  while (out.length < count) {
    const c = cats[Math.floor(Math.random() * cats.length)];
    if (c !== exclude && !out.includes(c)) out.push(c);
  }
  return out;
}

function pickNumbersFar(count, exclude, minSep = 8) {
  const out = [];
  while (out.length < count) {
    const n = 1 + Math.floor(Math.random() * 100);
    if (n !== exclude && Math.abs(n - exclude) >= minSep && !out.includes(n)) out.push(n);
  }
  return out;
}

function pickNumbersNear(correct, deltas) {
  const out = [];
  deltas.forEach(d => {
    const v = correct + d;
    if (v >= 1 && v <= 100) uniquePush(out, v);
  });
  while (out.length < 3) {
    const r = 1 + Math.floor(Math.random() * 100);
    if (r !== correct && !out.includes(r)) out.push(r);
  }
  return out.slice(0, 3);
}

const commonUses = {
  'H': 'Fuel for fusion reactions',
  'He': 'Filling balloons',
  'O': 'Respiration in living organisms',
  'C': 'Basis of organic chemistry',
  'N': 'Component of ammonia',
  'F': 'Used in toothpaste',
  'Ne': 'Used in neon signs',
  'Na': 'Used in table salt',
  'Mg': 'Used in lightweight alloys',
  'Al': 'Used in aircraft construction',
  default: 'Used in various applications'
};

const commonCompounds = {
  'H': 'H₂O (Water)',
  'C': 'CO₂ (Carbon Dioxide)',
  'O': 'O₂ (Oxygen gas)',
  'Na': 'NaCl (Table Salt)',
  'Fm': 'Fm compounds (synthetic)',
  default: 'Forms various compounds'
};

// ===== Difficulty-specific question builders =====
function buildEasyQuestions(element) {
  const tileQs = [];

  // Q0: Which element has symbol "X"? (smaller pool)
  {
    const wrongs = pickDifferentNames(3, element.name, 20);
    const choices = shuffleArray([element.name, ...wrongs]);
    tileQs.push({
      q: `Which element has the symbol "${element.symbol}"?`,
      choices,
      correctIndex: choices.indexOf(element.name)
    });
  }

  // Q1: Atomic number (far distractors)
  {
    const wrongs = pickNumbersFar(3, element.number, 8);
    const choices = shuffleArray([element.number, ...wrongs]).map(String);
    tileQs.push({
      q: `What is the atomic number of ${element.symbol}?`,
      choices,
      correctIndex: choices.indexOf(String(element.number))
    });
  }

  // Q2: Category
  {
    const wrongs = pickCategories(3, element.category);
    const choices = shuffleArray([element.category, ...wrongs]);
    tileQs.push({
      q: `Which category does ${element.symbol} belong to?`,
      choices,
      correctIndex: choices.indexOf(element.category)
    });
  }

  // Q3: Simple common use
  {
    const use = commonUses[element.symbol] || commonUses.default.replace('various applications', `${element.name} applications`);
    let wrongs = [];
    while (wrongs.length < 3) {
      const vals = Object.values(commonUses);
      const pick = vals[Math.floor(Math.random() * vals.length)];
      if (pick !== use && !wrongs.includes(pick)) wrongs.push(pick);
    }
    const choices = shuffleArray([use, ...wrongs]);
    tileQs.push({
      q: `What is a common use of ${element.symbol}?`,
      choices,
      correctIndex: choices.indexOf(use)
    });
  }

  return tileQs;
}

function buildNormalQuestions(element) {
  const tileQs = [];

  // Q0: Which element has symbol "X"? (full pool)
  {
    const poolNames = elements.map(e => e.name);
    const wrongs = [];
    while (wrongs.length < 3) {
      const n = poolNames[Math.floor(Math.random() * poolNames.length)];
      if (n !== element.name && !wrongs.includes(n)) wrongs.push(n);
    }
    const choices = shuffleArray([element.name, ...wrongs]);
    tileQs.push({
      q: `Which element has the symbol "${element.symbol}"?`,
      choices,
      correctIndex: choices.indexOf(element.name)
    });
  }

  // Q1: Atomic number (near distractors ±1, ±2)
  {
    const wrongs = pickNumbersNear(element.number, [-2, -1, +1, +2]);
    const choices = shuffleArray([element.number, ...wrongs]).map(String);
    tileQs.push({
      q: `What is the atomic number of ${element.symbol}?`,
      choices,
      correctIndex: choices.indexOf(String(element.number))
    });
  }

  // Q2: Category
  {
    const wrongs = pickCategories(3, element.category);
    const choices = shuffleArray([element.category, ...wrongs]);
    tileQs.push({
      q: `Which category does ${element.symbol} belong to?`,
      choices,
      correctIndex: choices.indexOf(element.category)
    });
  }

  // Q3: Common compound
  {
    const compound = commonCompounds[element.symbol] || commonCompounds.default.replace('various compounds', `${element.name} compounds`);
    let wrongs = [];
    while (wrongs.length < 3) {
      const vals = Object.values(commonCompounds);
      const pick = vals[Math.floor(Math.random() * vals.length)] || `${element.name} compound`;
      if (pick !== compound && !wrongs.includes(pick)) wrongs.push(pick);
    }
    const choices = shuffleArray([compound, ...wrongs]);
    tileQs.push({
      q: `Which is a common compound of ${element.symbol}?`,
      choices,
      correctIndex: choices.indexOf(compound)
    });
  }

  return tileQs;
}

function buildHardQuestions(element) {
  const tileQs = [];

  // Q0: Reverse — Which element has atomic number N?
  {
    const correctName = element.name;
    const wrongs = [];
    while (wrongs.length < 3) {
      const e = elements[Math.floor(Math.random() * elements.length)];
      if (e.name !== correctName && !wrongs.includes(e.name)) wrongs.push(e.name);
    }
    const choices = shuffleArray([correctName, ...wrongs]);
    tileQs.push({
      q: `Which element has the atomic number ${element.number}?`,
      choices,
      correctIndex: choices.indexOf(correctName)
    });
  }

  // Q1: Atomic number — tight distractors (±1, ±2, ±3)
  {
    const wrongs = pickNumbersNear(element.number, [-3, -2, -1, +1, +2, +3]);
    const choices = shuffleArray([element.number, ...wrongs]).map(String);
    tileQs.push({
      q: `What is the atomic number of ${element.symbol}?`,
      choices,
      correctIndex: choices.indexOf(String(element.number))
    });
  }

  // Q2: Category
  {
    const wrongs = pickCategories(3, element.category);
    const choices = shuffleArray([element.category, ...wrongs]);
    tileQs.push({
      q: `Which category does ${element.symbol} belong to?`,
      choices,
      correctIndex: choices.indexOf(element.category)
    });
  }

  // Q3: Common compound
  {
    const compound = commonCompounds[element.symbol] || commonCompounds.default.replace('various compounds', `${element.name} compounds`);
    let wrongs = [];
    while (wrongs.length < 3) {
      const vals = Object.values(commonCompounds);
      const pick = vals[Math.floor(Math.random() * vals.length)] || `${element.name} compound`;
      if (pick !== compound && !wrongs.includes(pick)) wrongs.push(pick);
    }
    const choices = shuffleArray([compound, ...wrongs]);
    tileQs.push({
      q: `Which is a common compound of ${element.symbol}?`,
      choices,
      correctIndex: choices.indexOf(compound)
    });
  }

  return tileQs;
}

function generateQuestions() {
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    let qs;
    if (difficulty === 'easy') qs = buildEasyQuestions(element);
    else if (difficulty === 'normal') qs = buildNormalQuestions(element);
    else qs = buildHardQuestions(element);
    questions[i] = qs;
  }
}

// ===== Dice animation =====
const diceFaces = [
  { x: 0,   y: 0 },
  { x: -90, y: 0 },
  { x: 0,   y: -90 },
  { x: 90,  y: 0 },
  { x: 0,   y: 90 },
  { x: 180, y: 0 }
];

function rollDice() {
  if (gameOver || isAnimating || isPaused) return;
  isAnimating = true;
  rollBtn.disabled = true;
  rollBtn.textContent = 'Rolling...';

  stopRollTimer();

  const duration = 1000;
  const startTime = Date.now();

  dice.style.animation = 'rolling 1s ease-in-out';
  dice.style.animationPlayState = 'running';

  function finishRoll() {
    dice.style.animation = '';
    const randomValue = Math.floor(Math.random() * 6) + 1;
    const face = diceFaces[randomValue - 1];
    dice.style.transform = `rotateX(${face.x}deg) rotateY(${face.y}deg)`;
    console.log(`Dice rolled: ${randomValue}`);

    diceMoveTimeout = setSafeTimeout(() => {
      if (!isPaused) movePlayer(randomValue);
    }, 300);
  }

  diceRollTimeout = setSafeTimeout(() => {
    if (!isPaused) {
      finishRoll();
    }
  }, duration);

  pausedDiceState = {
    wasRolling: true,
    startTime,
    duration,
    finishRoll
  };
}

// ===== Board & movement =====
function createGrid() {
  tiles = [];
  gridContainer.querySelectorAll('.element-tile').forEach(n => n.remove());
  for (let i = 0; i < 100; i++) {
    const element = elements[i];
    const tile = document.createElement('div');
    tile.className = `element-tile ${element.category}`;
    tile.setAttribute('data-number', element.number);
    tile.setAttribute('data-index', i);

    const symbol = document.createElement('div');
    symbol.className = 'symbol';
    symbol.textContent = element.symbol;

    const icon = document.createElement('div');
    icon.className = 'icon';
    icon.textContent = element.icon;

    tile.appendChild(symbol);
    tile.appendChild(icon);

    tile.addEventListener('click', function () {
      if (gameOver || isPaused) return;
      this.style.transform = 'scale(0.95)';
      setSafeTimeout(() => { this.style.transform = ''; }, 150);
      console.log(`Clicked: ${element.symbol} - ${element.name} (${element.number})`);
    });

    gridContainer.appendChild(tile);
    tiles.push(tile);
  }
  createTokens();
  computeTileCenters();
}

function createTokens() {
  gridContainer.querySelectorAll('.token').forEach(t => t.remove());
  players.forEach((p, idx) => {
    const token = document.createElement('div');
    token.className = `token p${idx}`;
    token.id = p.tokenId;
    token.textContent = (idx === 0 ? 'P1' : 'AI');
    token.style.width = tokenSize + 'px';
    token.style.height = tokenSize + 'px';
    token.style.left = '-9999px';
    token.style.top = '-9999px';
    gridContainer.appendChild(token);
  });
}

/**
 * Recompute tile centers & token positions on any layout change.
 * IMPORTANT CHANGE:
 * - Removed dependency on isPaused so that orientation / resize
 *   still keeps tokens centered in portrait mobile.
 */
function computeTileCenters() {
  if (gameOver) return; // allow while paused for responsive layout

  tileCenters = tiles.map(tile => {
    const rect = tile.getBoundingClientRect();
    const containerRect = gridContainer.getBoundingClientRect();
    const left = rect.left - containerRect.left + (rect.width / 2) - (tokenSize / 2);
    const top = rect.top - containerRect.top + (rect.height / 2) - (tokenSize / 2);
    return { left, top };
  });

  players.forEach(p => {
    const token = document.getElementById(p.tokenId);
    if (token && tileCenters[p.pos]) {
      token.style.left = tileCenters[p.pos].left + 'px';
      token.style.top = tileCenters[p.pos].top + 'px';
    }
  });
}

function allTilesAnswered() {
  return answeredTiles.every(v => v === true);
}

function findNextUnanswered(startIndex) {
  if (allTilesAnswered()) return -1;
  let idx = (startIndex + 1) % elements.length;
  while (answeredTiles[idx]) {
    idx = (idx + 1) % elements.length;
  }
  return idx;
}

function startRollTimer() {
  if (gameOver || isPaused || players[currentPlayerIndex].isAI) return;
  stopRollTimer();
  rollTimerContainer.classList.remove('visible');
  let rollTimeLeft = 5;

  rollDelayTimeout = setSafeTimeout(() => {
    if (isPaused) {
      pausedRollTime = rollTimeLeft;
      return;
    }
    rollTimer.textContent = rollTimeLeft;
    rollTimerContainer.classList.add('visible');
    rollTimerInterval = setInterval(() => {
      if (isPaused) {
        pausedRollTime = rollTimeLeft;
        return;
      }
      rollTimeLeft--;
      rollTimer.textContent = rollTimeLeft;
      if (rollTimeLeft <= 0) {
        stopRollTimer();
        console.log('Player failed to roll in time. Passing turn to AI.');
        endTurn();
      }
    }, 1000);
  }, 2000);
}

function stopRollTimer() {
  if (rollDelayTimeout) {
    clearTimeout(rollDelayTimeout);
    rollDelayTimeout = null;
  }
  if (rollTimerInterval) {
    clearInterval(rollTimerInterval);
    rollTimerInterval = null;
  }
  rollTimerContainer.classList.remove('visible');
}

function computePathIndices(startPos, steps) {
  const path = [];
  if (allTilesAnswered()) return path;
  let cur = startPos;
  for (let s = 0; s < steps; s++) {
    const nxt = findNextUnanswered(cur);
    if (nxt === -1) break;
    path.push(nxt);
    cur = nxt;
  }
  return path;
}

function movePlayer(steps) {
  if (gameOver || isPaused) return;
  const player = players[currentPlayerIndex];
  player.previousPos = player.pos;
  const startPos = player.pos;
  const path = computePathIndices(startPos, steps);

  if (path.length === 0) {
    console.log('All tiles answered. No movement possible.');
    endTurn();
    return;
  }

  pausedMoveState = {
    path,
    nextStepIndex: 0,
    playerIndex: currentPlayerIndex,
    timeoutIds: []
  };

  isAnimating = true;

  path.forEach((tileIndex, idx) => {
    const timeoutId = setSafeTimeout(() => {
      if (gameOver || isPaused) return;

      pausedMoveState.nextStepIndex = idx + 1;

      player.pos = tileIndex;
      const token = document.getElementById(player.tokenId);
      if (token && tileCenters[tileIndex]) {
        token.style.transition = 'left 300ms linear, top 300ms linear';
        token.style.left = tileCenters[tileIndex].left + 'px';
        token.style.top = tileCenters[tileIndex].top + 'px';
        token.classList.add('bouncing');
        setSafeTimeout(() => token.classList.remove('bouncing'), 300);
      }

      if (tiles[tileIndex]) {
        tiles[tileIndex].classList.add('focused');
        setSafeTimeout(() => tiles[tileIndex].classList.remove('focused'), 200);
      }

      console.log(`Player ${currentPlayerIndex + 1} moved to ${elements[tileIndex].symbol} (position ${tileIndex})`);

      if (idx === path.length - 1) {
        setSafeTimeout(() => {
          isAnimating = false;
          pausedMoveState = null;
          if (!answeredTiles[tileIndex]) {
            if (player.isAI) aiPlay(tileIndex);
            else showQuestionModal(tileIndex, currentPlayerIndex);
          } else {
            endTurn();
          }
        }, 300);
      }
    }, (idx + 1) * stepMs);

    pausedMoveState.timeoutIds.push(timeoutId);
  });
}

// ===== Question modal visual styles (CONTAINER GLOW) =====
function ensureQuestionModalStyles() {
  if (document.getElementById('qm-styles')) return;
  const style = document.createElement('style');
  style.id = 'qm-styles';
  style.textContent = `
    .question-card {
      transition: box-shadow .2s ease, background-color .2s ease;
    }
    .question-card.state-correct {
      background-color: rgba(34, 197, 94, 0.68);
      box-shadow: 0 0 20px 4px rgba(7, 231, 89, 0.81);
    }
    .question-card.state-incorrect {
      background-color: rgba(239, 68, 68, 0.56);
      box-shadow: 0 0 20px 4px rgba(239, 68, 68, 0.76);
    }
  `;
  document.head.appendChild(style);
}

// ===== AI =====
function aiPlay(tileIndex) {
  if (gameOver || isPaused) return;
  showQuestionModal(tileIndex, currentPlayerIndex, true);
}

function aiAnswer(tileIndex, overlayElem, questionIndex) {
  if (gameOver || isPaused) return;
  const q = questions[tileIndex][questionIndex];
  if (!q) {
    console.error(`No question found for tile ${tileIndex}, question ${questionIndex}`);
    endTurn();
    return;
  }
  const isFm = tileIndex === 99;
  const isCorrect = Math.random() < (isFm ? aiDifficulty.fmCorrectChance : aiDifficulty.correctChance);
  const answerIndex = isCorrect ? q.correctIndex : (Math.floor(Math.random() * 4));
  const feedbackElem = overlayElem.querySelector('#question-feedback');

  console.log(
    `AI answering for ${elements[tileIndex].symbol}:`,
    `Q="${q.q}",`,
    `Correct="${q.choices[q.correctIndex]}",`,
    `AI="${q.choices[answerIndex]}",`,
    `OK=${isCorrect}`
  );

  if (feedbackElem) feedbackElem.textContent = isCorrect ? 'Correct!' : 'Incorrect';

  setSafeTimeout(() => {
    handleAnswer(isCorrect, tileIndex, currentPlayerIndex, overlayElem);
  }, 650);
}

// ===== Modal =====
function showQuestionModal(tileIndex, playerIndex, isAI = false) {
  if (gameOver || isPaused) return;
  stopRollTimer();
  ensureQuestionModalStyles();

  const available = questions[tileIndex]
    .map((_, idx) => idx)
    .filter(idx => !usedQuestions[tileIndex].includes(idx));

  if (available.length === 0) {
    usedQuestions[tileIndex] = [];
    for (let i = 0; i < questions[tileIndex].length; i++) available.push(i);
  }

  const isFm = tileIndex === 99;
  const questionIndex = isFm ? 1 : available[Math.floor(Math.random() * available.length)];
  usedQuestions[tileIndex].push(questionIndex);

  const q = questions[tileIndex][questionIndex];
  if (!q) {
    console.error(`No valid question found for tile ${tileIndex}, question ${questionIndex}`);
    endTurn();
    return;
  }

  const overlay = document.createElement('div');
  overlay.className = 'question-overlay';
  overlay.id = 'question-overlay';
  overlay.dataset.tileIndex = tileIndex;
  overlay.dataset.questionIndex = questionIndex;

  const card = document.createElement('div');
  card.className = 'question-card';

  const accents = [
    'linear-gradient(90deg,#f97316,#fb923c)',
    'linear-gradient(90deg,#06b6d4,#0891b2)'
  ];
  const accentColors = ['#f97316', '#06b6d4'];
  const chosenAccent = accents[playerIndex] || accents[0];
  const chosenColor = accentColors[playerIndex] || accentColors[0];

  card.style.setProperty('--accent', chosenAccent);
  card.style.setProperty('--accent-color', chosenColor);

  const header = document.createElement('div');
  header.className = 'question-header';
  header.innerHTML = `
    <div class="player-badge">
      <span class="player-swatch"></span>
      <div class="title">Question for ${elements[tileIndex].symbol}${isFm ? ' (Hard)' : ''}</div>
    </div>
    <div class="meta">
      <div class="timer" id="question-timer">10</div>
    </div>
  `;

  const qText = document.createElement('div');
  qText.className = 'question-text';
  qText.textContent = q.q;

  const choicesWrap = document.createElement('div');
  choicesWrap.className = 'choices';

  q.choices.forEach((c, idx) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    const label = ['A', 'B', 'C', 'D'][idx] || String.fromCharCode(65 + idx);
    btn.innerHTML = `
      <div style="font-size:12px;opacity:0.85">${label}</div>
      <div style="margin-top:6px">${c}</div>
    `;
    if (!isAI) {
      btn.addEventListener('click', () => {
        if (gameOver || isPaused) return;
        resolveQuestion();
        handleAnswer(idx === q.correctIndex, tileIndex, playerIndex, overlay);
      });
    } else {
      btn.style.cursor = 'default';
    }
    choicesWrap.appendChild(btn);
  });

  const feedback = document.createElement('div');
  feedback.className = 'feedback';
  feedback.id = 'question-feedback';

  document.body.appendChild(overlay);
  overlay.appendChild(card);
  card.appendChild(header);
  card.appendChild(qText);
  card.appendChild(choicesWrap);
  card.appendChild(feedback);

  const swatch = card.querySelector('.player-swatch');
  if (swatch) swatch.style.background = chosenAccent;

  rollBtn.disabled = true;
  let timeLeft = 10;
  const timerElem = document.getElementById('question-timer');
  if (timerElem) timerElem.textContent = timeLeft;

  modalInterval = setInterval(() => {
    if (gameOver || isPaused) {
      pausedQuestionModal = {
        overlayElem: overlay,
        timeLeft,
        tileIndex,
        playerIndex,
        isAI,
        questionIndex
      };
      return;
    }
    timeLeft--;
    if (timerElem) timerElem.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(modalInterval);
      modalInterval = null;
      if (!isAI) {
        handleAnswer(false, tileIndex, playerIndex, overlay, true);
      } else {
        const feedbackElem = overlay.querySelector('#question-feedback');
        if (feedbackElem) feedbackElem.textContent = 'Time\'s up!';
        setSafeTimeout(() => {
          handleAnswer(false, tileIndex, playerIndex, overlay, true);
        }, 800);
      }
    }
  }, 1000);

  if (isAI) {
    const aiAnswerDelay = Math.floor(Math.random() * 4000) + 1000;
    modalTimeout = setSafeTimeout(() => {
      if (modalInterval && !gameOver && !isPaused) {
        resolveQuestion(false);
        aiAnswer(tileIndex, overlay, questionIndex);
      }
    }, aiAnswerDelay);
  }

  function resolveQuestion() {
    if (modalInterval) {
      clearInterval(modalInterval);
      modalInterval = null;
    }
    if (modalTimeout) {
      clearTimeout(modalTimeout);
      modalTimeout = null;
    }
  }
}

function handleAnswer(isCorrect, tileIndex, playerIndex, overlayElem, timedOut = false) {
  if (modalInterval) {
    clearInterval(modalInterval);
    modalInterval = null;
  }
  if (modalTimeout) {
    clearTimeout(modalTimeout);
    modalTimeout = null;
  }

  const card = overlayElem.querySelector('.question-card');
  if (card) {
    card.classList.remove('state-correct', 'state-incorrect');
    card.classList.add(isCorrect && !timedOut ? 'state-correct' : 'state-incorrect');
  }

  overlayElem.classList.remove('state-correct', 'state-incorrect');
  overlayElem.classList.add(isCorrect && !timedOut ? 'state-correct' : 'state-incorrect');

  const feedbackElem = overlayElem.querySelector('#question-feedback');
  const player = players[playerIndex];
  const isFm = tileIndex === 99;

  if (isCorrect && !timedOut) {
    if (feedbackElem) feedbackElem.textContent = 'Correct!';
    answeredTiles[tileIndex] = true;
    if (tiles[tileIndex]) tiles[tileIndex].classList.add('answered');
    player.score += 1;
    player.scoreElem.textContent = player.score;

    console.log(
      `Player ${playerIndex + 1} (${player.name}) answered correctly. Score: ${player.score}`
    );

    if (isFm) {
      setSafeTimeout(() => {
        overlayElem.remove();
        showResultScreen(playerIndex);
      }, 800);
    } else {
      setSafeTimeout(() => {
        overlayElem.remove();
        endTurn();
      }, 800);
    }
  } else {
    if (feedbackElem) feedbackElem.textContent = timedOut ? 'Time\'s up!' : 'Incorrect';

    console.log(
      `Player ${playerIndex + 1} (${player.name}) ${
        timedOut ? 'timed out' : 'answered incorrectly'
      }. Returning to ${elements[player.previousPos].symbol} (position ${player.previousPos}).`
    );

    player.pos = player.previousPos;
    const token = document.getElementById(player.tokenId);
    if (token && tileCenters[player.pos]) {
      token.style.transition = 'left 300ms linear, top 300ms linear';
      token.style.left = tileCenters[player.pos].left + 'px';
      token.style.top = tileCenters[player.pos].top + 'px';
      token.classList.add('bouncing');
      setSafeTimeout(() => token.classList.remove('bouncing'), 300);
    }

    setSafeTimeout(() => {
      overlayElem.remove();
      endTurn();
    }, 900);
  }
}

// ===== Result & timers =====
function showResultScreen(winnerIndex = -1) {
  if (gameOver) return;
  gameOver = true;

  // === ADD THIS LINE: Allow normal back navigation after game ends ===
  history.replaceState(null, '', window.location.href); // Reset history manipulation

  pauseGame();
  removePauseEventListeners();
  // ... rest of your existing code

  rollBtn.disabled = true;
  rollBtn.removeEventListener('click', rollDice);

  window.removeEventListener('resize', computeTileCenters);

  document.querySelectorAll('.element-tile').forEach(tile => {
    tile.style.pointerEvents = 'none';
  });
  dice.style.pointerEvents = 'none';
  rollTimerContainer.classList.remove('visible');

  const existingOverlay = document.getElementById('question-overlay');
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement('div');
  overlay.className = 'result-overlay';

  const card = document.createElement('div');
  card.className = 'result-card';

  let resultText = '';
  if (winnerIndex >= 0) {
    resultText = `${players[winnerIndex].name} wins by correctly answering the Fermium question!`;
  } else {
    const p1Score = players[0].score;
    const p2Score = players[1].score;
    if (p1Score > p2Score) {
      resultText = `${players[0].name} wins with ${p1Score} points!`;
    } else if (p2Score > p1Score) {
      resultText = `${players[1].name} wins with ${p2Score} points!`;
    } else {
      resultText = `It's a tie! Both players have ${p1Score} points.`;
    }
  }

  card.innerHTML = `
    <div class="result-header">Game Over</div>
    <div class="result-text">Player: ${players[0].score} points</div>
    <div class="result-text">AI: ${players[1].score} points</div>
    <div class="result-text winner">${resultText}</div>
    <div class="result-timer" id="result-timer">Returning to menu in 60 seconds...</div>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  let timeLeft = 60;
  const timerElem = card.querySelector('#result-timer');
  const redirectInterval = setInterval(() => {
    timeLeft--;
    if (timerElem) {
      timerElem.textContent = `Returning to menu in ${timeLeft} seconds...`;
    }
    if (timeLeft <= 0) {
      clearInterval(redirectInterval);
      window.location.href = 'scene2.html';
    }
  }, 1000);
}

function updateGameTimer() {
  if (gameOver || gameTimeLeft <= 0) {
    clearInterval(gameTimerInterval);
    gameTimer.textContent = '00:00';
    showResultScreen();
    return;
  }
  const minutes = Math.floor(gameTimeLeft / 60);
  const seconds = gameTimeLeft % 60;
  gameTimer.textContent =
    `${minutes.toString().padStart(2, '0')}:` +
    `${seconds.toString().padStart(2, '0')}`;
  if (!isPaused) gameTimeLeft--;
}

// ===== Pause/Resume =====
function pauseGame() {
  if (gameOver || isPaused) return;
  console.log('Pausing game...');
  isPaused = true;

  if (isAnimating && pausedMoveState) {
    clearAllTimeouts();
  }

  if (gameTimerInterval) {
    clearInterval(gameTimerInterval);
    gameTimerInterval = null;
  }

  if (pausedDiceState?.wasRolling) {
    const elapsed = Date.now() - pausedDiceState.startTime;
    pausedDiceState.remainingTime = Math.max(0, pausedDiceState.duration - elapsed);
    clearTimeout(diceRollTimeout);
    diceRollTimeout = null;
    dice.style.animationPlayState = 'paused';
  }

  if (rollDelayTimeout) clearTimeout(rollDelayTimeout);
  if (rollTimerInterval) clearInterval(rollTimerInterval);
  if (modalInterval) clearInterval(modalInterval);
  if (modalTimeout) clearTimeout(modalTimeout);

  const modal = document.getElementById('question-overlay');
  if (modal) {
    const feedbackElem = modal.querySelector('#question-feedback');
    const timerElem = modal.querySelector('#question-timer');
    pausedQuestionModal = {
      overlayElem: modal,
      timeLeft: parseInt(timerElem ? timerElem.textContent : '10'),
      tileIndex: parseInt(modal.dataset.tileIndex) || 0,
      playerIndex: currentPlayerIndex,
      isAI: players[currentPlayerIndex].isAI,
      questionIndex: parseInt(modal.dataset.questionIndex) || 0,
      feedbackText: feedbackElem ? feedbackElem.textContent : ''
    };
  }

  rollBtn.disabled = true;
  document.querySelectorAll('.element-tile').forEach(tile => {
    tile.style.pointerEvents = 'none';
  });
  dice.style.pointerEvents = 'none';
  rollTimerContainer.classList.remove('visible');

  showPauseModal(resumeGame, restartGame, exitGame);
}

function resumeGame() {
  if (gameOver || !isPaused) return;
  isPaused = false;

  // Resume movement if paused mid-way
  if (pausedMoveState && pausedMoveState.nextStepIndex < pausedMoveState.path.length) {
    console.log('Resuming movement from step', pausedMoveState.nextStepIndex + 1);
    const remainingPath = pausedMoveState.path.slice(pausedMoveState.nextStepIndex);
    const player = players[pausedMoveState.playerIndex];
    isAnimating = true;

    remainingPath.forEach((tileIndex, idx) => {
      setSafeTimeout(() => {
        if (gameOver || isPaused) return;
        pausedMoveState.nextStepIndex++;

        player.pos = tileIndex;
        const token = document.getElementById(player.tokenId);
        if (token && tileCenters[tileIndex]) {
          token.style.transition = 'left 300ms linear, top 300ms linear';
          token.style.left = tileCenters[tileIndex].left + 'px';
          token.style.top = tileCenters[tileIndex].top + 'px';
          token.classList.add('bouncing');
          setSafeTimeout(() => token.classList.remove('bouncing'), 300);
        }

        if (idx === remainingPath.length - 1) {
          setSafeTimeout(() => {
            isAnimating = false;
            pausedMoveState = null;
            if (!answeredTiles[tileIndex]) {
              if (player.isAI) aiPlay(tileIndex);
              else showQuestionModal(tileIndex, currentPlayerIndex);
            } else {
              endTurn();
            }
          }, 300);
        }
      }, (idx + 1) * stepMs);
    });

    return;
  }

  // Resume game timer
  if (!gameTimerInterval) {
    gameTimerInterval = setInterval(updateGameTimer, 1000);
  }

  // Resume dice rolling if it was paused mid-roll
  if (pausedDiceState?.wasRolling && pausedDiceState.remainingTime > 0) {
    console.log(`Resuming dice roll with ${pausedDiceState.remainingTime}ms left`);
    dice.style.animationPlayState = 'running';
    diceRollTimeout = setSafeTimeout(() => {
      if (!isPaused) pausedDiceState.finishRoll();
      pausedDiceState = null;
    }, pausedDiceState.remainingTime);
    return;
  }

  // Resume paused question modal if needed
  if (pausedQuestionModal) {
    const pq = pausedQuestionModal;
    const timerElem = pq.overlayElem.querySelector('#question-timer');
    if (timerElem) timerElem.textContent = pq.timeLeft;

    modalInterval = setInterval(() => {
      if (gameOver || isPaused) {
        pq.timeLeft = parseInt(timerElem.textContent) || pq.timeLeft;
        return;
      }
      pq.timeLeft--;
      timerElem.textContent = pq.timeLeft;
      if (pq.timeLeft <= 0) {
        clearInterval(modalInterval);
        modalInterval = null;
        pausedQuestionModal = null;
        handleAnswer(false, pq.tileIndex, pq.playerIndex, pq.overlayElem, true);
      }
    }, 1000);

    if (pq.isAI) {
      const aiDelay = Math.floor(Math.random() * 4000) + 1000;
      modalTimeout = setSafeTimeout(() => {
        if (!gameOver && !isPaused && modalInterval) {
          clearInterval(modalInterval);
          modalInterval = null;
          aiAnswer(pq.tileIndex, pq.overlayElem, pq.questionIndex);
          pausedQuestionModal = null;
        }
      }, aiDelay);
    }

    pausedQuestionModal = null;
  } else {
    rollBtn.disabled = players[currentPlayerIndex].isAI;
    if (!players[currentPlayerIndex].isAI) {
      startRollTimer();
    } else {
      setSafeTimeout(() => {
        if (!isPaused) rollDice();
      }, 1000);
    }
  }

  document.querySelectorAll('.element-tile').forEach(tile => {
    tile.style.pointerEvents = '';
  });
  dice.style.pointerEvents = '';
}

// ===== Turn / game loop =====
function endTurn() {
  if (isPaused) return;
  document.querySelectorAll('.player').forEach(p => p.classList.remove('active'));
  currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
  const newActivePlayer = document.getElementById(`player-row-${currentPlayerIndex}`);
  if (newActivePlayer) newActivePlayer.classList.add('active');

  console.log(`Now it's ${players[currentPlayerIndex].name}'s turn`);

  isAnimating = false;
  rollBtn.disabled = players[currentPlayerIndex].isAI;
  rollBtn.textContent = 'Roll Dice';

  if (players[currentPlayerIndex].isAI) {
    stopRollTimer();
    setSafeTimeout(() => {
      rollDice();
    }, 1000);
  } else {
    startRollTimer();
  }
}

function startGame() {
  isGameStarted = true;
  createGrid();
  generateQuestions();
  usedQuestions = new Array(elements.length).fill().map(() => []);
  rollBtn.disabled = players[currentPlayerIndex].isAI;

  if (players[currentPlayerIndex].isAI) {
    setSafeTimeout(rollDice, 1000);
  } else {
    startRollTimer();
  }

  gameTimerInterval = setInterval(updateGameTimer, 1000);
  addPauseEventListeners();
}

function restartGame() {
  window.location.reload();
}

function exitGame() {
  window.location.href = 'scene2.html';
}

rollBtn.addEventListener('click', rollDice);

// Pause hotkey
function addPauseEventListeners() {
  document.addEventListener('keydown', handleKeydown);
}
function removePauseEventListeners() {
  document.removeEventListener('keydown', handleKeydown);
}
function handleKeydown(event) {
  if (event.key === 'Escape' && !gameOver && isGameStarted) {
    event.preventDefault();
    console.log('ESC key pressed, triggering pause');
    pauseGame();
  }
}

// Init
document.addEventListener('DOMContentLoaded', function () {
  showRulesModal(startGame);
});

// Responsive: recompute token centers on resize/orientation
window.addEventListener('resize', computeTileCenters);
// Allow tapping/clicking the dice itself to roll (used on mobile; works on desktop too)
dice.addEventListener('click', () => {
  if (gameOver || isAnimating || isPaused) return;
  if (players[currentPlayerIndex].isAI) return;

  // On desktop, still respect disabled state (e.g. when it's not the player's turn)
  if (window.innerWidth > 768 && rollBtn.disabled) return;

  rollDice();
});


// ===== PREVENT ACCIDENTAL BACK NAVIGATION & SHOW PAUSE ON BACK =====
(function () {
  let backPrevented = false;

  // Push a dummy state so we have something to go back to
  if (window.location.pathname.includes('tile.html')) {
    history.pushState({ page: 'game' }, '', window.location.href);
  }

  // Listen for back navigation (edge swipe or back button)
  window.addEventListener('popstate', function (e) {
    if (gameOver || !isGameStarted) {
      // Let normal back behavior happen if game not started or over
      return;
    }

    // Prevent the actual navigation
    history.pushState(null, '', window.location.href);

    // Show pause menu instead
    if (!isPaused) {
      pauseGame(); // This will show your pause menu
    }

    // Optional: vibrate on supported devices
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  });

  // Also handle physical back button on Android (very important!)
  document.addEventListener('backbutton', function (e) {
    if (gameOver || !isGameStarted) return;
    e.preventDefault();
    if (!isPaused) {
      pauseGame();
    }
  }, false);

  // Initial state push on load (in case page was loaded directly)
  window.addEventListener('load', () => {
    if (!backPrevented && isGameStarted) {
      history.pushState({ page: 'game' }, '', window.location.href);
      backPrevented = true;
    }
  });
})();
