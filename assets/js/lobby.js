/* ============================
   CHEMSAGA Lobby — v2025-10-30a
   ============================ */
console.info('%cCHEMSAGA','font-weight:bold','lobby.js v2025-10-30a loaded');

const $ = sel => document.querySelector(sel);
const qs = k => new URLSearchParams(location.search).get(k);

let ACTIVE_ROOM_ID = qs('fromRoomId') || null;
let ACTIVE_ROOM_OPEN = false;
let poll = null;

/* ---------- Profile modal (open/close) ---------- */
function openProfile(){
  const m = $('#profileModal'); if(!m) return;
  m.style.display='flex';
  m.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  const c = m.querySelector('.profile-card');
  if(c){ c.classList.remove('modal-pop'); void c.offsetWidth; c.classList.add('modal-pop'); }
  (m.querySelector('.close-btn')||{}).focus?.();
}
function closeProfile(){
  const m = $('#profileModal'); if(!m) return;
  m.style.display='none';
  m.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}
window.closeProfile = closeProfile; // for inline onclick in HTML

$('#profileToggle')?.addEventListener('click', openProfile);
$('#profileModal')?.addEventListener('click', e=>{ if(e.target.id==='profileModal') closeProfile(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeProfile(); });

/* ---------- Profile data load ---------- */
async function loadProfile(attempt=1,max=5){
  const uidEl = $('#profileUid');
  if(uidEl){ uidEl.textContent=`UID: Loading (Attempt ${attempt})...`; uidEl.style.color='yellow'; }
  try{
    const r = await fetch('../php/api/get_profile.php',{credentials:'include',cache:'no-store'});
    const t = await r.text();
    let d; try{ d = JSON.parse(t); }catch{ throw new Error('JSON parse error: '+t); }
    if(!d.success || !d.user) throw new Error(d.error||'Profile fetch failed');

    const ts = Date.now();
    // top-right chip
    $('#miniAvatar') && ($('#miniAvatar').src = `${d.user.profile_picture}?t=${ts}`);
    $('#miniName') && ($('#miniName').textContent = d.user.username || 'Player');

    // modal
    $('#profileAvatar') && ($('#profileAvatar').src = `${d.user.profile_picture}?t=${ts}`);
    $('#profileUsername') && ($('#profileUsername').textContent = d.user.username || 'Player');
    if(uidEl){ uidEl.textContent = `UID: ${d.user.uid || 'N/A'}`; uidEl.style.color='rgba(255,255,255,0.7)'; }
    $('#profilePoints') && ($('#profilePoints').textContent = d.user.points ?? '0');
    $('#profileEmail') && ($('#profileEmail').value = d.user.email || '');
    $('#profileUsernameInput') && ($('#profileUsernameInput').value = d.user.username || '');

    const recList = $('#recordsList');
if (recList) {
    recList.innerHTML = '';

    const rec = d.user.records || [];  // SAFE fallback

    if (rec.length === 0) {
        recList.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">No Records</span>
                <span class="stat-value">—</span>
            </div>`;
    } else {
        rec.forEach(r => {
            const div = document.createElement('div');
            div.className = 'stat-item';
            div.innerHTML = `
                <span class="stat-label">${r.name}</span>
                <span class="stat-value">${r.value}</span>
            `;
            recList.appendChild(div);
        });
    }
}

  }catch(err){
    console.error('loadProfile error:', err);
    if(attempt<max) return setTimeout(()=>loadProfile(attempt+1,max), 900);
    if(uidEl){ uidEl.textContent='UID: Error loading'; uidEl.style.color='red'; }
  }
}

/* ---------- Profile: avatar upload ---------- */
function wireAvatarUpload(){
  const avatar = $('#profileAvatar');
  const input  = $('#profileAvatarInput');
  if(!avatar || !input) return;

  avatar.addEventListener('click', ()=> input.click());
  input.addEventListener('change', async (e)=>{
    const file = e.target.files?.[0];
    if(!file) return;
    avatar.src = URL.createObjectURL(file); // preview

    try{
      const formData = new FormData();
      formData.append('update_type','avatar');
      formData.append('profile_picture', file);
      const res = await fetch('../php/api/update_profile.php', {
        method:'POST', body: formData, credentials:'include'
      });
      const text = await res.text();
      let data; try{ data = JSON.parse(text);}catch{ throw new Error('Invalid JSON: '+text); }
      if(!data.success) throw new Error(data.error || 'Avatar update failed');

      await loadProfile();
      alert('✅ Avatar updated');
    }catch(err){
      console.error('Avatar upload error:', err);
      alert('❌ Avatar update failed: ' + err.message);
    }finally{
      input.value = '';
    }
  });
}

/* ---------- Profile: inline field updates ---------- */
function wireProfileFieldUpdates(){
  const email = $('#profileEmail');
  const uname = $('#profileUsernameInput');

  async function submitProfileUpdate(field, value){
    try{
      const fd = new FormData();
      fd.append('update_type','profile');
      fd.append(field, value);
      const res = await fetch('../php/api/update_profile.php', {
        method:'POST', body:fd, credentials:'include'
      });
      const data = await res.json();
      if(!data.success) throw new Error(data.error || 'Update failed');
      await loadProfile();
    }catch(err){
      console.error('Profile update error:', err);
      alert('❌ Profile update failed: ' + err.message);
    }
  }

  email?.addEventListener('blur', ()=> submitProfileUpdate('email', email.value));
  uname?.addEventListener('blur', ()=> submitProfileUpdate('username', uname.value));
}

/* ---------- Profile: logout (AJAX) ---------- */
function wireLogout(){
  const form = $('#logoutForm');
  if(!form) return;
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    try{
      const res = await fetch('../php/api/logout.php', { method:'POST', credentials:'include' });
      const text = await res.text();
      if(text.trim() === 'success'){
        try{ sessionStorage.removeItem('loggedIn'); }catch{}
        location.href = 'loading2.html';
      }else{
        alert('❌ Logout failed: ' + text);
      }
    }catch(err){
      console.error('Logout error:', err);
      alert('❌ Logout failed: ' + err.message);
    }
  });
}

/* ---------- Back/Return buttons ---------- */
const backBtn = $('#backBtn');
$('#returnBtn') && ($('#returnBtn').style.display='none');
$('#backRoomBtn') && ($('#backRoomBtn').style.display='none');

function setBackAsMenu(){
  if(!backBtn) return;
  backBtn.title = 'Back to Menu';
  backBtn.setAttribute('aria-label','Back to Menu');
  backBtn.innerHTML = `<i class="fa-solid fa-reply"></i>`;
  backBtn.onclick = () => location.href = 'scene2.html';
}
function setBackAsReturn(rid){
  if(!backBtn) return;
  backBtn.title = 'Return to Room';
  backBtn.setAttribute('aria-label','Return to Room');
  backBtn.innerHTML = `<i class="fa-solid fa-arrow-left"></i>`;
  backBtn.onclick = () => location.href = `multi2.html?room_id=${encodeURIComponent(rid)}`;
}

async function verifyActiveRoom(){
  if(!ACTIVE_ROOM_ID){ ACTIVE_ROOM_OPEN=false; setBackAsMenu(); return; }
  try{
    const res = await fetch(`../php/api/room_detail.php?room_id=${encodeURIComponent(ACTIVE_ROOM_ID)}`, {credentials:'include', cache:'no-store'});
    const data = await res.json();
    if(!data.ok) throw new Error(data.error||'not_ok');
    const status = data.room?.status || 'closed';
    ACTIVE_ROOM_OPEN = (status === 'open');
  }catch(e){
    ACTIVE_ROOM_OPEN = false;
  }
  if(ACTIVE_ROOM_OPEN){ setBackAsReturn(ACTIVE_ROOM_ID); }
  else { setBackAsMenu(); }
}

/* ---------- Lobby fetch + render ---------- */
const lobbyListEl = $('#lobbyList');
const refreshBtn  = $('#refreshBtn');
const refreshLabel = $('#refreshLabel');
const refreshSpinner = $('#refreshSpinner');

async function fetchLobby(){
  try{
    refreshLabel && (refreshLabel.style.display='none');
    refreshSpinner && (refreshSpinner.style.display='inline-block');

    await verifyActiveRoom();

    const res = await fetch('../php/api/list_rooms.php',{credentials:'include', cache:'no-store'});
    const data = await res.json();
    if(!data.ok){ showLobbyMessage('Error loading lobby. Please try again.'); return; }

    renderLobby(Array.isArray(data.rooms) ? data.rooms : []);
  }catch(e){
    console.error(e);
    showLobbyMessage('Network error. Please try again.');
  }finally{
    refreshLabel && (refreshLabel.style.display='inline');
    refreshSpinner && (refreshSpinner.style.display='none');
  }
}

function showLobbyMessage(msg){
  if (!lobbyListEl) return;
  lobbyListEl.innerHTML = `<div style="padding:28px;text-align:center;color:#ddd;">${msg}</div>`;
}

function renderLobby(rooms){
  if (!lobbyListEl) return;
  lobbyListEl.innerHTML='';

  if (ACTIVE_ROOM_ID && ACTIVE_ROOM_OPEN){
    const info = document.createElement('div');
    info.style.cssText = 'margin:6px 0 12px;color:#ccc;font-size:13px;';
    info.innerHTML = `You are currently in <b>Room #${ACTIVE_ROOM_ID}</b>. Use <b>Return</b> to go back. Joining other rooms is disabled.`;
    lobbyListEl.appendChild(info);
  }

  if(!rooms.length){
    showLobbyMessage('No open games found. Click Refresh to search again.');
    return;
  }

  rooms.forEach(r=>{
    const isPrivate = (r.visibility||'').toLowerCase()==='private';
    const players = Number(r.players||0);
    const max     = Number(r.max_players|| (String(r.mode_label||'').includes('6') ? 6 : 3));
    const full    = players >= max;

    const row = document.createElement('div'); row.className='game-card';

    const hostAvatar = r.host_avatar || 'assets/img/c4.png';
    const avatar = document.createElement('div'); avatar.className='game-avatar';
    avatar.style.backgroundImage = `url('${hostAvatar}?t=${Date.now()}')`;
    avatar.style.backgroundColor = '#1a0a2e';

    const info = document.createElement('div'); info.className='game-info';
    const gname = document.createElement('div'); gname.className='game-name';
    gname.textContent = `${r.mode_label || '3P'} • ${r.players ?? 1}/${r.max_players ?? (String(r.mode_label||'').includes('6')?6:3)}`;
    const metaTop = document.createElement('div'); metaTop.className='meta';
    metaTop.innerHTML = `
      <div class="host">Host: ${r.host_username || 'Unknown'}</div>
      <div class="vis ${isPrivate?'private':'public'}">${isPrivate?'Private':'Public'}</div>
    `;
    info.appendChild(gname); info.appendChild(metaTop);

    const rightMeta = document.createElement('div'); rightMeta.className='meta';
    rightMeta.innerHTML = `
      <div class="players">${players}/${max}</div>
      <div class="status">Status: ${r.status || 'open'}</div>
    `;

    const btn = document.createElement('button'); btn.className='join-btn';
    if (ACTIVE_ROOM_ID && ACTIVE_ROOM_OPEN){
      btn.textContent = 'Locked'; btn.disabled = true;
    } else if (full){
      btn.textContent = 'Full'; btn.disabled = true;
    } else if (isPrivate){
      btn.textContent = 'Apply';
    } else {
      btn.textContent = 'Join';
    }

    btn.addEventListener('click', async ()=>{
      if(btn.disabled) return;
      try{
        const fd = new FormData(); fd.append('room_id', r.room_id);
        const res = await fetch('../php/api/join_room.php', { method:'POST', body:fd, credentials:'include' });
        const data = await res.json();
        if(!data.ok) throw new Error(data.error||'join failed');
        if(data.requires_approval){ alert('Request sent. Wait for host approval.'); }
        if(data.joined){ location.href = `multi2.html?room_id=${encodeURIComponent(r.room_id)}`; }
      }catch(err){ alert('❌ '+err.message); }
    });

    row.appendChild(avatar);
    row.appendChild(info);
    row.appendChild(rightMeta);
    row.appendChild(btn);
    lobbyListEl.appendChild(row);
  });
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', async ()=>{

  await loadProfile();
  wireAvatarUpload();
  wireProfileFieldUpdates();
  wireLogout();

  
await fetchLobby();

poll = null;

});
