/* ===========================
   CHEMSAGA create.js (DB-backed)
   - Uses: room_detail.php, room_questions_upsert.php
   - Keeps local cache for smooth editing (questionsMap)
   =========================== */
let currentTileIndex = 0; // Hydrogen = index 0

/* ---- Safe stubs ---- */
function handleKeydown(e) {}
function addPopEffect(sel) {}

/* ---------- URL helper ---------- */
function getParam(name) {
  return new URLSearchParams(location.search).get(name);
}

/* ---------- Storage key (local preview only) ---------- */
const CURRENT_ROOM_ID = getParam('room_id');
const STORAGE_KEY = `CHEMSAGA_CREATE_LOCAL_${CURRENT_ROOM_ID || 'new'}`;

/* ---------- focus trap helpers (kept) ---------- */
let focusableElements;
function trapFocus(modal) {
  focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
    modal.addEventListener('keydown', handleKeydown);
  }
}
function releaseFocusTrap() {
  document.removeEventListener('keydown', handleKeydown);
}

/* ---------- elements 1..100 ---------- */
const elements = [
  {number:1,symbol:'H',name:'Hydrogen'},{number:2,symbol:'He',name:'Helium'},{number:3,symbol:'Li',name:'Lithium'},{number:4,symbol:'Be',name:'Beryllium'},{number:5,symbol:'B',name:'Boron'},{number:6,symbol:'C',name:'Carbon'},{number:7,symbol:'N',name:'Nitrogen'},{number:8,symbol:'O',name:'Oxygen'},{number:9,symbol:'F',name:'Fluorine'},{number:10,symbol:'Ne',name:'Neon'},{number:11,symbol:'Na',name:'Sodium'},{number:12,symbol:'Mg',name:'Magnesium'},{number:13,symbol:'Al',name:'Aluminum'},{number:14,symbol:'Si',name:'Silicon'},{number:15,symbol:'P',name:'Phosphorus'},{number:16,symbol:'S',name:'Sulfur'},{number:17,symbol:'Cl',name:'Chlorine'},{number:18,symbol:'Ar',name:'Argon'},{number:19,symbol:'K',name:'Potassium'},{number:20,symbol:'Ca',name:'Calcium'},{number:21,symbol:'Sc',name:'Scandium'},{number:22,symbol:'Ti',name:'Titanium'},{number:23,symbol:'V',name:'Vanadium'},{number:24,symbol:'Cr',name:'Chromium'},{number:25,symbol:'Mn',name:'Manganese'},{number:26,symbol:'Fe',name:'Iron'},{number:27,symbol:'Co',name:'Cobalt'},{number:28,symbol:'Ni',name:'Nickel'},{number:29,symbol:'Cu',name:'Copper'},{number:30,symbol:'Zn',name:'Zinc'},{number:31,symbol:'Ga',name:'Gallium'},{number:32,symbol:'Ge',name:'Germanium'},{number:33,symbol:'As',name:'Arsenic'},{number:34,symbol:'Se',name:'Selenium'},{number:35,symbol:'Br',name:'Bromine'},{number:36,symbol:'Kr',name:'Krypton'},{number:37,symbol:'Rb',name:'Rubidium'},{number:38,symbol:'Sr',name:'Strontium'},{number:39,symbol:'Y',name:'Yttrium'},{number:40,symbol:'Zr',name:'Zirconium'},{number:41,symbol:'Nb',name:'Niobium'},{number:42,symbol:'Mo',name:'Molybdenum'},{number:43,symbol:'Tc',name:'Technetium'},{number:44,symbol:'Ru',name:'Ruthenium'},{number:45,symbol:'Rh',name:'Rhodium'},{number:46,symbol:'Pd',name:'Palladium'},{number:47,symbol:'Ag',name:'Silver'},{number:48,symbol:'Cd',name:'Cadmium'},{number:49,symbol:'In',name:'Indium'},{number:50,symbol:'Sn',name:'Tin'},{number:51,symbol:'Sb',name:'Antimony'},{number:52,symbol:'Te',name:'Tellurium'},{number:53,symbol:'I',name:'Iodine'},{number:54,symbol:'Xe',name:'Xenon'},{number:55,symbol:'Cs',name:'Cesium'},{number:56,symbol:'Ba',name:'Barium'},{number:57,symbol:'La',name:'Lanthanum'},{number:58,symbol:'Ce',name:'Cerium'},{number:59,symbol:'Pr',name:'Praseodymium'},{number:60,symbol:'Nd',name:'Neodymium'},{number:61,symbol:'Pm',name:'Promethium'},{number:62,symbol:'Sm',name:'Samarium'},{number:63,symbol:'Eu',name:'Europium'},{number:64,symbol:'Gd',name:'Gadolinium'},{number:65,symbol:'Tb',name:'Terbium'},{number:66,symbol:'Dy',name:'Dysprosium'},{number:67,symbol:'Ho',name:'Holmium'},{number:68,symbol:'Er',name:'Erbium'},{number:69,symbol:'Tm',name:'Thulium'},{number:70,symbol:'Yb',name:'Ytterbium'},{number:71,symbol:'Lu',name:'Lutetium'},{number:72,symbol:'Hf',name:'Hafnium'},{number:73,symbol:'Ta',name:'Tantalum'},{number:74,symbol:'W',name:'Tungsten'},{number:75,symbol:'Re',name:'Rhenium'},{number:76,symbol:'Os',name:'Osmium'},{number:77,symbol:'Ir',name:'Iridium'},{number:78,symbol:'Pt',name:'Platinum'},{number:79,symbol:'Au',name:'Gold'},{number:80,symbol:'Hg',name:'Mercury'},{number:81,symbol:'Tl',name:'Thallium'},{number:82,symbol:'Pb',name:'Lead'},{number:83,symbol:'Bi',name:'Bismuth'},{number:84,symbol:'Po',name:'Polonium'},{number:85,symbol:'At',name:'Astatine'},{number:86,symbol:'Rn',name:'Radon'},{number:87,symbol:'Fr',name:'Francium'},{number:88,symbol:'Ra',name:'Radium'},{number:89,symbol:'Ac',name:'Actinium'},{number:90,symbol:'Th',name:'Thorium'},{number:91,symbol:'Pa',name:'Protactinium'},{number:92,symbol:'U',name:'Uranium'},{number:93,symbol:'Np',name:'Neptunium'},{number:94,symbol:'Pu',name:'Plutonium'},{number:95,symbol:'Am',name:'Americium'},{number:96,symbol:'Cm',name:'Curium'},{number:97,symbol:'Bk',name:'Berkelium'},{number:98,symbol:'Cf',name:'Californium'},{number:99,symbol:'Es',name:'Einsteinium'},{number:100,symbol:'Fm',name:'Fermium'}
];

/* ---------- local cache ---------- */
function loadQuestions() { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : {}; } catch(e) { return {}; } }
function saveQuestions(m) { localStorage.setItem(STORAGE_KEY, JSON.stringify(m)); }
let questionsMap = loadQuestions();

/* ---------- DOM refs & state ---------- */
const tilesList = document.getElementById('tilesList');
const searchInput = document.getElementById('tileSearch');
const clearBtn = document.getElementById('clearSearch');
const searchFeedback = document.getElementById('searchFeedback');
const quadrants = [document.getElementById('quad-0'), document.getElementById('quad-1'), document.getElementById('quad-2'), document.getElementById('quad-3')];

const openModals = new Map(); /* elNum -> {slot,node,openedAt} */
const slotToEl = new Array(4).fill(null);
const slotOrder = [];
let tileNodes = [];

/* ---------- helpers ---------- */
const API_BASE = '../php/api';

function isMobile() {
  return window.matchMedia('(max-width: 768px)').matches;
}

/* ---------- build tile list ---------- */
function createElementList(){
  tilesList.innerHTML = '';
  tileNodes = [];
  elements.forEach((el,i)=>{
    const item = document.createElement('div'); item.className='tile-item';
    item.dataset.index = i; item.dataset.number = String(el.number); item.dataset.symbol = el.symbol.toLowerCase(); item.dataset.name = el.name.toLowerCase();
    const num = document.createElement('div'); num.className='tile-num'; num.textContent = el.number;
    const sym = document.createElement('div'); sym.className='tile-symbol'; sym.textContent = el.symbol;
    const name = document.createElement('div'); name.className='tile-name'; name.textContent = el.name;
    item.appendChild(num); item.appendChild(sym); item.appendChild(name);
    item.addEventListener('click', ()=> handleTileClick(el.number, item));
    tilesList.appendChild(item); tileNodes.push(item);
  });
}

/* ---------- TILE NAV CORE (FIXED) ---------- */
function getTileNodeByIndex(idx) {
  return tileNodes.find(n => Number(n.dataset.index) === idx);
}

function openTileByIndex(idx) {
  if (idx < 0 || idx >= elements.length) return;

  currentTileIndex = idx;

  const listItem = getTileNodeByIndex(idx);
  if (!listItem) {
    console.warn('Tile node not found for index', idx);
    return;
  }

  const el = elements[idx];
  handleTileClick(el.number, listItem);

  // Update header counter
  const counter = document.getElementById('tileCounter');
  if (counter) counter.textContent = `${idx + 1} / ${elements.length}`;
}


document.getElementById('prevTile')?.addEventListener('click', () => {
  if (currentTileIndex > 0) {
    openTileByIndex(currentTileIndex - 1);
  }
});

document.getElementById('nextTile')?.addEventListener('click', () => {
  if (currentTileIndex < elements.length - 1) {
    openTileByIndex(currentTileIndex + 1);
  }
});





/* ---------- open modal logic ---------- */
function handleTileClick(elementNumber, listItemNode){
  if (openModals.has(String(elementNumber))){
    const info = openModals.get(String(elementNumber));
    focusModal(info.node);
    tileNodes.forEach(n=>n.classList.remove('active')); listItemNode.classList.add('active');
    return;
  }

  let freeSlot;
  if (isMobile()) {
    // In mobile portrait: Close all previous modals (only one at a time), force slot 0
    for (let [key, info] of openModals) {
      info.node.remove();
      slotToEl[info.slot] = null;
    }
    openModals.clear();
    slotOrder.length = 0;
    freeSlot = 0;
  } else {
    // Desktop: Normal multi-slot logic
    freeSlot = slotToEl.findIndex(v=>v===null);
    if (freeSlot === -1){
      const oldest = slotOrder.shift();
      const infoOld = openModals.get(String(oldest));
      if (infoOld){ const s = infoOld.slot; infoOld.node.remove(); openModals.delete(String(oldest)); slotToEl[s]=null; freeSlot=s; } else freeSlot=0;
    }
  }

  const modalNode = createQuestionModal(elementNumber, freeSlot, listItemNode);
  const targetQuadrant = isMobile() ? quadrants[0] : quadrants[freeSlot];
  targetQuadrant.appendChild(modalNode);
  slotToEl[freeSlot] = elementNumber;
  openModals.set(String(elementNumber), { slot:freeSlot, node:modalNode, openedAt:Date.now() });
  slotOrder.push(elementNumber);
  tileNodes.forEach(n=>n.classList.remove('active')); listItemNode.classList.add('active');
  focusModal(modalNode);
  adjustModalSizes();
}

function focusModal(modalNode){
  const parent = modalNode.parentElement;
  Array.from(parent.children).forEach(ch=>ch.style.zIndex = 1);
  modalNode.style.zIndex = 5;
}

/* ---------- modal factory ---------- */
function createQuestionModal(elementNumber, slotIndex){
  const elInfo = elements.find(e=>e.number===elementNumber);
  const saved = questionsMap[String(elementNumber)] || null;

  const container = document.createElement('div'); container.className='question-card';

  const header = document.createElement('div'); header.className='question-header';
  header.innerHTML = `<div class="player-badge"><span class="player-swatch"></span><div class="title">Q for ${elInfo.symbol} (${elInfo.name})</div></div>`;
  const meta = document.createElement('div'); meta.className='meta';
  const controls = document.createElement('div'); controls.className='modal-controls';
  const editBtn = document.createElement('button'); editBtn.className='icon-btn'; editBtn.textContent='✎';
  const delBtn = document.createElement('button'); delBtn.className='icon-btn'; delBtn.textContent='🗑';
  const closeBtn = document.createElement('button'); closeBtn.className='icon-btn'; closeBtn.textContent='✕';
  controls.appendChild(editBtn); controls.appendChild(delBtn); controls.appendChild(closeBtn); meta.appendChild(controls); header.appendChild(meta);
  container.appendChild(header);

  const content = document.createElement('div'); content.className='q-content';
  const viewArea = document.createElement('div'); viewArea.className='q-view';
  const qTextView = document.createElement('div'); qTextView.className='question-text';
  const choicesView = document.createElement('div'); choicesView.className='choices';
  const feedback = document.createElement('div'); feedback.className='feedback';
  viewArea.appendChild(qTextView); viewArea.appendChild(choicesView); viewArea.appendChild(feedback);

  const editArea = document.createElement('div'); editArea.className='q-edit'; editArea.style.display='none';
  const qInput = document.createElement('textarea'); qInput.rows=3; qInput.placeholder='Enter question...';
  const choiceInputs=[]; for(let i=0;i<4;i++){ const ci=document.createElement('input'); ci.type='text'; ci.placeholder=`Choice ${String.fromCharCode(65+i)}`; choiceInputs.push(ci); }
  const correctSelect=document.createElement('select'); ['A','B','C','D'].forEach((l,idx)=>{ const o=document.createElement('option'); o.value=idx; o.textContent=`${l} is correct`; correctSelect.appendChild(o); });
  const actions=document.createElement('div'); actions.className='q-actions';
  const saveBtn=document.createElement('button'); saveBtn.className='btn btn-save'; saveBtn.textContent='Save';
  const cancelBtn=document.createElement('button'); cancelBtn.className='btn btn-cancel'; cancelBtn.textContent='Cancel';
  actions.appendChild(cancelBtn); actions.appendChild(saveBtn);
  editArea.appendChild(qInput); choiceInputs.forEach(ci=>editArea.appendChild(ci)); editArea.appendChild(correctSelect); editArea.appendChild(actions);

  content.appendChild(viewArea); content.appendChild(editArea); container.appendChild(content);

  function populateFromData(data){
    if (!data){
      qTextView.textContent = 'No question yet. Click edit to add a question for this tile.';
      choicesView.innerHTML = `<div style="opacity:0.6; font-size:13px;">(no choices)</div>`;
      qInput.value=''; choiceInputs.forEach(ci=>ci.value=''); correctSelect.value = 0; return;
    }
    qTextView.textContent = data.q || '';
    choicesView.innerHTML = '';
    (data.choices || []).forEach((c, idx)=>{
      const btn = document.createElement('div'); btn.className='choice-btn'; btn.innerHTML = `<div>${String.fromCharCode(65+idx)}</div><div>${c}</div>`;
      if (Number(data.correctIndex) === idx) { btn.style.borderColor = 'rgba(34,197,94,0.85)'; btn.style.boxShadow = '0 10px 22px rgba(16,185,129,0.12)'; }
      choicesView.appendChild(btn);
    });
    qInput.value = data.q || '';
    choiceInputs.forEach((ci,idx)=> ci.value = (data.choices && data.choices[idx]) ? data.choices[idx] : '');
    correctSelect.value = (data.correctIndex != null) ? data.correctIndex : 0;
  }

  populateFromData(saved);

  function enterEditMode(){ populateFromData(questionsMap[String(elementNumber)]); viewArea.style.display='none'; editArea.style.display='flex'; }
  function exitEditMode(){ viewArea.style.display='block'; editArea.style.display='none'; }

  editBtn.addEventListener('click', ()=> enterEditMode());
  cancelBtn.addEventListener('click', ()=> exitEditMode());

  // SAVE SINGLE TILE
  saveBtn.addEventListener('click', async ()=>{
    const qtxt = qInput.value.trim(); const choices = choiceInputs.map(ci=>ci.value.trim()); const ci = Number(correctSelect.value);
    if (!qtxt){ alert('Please enter a question.'); return; }
    const data = { q: qtxt, choices: choices, correctIndex: ci, answer_type:'multiple-choice' };
    questionsMap[String(elementNumber)] = data; saveQuestions(questionsMap);
    populateFromData(data);
    exitEditMode();

    // live-upsert this tile if room already exists
    if (CURRENT_ROOM_ID) {
      try {
        const f = new FormData();
        f.append('room_id', CURRENT_ROOM_ID);
        // ✅ use questionsByTile so PHP sees it
        f.append('questionsByTile', JSON.stringify({ [String(elementNumber)]: data }));
        const up = await fetch(`${API_BASE}/room_questions_upsert.php`, { method:'POST', body:f, credentials:'include' });
        const js = await up.json();
        if (!js.ok) throw new Error(js.error || 'upsert failed');
        feedback.textContent='Saved to server.';
      } catch(err) {
        console.error(err);
        feedback.textContent='Saved locally. (Server sync failed)';
      } finally {
        setTimeout(()=> feedback.textContent='', 1200);
      }
    } else {
      feedback.textContent='Saved locally.';
      setTimeout(()=> feedback.textContent='', 900);
    }
  });

  // DELETE TILE QUESTION
  delBtn.addEventListener('click', async ()=>{
    if (!questionsMap[String(elementNumber)]) { 
      feedback.textContent='No saved question to delete.'; 
      setTimeout(()=>feedback.textContent='',1200); 
      return; 
    }
    if (!confirm(`Delete saved question for ${elInfo.symbol}?`)) return;
    delete questionsMap[String(elementNumber)]; 
    saveQuestions(questionsMap); 
    populateFromData(null);
    feedback.textContent='Deleted (local).';
    setTimeout(()=>feedback.textContent='',900);

    // Optional: delete on server by sending null for that tile
    if (CURRENT_ROOM_ID) {
      try{
        const f = new FormData();
        f.append('room_id', CURRENT_ROOM_ID);
        f.append('questionsByTile', JSON.stringify({ [String(elementNumber)]: null }));
        await fetch(`${API_BASE}/room_questions_upsert.php`, { method:'POST', body:f, credentials:'include' });
      }catch(e){}
    }
  });

  closeBtn.addEventListener('click', ()=>{
    const info = openModals.get(String(elementNumber));
    if (info){ const s = info.slot; slotToEl[s]=null; openModals.delete(String(elementNumber)); const idx = slotOrder.indexOf(elementNumber); if (idx!==-1) slotOrder.splice(idx,1); }
    container.remove(); tileNodes.forEach(n=>n.classList.remove('active'));
  });

  if (!saved) enterEditMode();

  choicesView.addEventListener('click', (ev)=>{ const t = ev.target.closest('.choice-btn'); if (!t) return; t.style.transform='scale(1.03) translateY(-4px)'; setTimeout(()=>t.style.transform='',200); });

  return container;
}

/* ---------- size tuning ---------- */
function adjustModalSizes(){
  openModals.forEach((info) => {
    const { slot, node } = info;
    const quadrant = quadrants[slot];
    if (!quadrant || !node) return;
    const pad = 20;
    const qRect = quadrant.getBoundingClientRect();
    const targetMaxWidth = Math.max(180, Math.min(qRect.width - pad, parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--modal-base-max') || 360)));
    const targetMaxHeight = Math.max(140, qRect.height - pad);
    node.style.maxWidth = targetMaxWidth + 'px';
    node.style.maxHeight = targetMaxHeight + 'px';
    node.style.margin = 'auto';
  });
}

/* ---------- search handlers ---------- */
function searchTiles(q) {
  const s = String(q || '').trim().toLowerCase();
  tileNodes.forEach(t => t.classList.remove('active'));
  if (searchFeedback) searchFeedback.textContent = '';
  if (!s) return;

  let found = tileNodes.find(it => it.dataset.symbol === s);
  if (found) { found.classList.add('active'); found.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }

  found = tileNodes.find(it => String(it.dataset.number) === s);
  if (found) { found.classList.add('active'); found.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }

  found = tileNodes.find(it => (it.dataset.name || '').includes(s));
  if (found) { found.classList.add('active'); found.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }

  if (searchFeedback) {
    searchFeedback.textContent = 'No matching element found';
    setTimeout(() => searchFeedback.textContent = '', 1200);
  }
  tilesList.classList.add('no-result');
  setTimeout(() => tilesList.classList.remove('no-result'), 300);
}

/* ---------- carousel init ---------- */
function initCarousel(){
  const modesContainer = document.getElementById('modes');
  if (!modesContainer) return;

  let modeCards = document.querySelectorAll('.mode-card');
  let idx = 0;

  function updateCarousel(){
    modeCards = document.querySelectorAll('.mode-card');
    if (!modeCards.length) return;

    const viewport = document.querySelector('.mode-viewport');
    if (!viewport) return;

    const viewportWidth = viewport.offsetWidth || 260;
    const cardWidth = (modeCards[0].offsetWidth || 240) + 10;
    const offset = (viewportWidth - cardWidth)/2 - idx * cardWidth;
    modesContainer.style.transform = `translateX(${offset}px)`;
  }

  // ❌ DO NOT bind prevBtn / nextBtn (they do not exist)
  // Only card selection
  modeCards.forEach((card,i)=>{
    card.addEventListener('click', ()=>{
      modeCards.forEach(c=>c.classList.remove('selected'));
      card.classList.add('selected');
      idx = i;
      updateCarousel();
    });
  });

  window.addEventListener('resize', ()=> {
    updateCarousel();
    adjustModalSizes();
  });

  setTimeout(()=>{ updateCarousel(); adjustModalSizes(); }, 150);
}


/* ---------- Time input safe handler (kept) ---------- */
const timeSetBtn = document.querySelector('.time-set-btn');
if (timeSetBtn) {
  timeSetBtn.addEventListener('click', () => {
    const timeInput = document.querySelector('.time-input');
    const timeValue = parseInt(timeInput.value, 10);
    if (isNaN(timeValue) || timeValue < 1) {
      alert('Please enter a valid time (at least 1 second).');
      return;
    }
    console.log(`Time set to ${timeValue} seconds`);
  });
}

/* ---------- DB loaders ---------- */
async function loadRoomMeta(rid){
  const res = await fetch(`${API_BASE}/room_detail.php?room_id=${encodeURIComponent(rid)}`, { credentials:'include' });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'room_detail failed');

  // Mode
  const modeLabel = data.room.mode_label || '3P';
  document.querySelectorAll('.mode-card').forEach((card)=>{
    const left = card.querySelector('.mode-left')?.textContent?.trim();
    if (left === modeLabel) {
      document.querySelectorAll('.mode-card').forEach(c=>c.classList.remove('selected'));
      card.classList.add('selected');
    }
  });

  // Timers
  const timeInputs = document.querySelectorAll('.time-input');
  if (timeInputs[0]) timeInputs[0].value = data.room.time_per_question_sec || 30;
  if (timeInputs[1]) timeInputs[1].value = data.room.game_time_min || 5;

  // Quiz type
  const qsel = document.querySelector('.quiz-type-select');
  if (qsel) qsel.value = data.room.quiz_type || 'multiple-choice';

  // Visibility
  const vis = data.room.visibility || 'public';
  document.querySelectorAll('.room-btn').forEach(b=>b.classList.remove('active'));
  const btn = Array.from(document.querySelectorAll('.room-btn'))
    .find(b => vis === 'private' ? b.textContent.includes('Private') : b.textContent.includes('Public'));
  if (btn) btn.classList.add('active');
}

// ✅ Load ALL questions for this room using room_detail.php (questions array)
async function loadRoomQuestions(rid){
  try {
    const r = await fetch(`${API_BASE}/room_detail.php?room_id=${encodeURIComponent(rid)}`, { credentials:'include', cache:'no-store' });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'room_detail failed');

    const map = {};
    (j.questions || []).forEach(row => {
      const tile = String(row.tile_number);
      const choices = [row.choice_a, row.choice_b, row.choice_c, row.choice_d].map(v=>v||'');
      map[tile] = {
        q: row.question_text || '',
        choices,
        correctIndex: Number(row.correct_index) || 0,
        answer_type: row.answer_type || 'multiple-choice'
      };
    });

    questionsMap = map;
    saveQuestions(questionsMap);
  } catch (e) {
    console.warn('loadRoomQuestions fallback to local cache:', e);
  }
}

/* ---------- UI bootstrap ---------- */
document.addEventListener('DOMContentLoaded', async ()=>{
  createElementList();
  initCarousel();
  setTimeout(adjustModalSizes, 200);

  const rid = CURRENT_ROOM_ID;
  if (rid) {
    try {
      await loadRoomMeta(rid);
      await loadRoomQuestions(rid);
    } catch(e) {
      console.error('loadGameSettings error:', e);
    }
  }
// ✅ AUTO OPEN HYDROGEN ON LOAD
setTimeout(() => {
  openTileByIndex(0);
}, 400);


});
window.addEventListener('DOMContentLoaded', () => {
  addPopEffect('.difficulty-button, .start-game-button');
});

// Resize listener for dynamic mobile/desktop switch
window.addEventListener('resize', () => {
  adjustModalSizes();
  if (isMobile() && openModals.size > 1) {
    // If resized to mobile with multiple modals, close extras to avoid hidden ones
    const toKeep = Array.from(openModals.keys())[0]; // Keep first
    for (let [key, info] of openModals) {
      if (key !== toKeep) {
        info.node.remove();
        slotToEl[info.slot] = null;
        openModals.delete(key);
        const idx = slotOrder.indexOf(Number(key));
        if (idx !== -1) slotOrder.splice(idx, 1);
      }
    }
  }
});

/* ---------- Public/Private toggle ---------- */
document.querySelectorAll('.room-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.room-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
  });
});

/* ---------- Search events ---------- */
searchInput.addEventListener('input', (e)=> { 
  const v = e.target.value; 
  if (!v) { 
    tileNodes.forEach(it=>it.classList.remove('active')); 
    if (searchFeedback) searchFeedback.textContent = ''; 
    return; 
  } 
  searchTiles(v.toLowerCase()); 
});
clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  tileNodes.forEach(it => it.classList.remove('active'));
  if (searchFeedback) searchFeedback.textContent = '';
  searchInput.focus();
});


/* ---------- Navigation ---------- */
function goBack() {
  window.location.href = 'scene2.html';
}

/* ---------- SAVE & REDIRECT (uses room_questions_upsert.php) ---------- */
async function goToMulti2() {
  try {
    const qs = new URLSearchParams(window.location.search);
    const existingRoomId = qs.get('room_id'); // if coming from Edit

    const selectedMode = document.querySelector('.mode-card.selected');
    const mode_label = selectedMode ? selectedMode.querySelector('.mode-left')?.textContent?.trim() : '3P';
    const time_per_question_sec = parseInt(document.querySelectorAll('.time-input')[0]?.value, 10) || 30;
    const game_time_min         = parseInt(document.querySelectorAll('.time-input')[1]?.value, 10) || 5;
    const quiz_type             = document.querySelector('.quiz-type-select')?.value || 'multiple-choice';
    const roomBtns  = Array.from(document.querySelectorAll('.room-btn'));
    let visibility  = roomBtns.find(b => b.classList.contains('active'))?.textContent.includes('Private') ? 'private' : 'public';
    const category = '';

    let roomId = existingRoomId;

    if (existingRoomId) {
      // UPDATE
      const f = new FormData();
      f.append('room_id', existingRoomId);
      f.append('mode_label', mode_label);
      f.append('time_per_question_sec', time_per_question_sec);
      f.append('game_time_min', game_time_min);
      f.append('quiz_type', quiz_type);
      f.append('visibility', visibility);
      f.append('category', category);

      const upd = await fetch(`${API_BASE}/update_room.php`, { method:'POST', body:f, credentials:'include' });
      const updJson = await upd.json();
      if (!updJson.ok) throw new Error('Update room failed: ' + (updJson.error || 'unknown'));
      roomId = existingRoomId;
    } else {
      // CREATE
      const f = new FormData();
      f.append('mode_label', mode_label);
      f.append('time_per_question_sec', time_per_question_sec);
      f.append('game_time_min', game_time_min);
      f.append('quiz_type', quiz_type);
      f.append('visibility', visibility);
      f.append('category', category);

      const res1 = await fetch(`${API_BASE}/create_room.php`, { method:'POST', body:f, credentials:'include' });
      const data1 = await res1.json();
      if (!data1.ok) throw new Error('Create room failed: ' + (data1.error || 'unknown'));
      roomId = data1.room_id;
    }

    // ✅ Save ALL questions via questionsByTile
    const f2 = new FormData();
    f2.append('room_id', roomId);
    f2.append('questionsByTile', JSON.stringify(questionsMap || {}));
    const res2 = await fetch(`${API_BASE}/room_questions_upsert.php`, { method:'POST', body:f2, credentials:'include' });
    const data2 = await res2.json();
    if (!data2.ok) throw new Error('Questions upsert failed: ' + (data2.error || 'unknown'));

    // go to multi2 lobby
    window.location.href = 'multi2.html?room_id=' + encodeURIComponent(roomId);

  } catch (err) {
    console.error(err);
    alert('Unexpected error while saving: ' + err.message);
  }
}

/* expose globally */
window.goToMulti2 = goToMulti2;
window.goBack = goBack;

/* host heartbeat if editing an existing room */
(function hostHeartbeat(){
  const qs = new URLSearchParams(window.location.search);
  const rid = qs.get('room_id');
  if (!rid) return;
  setInterval(() => {
    const f = new FormData();
    f.append('room_id', rid);
    fetch(`${API_BASE}/heartbeat_room.php`, { method:'POST', body:f, credentials:'include' });
  }, 30000);
})();
