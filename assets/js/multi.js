// CHEMSAGA multi.js — CLEAN VERSION (2025-11-06-a)
window.__CHEMSAGA_MULTI_VERSION = "2025-11-06-a";

/* ===== Lightweight DOM helper ===== */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* ===== Fetch-first helper (tries multiple endpoints) ===== */
async function fetchFirst(urls, opts = {}, parse = "json") {
  let lastErr;
  for (const u of urls) {
    try {
      const r = await fetch(u, { ...opts, cache: 'no-store', credentials: 'include' });
      if (!r.ok) { lastErr = new Error(`HTTP ${r.status}`); continue; }
      const payload = (parse === "json") ? await r.json() : await r.text();
      return { ok: true, url: u, data: payload };
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("All endpoints failed");
}

/* ===== API endpoint candidate paths ===== */
const API = {
  profile: ['../php/api/get_profile.php', '../api/get_profile.php'],
  updateProfile: ['../php/api/update_profile.php', '../api/update_profile.php'],
  logout: ['../php/api/logout.php', '../api/logout.php'],
  listOnline: ['../php/api/list_online.php', '../api/list_online.php'],
  invitesSend: ['../php/invitations/send.php', '../php/api/invitations/send.php', '../api/invitations/send.php']
};

/* ===== Navigation: Back button ===== */
$('#backBtn')?.addEventListener('click', () => { location.href = 'scene2.html'; });

/* ===== Profile modal open/close ===== */
function openProfile() {
  const m = $('#profileModal'); if (!m) return;
  m.style.display = 'flex'; m.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
  const c = m.querySelector('.profile-card'); if (c) { c.classList.remove('modal-pop'); void c.offsetWidth; c.classList.add('modal-pop'); }
  (m.querySelector('.close-btn') || {}).focus?.();
}
function closeProfile() {
  const m = $('#profileModal'); if (!m) return;
  m.style.display = 'none'; m.setAttribute('aria-hidden', 'true'); document.body.style.overflow = '';
}
window.closeProfile = closeProfile;

/* ===== DOMContentLoaded init ===== */
document.addEventListener('DOMContentLoaded', () => {
  const toggle = $('#profileToggle');
  const modal = $('#profileModal');
  const closeBtn = modal?.querySelector('.close-btn');

  toggle?.addEventListener('click', () => { toggle.classList.add('pop'); setTimeout(() => toggle.classList.remove('pop'), 250); openProfile(); });
  closeBtn?.addEventListener('click', closeProfile);
  modal?.addEventListener('click', e => { if (e.target === modal) closeProfile(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal?.style.display === 'flex') closeProfile(); });

  // avatar click -> file input
  const avatar = $('#profileAvatar'); const input = $('#profileAvatarInput');
  if (avatar && input) avatar.addEventListener('click', () => input.click());

  // inline profile field saves (blur)
  $('#profileEmail')?.addEventListener('blur', (e) => submitProfileUpdate('email', e.target.value));
  $('#profileUsernameInput')?.addEventListener('blur', (e) => submitProfileUpdate('username', e.target.value));

  // wire logout form
  wireLogout();

  // initial profile load
  loadProfile();
});
/* ===== Avatar upload handler ===== */
$('#profileAvatarInput')?.addEventListener('change', async function (e) {
  const file = e.target.files?.[0];
  if (!file) { alert('❌ No file selected'); return; }

  // preview
  const reader = new FileReader();
  reader.onload = ev => { const img = $('#profileAvatar'); if (img) img.src = ev.target.result; };
  reader.readAsDataURL(file);

  // upload
  const fd = new FormData();
  fd.append('update_type', 'avatar');
  fd.append('profile_picture', file);

  try {
    const res = await fetchFirst(API.updateProfile, { method: 'POST', body: fd }, "text");
    let data;
    try { data = JSON.parse(res.data); } catch { throw new Error('Invalid JSON: ' + res.data); }
    if (!data.success) throw new Error(data.error || 'Avatar update failed');
    alert('✅ Avatar updated');
    loadProfile();
  } catch (err) {
    alert('❌ Avatar update failed: ' + err.message);
  } finally {
    this.value = '';
  }
});

/* ===== Profile field save ===== */
async function submitProfileUpdate(field, value) {
  const fd = new FormData(); fd.append('update_type', 'profile'); fd.append(field, value);
  try {
    const r = await fetchFirst(API.updateProfile, { method: 'POST', body: fd });
    if (!r.data?.success) throw new Error(r.data?.error || 'Update failed');
    alert('✅ Profile updated');
    loadProfile();
  } catch (err) {
    alert('❌ Profile update failed: ' + err.message);
  }
}

/* ===== Logout (AJAX form) ===== */
function wireLogout() {
  const form = $('#logoutForm'); if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const r = await fetchFirst(API.logout, { method: 'POST' }, "text");
      const txt = (r.data || '').trim();
      if (txt === 'success' || txt.toLowerCase() === 'ok') {
        try { sessionStorage.removeItem('loggedIn'); } catch { }
        location.href = 'loading2.html'; return;
      }
      try {
        const j = JSON.parse(txt);
        if (j?.ok || j?.success) { location.href = 'loading2.html'; return; }
      } catch { }
      alert('❌ Logout failed: ' + txt);
    } catch (err) {
      alert('❌ Logout failed: ' + err.message);
    }
  });
}

/* ===== Load Profile & hydrate UI ===== */
let CURRENT_USER_ID = null;
let CURRENT_USER_NAME = null;

async function loadProfile(attempt = 1, max = 5) {
  const uidEl = $('#profileUid');
  if (uidEl) { uidEl.textContent = `UID: Loading (Attempt ${attempt})...`; uidEl.style.color = 'yellow'; }

  try {
    const r = await fetchFirst(API.profile);
    const u = r.data?.user || r.data?.data || r.data;
    if (!u) throw new Error('No user payload');

    hydrateProfileUI(u);

    // After profile, refresh online panel
    fetchOnlineAndRender();
  } catch (err) {
    if (attempt < max) return setTimeout(() => loadProfile(attempt + 1, max), 900);
    if (uidEl) { uidEl.textContent = 'UID: Error loading'; uidEl.style.color = 'red'; }
    console.error('Profile load error:', err);
  }
}

function hydrateProfileUI(u) {
  const username = u.username || u.name || 'Player';
  const uid = u.uid || u.user_id || u.id || u.account_id || 'N/A';
  const points = (u.points ?? u.score ?? 0);
  const avatar = u.profile_picture || u.avatar || 'assets/img/c4.png';
  const email = u.email || '';

  CURRENT_USER_ID = String(uid);
  CURRENT_USER_NAME = username;

  const bust = avatar + `?t=${Date.now()}`;

  $('#miniAvatar') && ($('#miniAvatar').src = bust);
  $('#miniName') && ($('#miniName').textContent = username);

  $('#profileAvatar') && ($('#profileAvatar').src = bust);
  $('#profileUsername') && ($('#profileUsername').textContent = username);
  const uidEl = $('#profileUid');
  if (uidEl) { uidEl.textContent = `UID: ${uid}`; uidEl.style.color = 'rgba(255,255,255,0.7)'; }
  $('#profilePoints') && ($('#profilePoints').textContent = String(points));
  $('#profileEmail') && ($('#profileEmail').value = email);
  $('#profileUsernameInput') && ($('#profileUsernameInput').value = username);


  // records
  const recWrap = $('#recordsList');
  if (recWrap) {
    recWrap.innerHTML = '';
    const recFromAPI = Array.isArray(u.records) ? u.records : null;
    const items = recFromAPI && recFromAPI.length ? recFromAPI : [
      { name: 'Games Played', value: String(u.games_played ?? 0) },
      { name: 'Wins', value: String(u.wins ?? 0) },
      { name: 'Correct Answers', value: String(u.correct_answers ?? 0) }
    ];
    items.forEach(it => {
      const row = document.createElement('div'); row.className = 'record-row';
      row.innerHTML = `<div class="left">${escapeHTML(it.name || 'Record')}</div><div class="right" style="font-weight:900">${escapeHTML(it.value || '0')}</div>`;
      recWrap.appendChild(row);
    });
  }
}

/* ===== Small util for safety ===== */
function escapeHTML(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
/* ===== Carousel + Modes =====
   Clean: no locks, no purchase flow, click => create.html
*/
const modeItems = [
  { id: 'm3', title: 'Multiplayer 3P', players: 3, desc: 'Quick 3-player matches' },
  { id: 'm6', title: 'Multiplayer 6P', players: 6, desc: 'Larger 6-player games' } // unlocked by design
];

let modeIndex = 0;
let selectedMode = modeItems[0];

const modesRow = $('#modesRow');
const modeViewport = $('#modeViewport');
const selectedModeLabel = $('#selectedModeLabel');
const navLeft = $('#navLeft');
const navRight = $('#navRight');
const btnChoose = $('#btn-choose');

// filterInput might not exist in current HTML — create safe ref
const filterInput = $('#filterInput') || { value: '' };

let isDragging = false, startX = 0, startTranslate = 0, currentTranslate = 0;
const dragThreshold = 6; let movedDuringPointer = false; let navLocked = false;

/* Render the mode cards */
function renderModes() {
  if (!modesRow) return;
  modesRow.innerHTML = '';

  modeItems.forEach((m, idx) => {
    const c = document.createElement('div');
    c.className = 'mode-card'; c.dataset.idx = String(idx);
    c.setAttribute('role', 'button'); c.setAttribute('tabindex', '0');
    c.innerHTML = `
      <div class="mode-left">${m.players}P</div>
      <div class="mode-body"><div class="mode-title">${escapeHTML(m.title)}</div><div class="mode-sub">${escapeHTML(m.desc)}</div></div>
      <div class="mode-meta"><div style="font-size:13px">Mode</div><div style="font-weight:800;font-size:18px">${m.players} Players</div></div>
    `;
    // click: if user drags, ignore. Otherwise redirect to create.html immediately
    c.addEventListener('click', () => {
      if (movedDuringPointer) { movedDuringPointer = false; return; }
      // store selection if needed (localStorage) then go to create
      try { localStorage.setItem('CHEMSAGA_SELECTED_MODE', m.id); } catch {}
      location.href = 'create.html';
    });
    c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.click(); } });
    modesRow.appendChild(c);
  });

  // allow layout to settle then center
  requestAnimationFrame(() => centerMode(modeIndex, false));
}

/* Read computed translateX of modesRow */
function readCurrentTranslate() {
  if (!modesRow) return 0;
  const tr = getComputedStyle(modesRow).transform;
  if (!tr || tr === 'none') return 0;
  const m2 = tr.match(/matrix\((.+)\)/);
  if (m2) { return parseFloat(m2[1].split(',')[4]) || 0; }
  const m3 = tr.match(/matrix3d\((.+)\)/);
  if (m3) { return parseFloat(m3[1].split(',')[12]) || 0; }
  return 0;
}

/* Set translateX with optional animation */
function setTranslate(x, animate = true) {
  if (!modesRow) return;
  if (!animate) {
    const prev = modesRow.style.transition;
    modesRow.style.transition = 'none';
    modesRow.style.transform = `translateX(${x}px)`;
    modesRow.getBoundingClientRect();
    modesRow.style.transition = prev || '';
    currentTranslate = x; return;
  }
  modesRow.style.transform = `translateX(${x}px)`; currentTranslate = x;
}

/* Center a mode card into viewport center */
function centerMode(idx, animate = true) {
  if (!modesRow || !modeViewport) return;
  const cards = $$(`.mode-card`);
  if (!cards.length) return;
  idx = ((idx % cards.length) + cards.length) % cards.length; modeIndex = idx;
  const sel = cards[modeIndex];
  const selRect = sel.getBoundingClientRect();
  const contRect = modeViewport.getBoundingClientRect();
  const delta = (contRect.left + contRect.width / 2) - (selRect.left + selRect.width / 2);
  const next = readCurrentTranslate() + delta;

  if (!animate) { setTranslate(next, false); finishVisualUpdate(); return; }
  if (navLocked) return;
  navLocked = true;
  setTranslate(next, true);
  finishVisualUpdate();

  const onEnd = (ev) => {
    if (ev?.target !== modesRow) return;
    modesRow.removeEventListener('transitionend', onEnd);
    setTimeout(() => navLocked = false, 12);
  };
  modesRow.addEventListener('transitionend', onEnd);
}

/* After visual move, update classes and rooms */
function finishVisualUpdate() {
  $$(`.mode-card`).forEach((el, i) => { el.classList.toggle('center', i === modeIndex); el.classList.toggle('dim', i !== modeIndex); });
  selectedMode = modeItems[modeIndex];
  if (selectedModeLabel) selectedModeLabel.textContent = selectedMode.title;
  renderRooms((filterInput.value || '').trim());
}

/* Pointer/drag handling for carousel */
function onPointerDown(e) {
  if (e.type === 'pointerdown' && e.button && e.button !== 0) return;
  isDragging = true; movedDuringPointer = false;
  startX = (e.clientX ?? e.touches?.[0]?.clientX);
  startTranslate = readCurrentTranslate(); currentTranslate = startTranslate;
  modesRow?.classList?.add('dragging'); document.body.style.userSelect = 'none';
}
function onPointerMove(e) {
  if (!isDragging) return;
  const x = (e.clientX ?? e.touches?.[0]?.clientX);
  const dx = x - startX;
  if (Math.abs(dx) > dragThreshold) movedDuringPointer = true;
  currentTranslate = startTranslate + dx;
  if (modesRow) modesRow.style.transform = `translateX(${currentTranslate}px)`;
}
function onPointerUp() {
  if (!isDragging) return;
  isDragging = false; modesRow?.classList?.remove('dragging'); document.body.style.userSelect = '';
  const cards = $$(`.mode-card`); if (!cards.length) return;
  const contRect = modeViewport.getBoundingClientRect(); const mid = contRect.left + contRect.width / 2;
  let best = 0, dist = Infinity;
  cards.forEach((el, i) => { const r = el.getBoundingClientRect(); const c = r.left + r.width / 2; const d = Math.abs(c - mid); if (d < dist) { dist = d; best = i; } });
  centerMode(best, true); movedDuringPointer = false;
}

/* Attach pointer/touch listeners */
modeViewport?.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerup', onPointerUp);
modeViewport?.addEventListener('touchstart', onPointerDown, { passive: true });
window.addEventListener('touchmove', onPointerMove, { passive: true });
window.addEventListener('touchend', onPointerUp);

/* Nav buttons */
navLeft && navLeft.addEventListener('click', () => !navLocked && centerMode((modeIndex - 1 + modeItems.length) % modeItems.length, true));
navRight && navRight.addEventListener('click', () => !navLocked && centerMode((modeIndex + 1) % modeItems.length, true));
window.addEventListener('keydown', (e) => { if (navLocked) return; if (e.key === 'ArrowLeft') centerMode((modeIndex - 1 + modeItems.length) % modeItems.length, true); else if (e.key === 'ArrowRight') centerMode((modeIndex + 1) % modeItems.length, true); });
window.addEventListener('resize', () => centerMode(modeIndex, false));

/* CREATE button (desktop) — still works */ 
btnChoose?.addEventListener('click', () => {
  const m = modeItems[modeIndex] || modeItems[0];
  try { localStorage.setItem('CHEMSAGA_SELECTED_MODE', m.id); } catch { }
  location.href = 'create.html';
});
  /* ===== Rooms list (demo hook) =====
   - Hidden when empty (removes empty card frame)
*/
const sampleRooms = []; // keep as demo placeholder; populate from API as needed
const roomsListEl = $('#roomsList');

function renderRooms(filter = '') {
  if (!roomsListEl) return;
  roomsListEl.innerHTML = '';
  const f = (filter || '').toLowerCase();

  // Filter sample rooms by search and by mode players capacity
  const shown = sampleRooms.filter(r => (r.name || '').toLowerCase().includes(f) && (r.max <= (selectedMode?.players || 999)));

  if (!shown.length) {
    // hide the whole container to avoid empty card frame
    roomsListEl.style.display = 'none';
    return;
  }

  // show container and append items
  roomsListEl.style.display = 'flex';
  shown.forEach(r => {
    const row = document.createElement('div'); row.className = 'room-card';
    row.innerHTML = `
      <div class="room-avatar" aria-hidden="true"></div>
      <div class="room-info">
        <div class="room-name">${escapeHTML(r.name || 'Room')}</div>
        <div class="room-meta">Host: ${escapeHTML(r.host || 'Host')} • ${r.players || 0}/${r.max || 0} players • ${escapeHTML(r.mode || '')}</div>
      </div>
      <div><button class="btn" data-id="${r.id || ''}">${(r.players || 0) >= (r.max || 0) ? 'Full' : 'Join'}</button></div>
    `;
    roomsListEl.appendChild(row);
  });
}

/* ===== Search / filter safe wiring =====
   Note: if there is no filterInput in the HTML it won't break (we guard earlier).
*/
$('#filterInput')?.addEventListener('input', e => searchAll(e.target.value));
function searchAll(q) {
  q = (q || '').trim().toLowerCase();
  $$('.mode-card').forEach(el => el.classList.remove('match'));
  if (!q) { renderRooms(''); return; }
  const idx = modeItems.findIndex(m => {
    const t = (m.title + ' ' + m.desc + ' ' + m.players + 'p').toLowerCase();
    return t.includes(q) || q === `${m.players}p` || q === `${m.players} players` || q === String(m.players);
  });
  if (idx !== -1) { document.querySelector(`.mode-card[data-idx="${idx}"]`)?.classList.add('match'); centerMode(idx, true); }
  renderRooms(q);
}

/* ===== Online players & invites ===== */
const playersList = $('#playersList');
const onlineCount = $('#onlineCount');
const onlineCountFooter = $('#onlineCountFooter');
const INVITE_COOLDOWN_MS = 5000;
const inviteCooldowns = new Map();

async function phpInvite(roomId, toUserId) {
  const fd = new FormData(); fd.append('room_id', roomId); fd.append('to_user_id', toUserId);
  const r = await fetchFirst(API.invitesSend, { method: 'POST', body: fd });
  const data = r.data;
  if (!data.ok) {
    if (data.error === 'cooldown') showTinyToast('Please wait ' + (data.retry_after ?? '') + 's');
    else if (data.error === 'target_in_other_room') showTinyToast('That player is already in another room');
    else if (data.error === 'not_room_member') showTinyToast('Join the room to invite players');
    else showTinyToast('Invite failed: ' + (data.error || 'unknown'));
    throw new Error(data.error || 'invite_failed');
  }
  return data;
}

function getCurrentRoomIdFromMemory() {
  try { return localStorage.getItem('CHEMSAGA_CURRENT_ROOM_ID') || null; } catch { return null; }
}

function renderOnlinePlayers(users, totalCountOverride) {
  if (!playersList) return;
  playersList.innerHTML = '';

  const myRoomId = String(getCurrentRoomIdFromMemory() ?? '');
  const myId = String(CURRENT_USER_ID ?? '');
  const canInvite = !!myRoomId;

  if (!users?.length) {
    playersList.innerHTML = `<div class="player" style="opacity:.8;">No other players online</div>`;
  } else {
    users.forEach(u => {
      const row = document.createElement('div'); row.className = 'player';
      const avatarSrc = u.avatar || u.profile_picture || 'assets/img/c4.png';
      const displayName = u.username || 'Player';
      const rawId = u.id ?? u.user_id ?? u.uid ?? u.account_id;
      const toUidNum = parseInt(rawId, 10);
      const hasNumericId = Number.isFinite(toUidNum) && toUidNum > 0;
      const theirRoomId = String(u.current_room_id ?? '');
      const hasRoom = !!theirRoomId;
      const isInMyRoom = hasRoom && (theirRoomId === myRoomId);
      const isSelf = hasNumericId && (String(toUidNum) === myId);

      row.innerHTML = `
        <div class="left">
          <div class="avatar"><img src="${avatarSrc}" alt="${displayName}" style="width:44px;height:44px;object-fit:cover;border-radius:50%;border:1px solid #ffffff24;" /></div>
          <div class="meta"><span class="name">${escapeHTML(displayName)}</span></div>
        </div>
        <div class="right-slot"></div>
      `;
      const right = row.querySelector('.right-slot');

      if (!isSelf) {
        if (!hasNumericId) {
          const ph = document.createElement('span'); ph.style.opacity = '.3'; ph.textContent = 'No ID'; right.appendChild(ph);
          playersList.appendChild(row); return;
        }
        if (!hasRoom) {
          const btn = document.createElement('button'); btn.className = 'btn'; btn.dataset.uid = String(toUidNum);
          const now = Date.now(); const until = inviteCooldowns.get(toUidNum) || 0; const cool = now < until;
          btn.textContent = cool ? 'Sent' : 'Invite';
          btn.disabled = !canInvite || cool;
          btn.title = !canInvite ? 'Join a room to invite' : (cool ? `Please wait ${Math.ceil((until - now) / 1000)}s` : 'Send invitation');
          if (canInvite) {
            btn.addEventListener('click', async (e) => {
              e.stopPropagation();
              const rid = getCurrentRoomIdFromMemory(); if (!rid) { showTinyToast('No active room'); return; }
              const now2 = Date.now(); const until2 = inviteCooldowns.get(toUidNum) || 0;
              if (now2 < until2) { showTinyToast(`Wait ${Math.ceil((until2 - now2) / 1000)}s`); return; }
              try {
                await phpInvite(rid, toUidNum);
                btn.disabled = true; btn.textContent = 'Sent';
                inviteCooldowns.set(toUidNum, now2 + INVITE_COOLDOWN_MS);
                setTimeout(() => { btn.disabled = false; btn.textContent = 'Invite'; }, INVITE_COOLDOWN_MS);
                showTinyToast('📨 Invitation sent');
              } catch { }
            });
          } else {
            btn.style.opacity = '.35'; btn.style.pointerEvents = 'none';
          }
          right.appendChild(btn);
        } else {
          const icon = document.createElement('button'); icon.className = 'home-icon'; icon.disabled = true;
          icon.setAttribute('aria-label', isInMyRoom ? 'Already in your room' : 'Already joined another room');
          icon.title = icon.getAttribute('aria-label');
          icon.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="#00e676" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;">
              <path d="M3 11l9-7 9 7"></path><path d="M9 22V12h6v10"></path>
            </svg>`;
          right.appendChild(icon);
        }
      } else {
        const ph = document.createElement('span'); ph.style.opacity = '.3'; right.appendChild(ph);
      }
      playersList.appendChild(row);
    });
  }

  const count = Number.isFinite(totalCountOverride) ? totalCountOverride : (users ? users.length : 0);
  onlineCount && (onlineCount.textContent = String(count));
  onlineCountFooter && (onlineCountFooter.textContent = String(count));
}

/* ===== Fetch online users from API and render ===== */
async function fetchOnlineAndRender() {
  try {
    const all = await fetchFirst(API.listOnline); // include self
    const totalCount = Array.isArray(all.data?.users) ? all.data.users.length : 0;

    const others = await fetchFirst(API.listOnline.map(u => u + (u.includes('?') ? '&' : '?') + 'exclude_self=1'));
    let list = Array.isArray(others.data?.users) ? others.data.users : [];

    // de-dupe by id/name
    const seen = new Set();
    list = list.filter(u => {
      const id = String(u.id ?? u.user_id ?? u.uid ?? '');
      const name = (u.username || '').trim();
      const key = id ? 'id:' + id : 'name:' + name;
      if (seen.has(key)) return false; seen.add(key); return true;
    });

    renderOnlinePlayers(list, totalCount);
  } catch {
    renderOnlinePlayers([], 0);
  }
}

/* tiny toast helper */
window.showTinyToast = window.showTinyToast || (function () {
  let el;
  return function (msg) {
    if (!el) {
      el = document.createElement('div');
      el.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#1119;color:#fff;padding:10px 14px;border-radius:10px;font:600 13px/1 system-ui;z-index:99999;opacity:0;transition:opacity .2s';
      document.body.appendChild(el);
    }
    el.textContent = msg; el.style.opacity = '1'; setTimeout(() => el.style.opacity = '0', 1500);
  };
})();

/* ===== Tabs for social panel ===== */
document.querySelectorAll('.tab-btn').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    const key = t.dataset.tab;
    const panels = { players: $('#panelPlayers'), friends: $('#panelFriends'), add: $('#panelAdd') };
    Object.keys(panels).forEach(k => panels[k].style.display = (k === key ? 'block' : 'none'));
    if (key === 'players') fetchOnlineAndRender();
  });
});

/* ===== Init entrypoint ===== */
function init() {
  renderModes();
  window.addEventListener('load', () => { centerMode(modeIndex, false); fetchOnlineAndRender(); setInterval(fetchOnlineAndRender, 4000); });
  window.addEventListener('resize', () => centerMode(modeIndex, false));
  renderRooms('');
}
init();
