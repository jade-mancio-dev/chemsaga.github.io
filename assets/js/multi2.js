  // put this at the very top of multi2.js
  /* ===========================
    CHEMSAGA multi2.js (UI + permissions + PHP invites + WS popup)
    - Players panel rendering is now handled by profile-display.js
    - Player side is restricted (Modes/Edit/Start disabled + dim)
    - Online list + Invite buttons on the right side
    - PHP endpoints used for invitations (send/respond)
    - NEW: Inline WebSocket helper + modal popup (Accept/Decline)
    NOTE: Make sure profile-display.js is loaded BEFORE this script.
  =========================== */

  function qs(name){ return new URLSearchParams(window.location.search).get(name); }
  function $(s){ return document.querySelector(s); }
  function $all(s){ return Array.from(document.querySelectorAll(s)); }

  let roomId=null, roomData=null, IS_HOST=false;

  // Keep current user profile (for synthesizing "YOU")
  let CURRENT_USER_ID=null, CURRENT_USER_NAME=null, CURRENT_USER_AVATAR='assets/img/c4.png';

  // Promises so we start after profile + room are both known 
  let __profileReadyResolve, __roomReadyResolve;
  const profileReady = new Promise(r => (__profileReadyResolve = r));
  const roomReady = new Promise(r => (__roomReadyResolve = r));

  /* ===== Invite button tiny styles (ensure right slot & sizing) ===== */
  (function ensureInviteRowStyles(){
    if (document.querySelector('style[data-chemsaga-invite-style]')) return;
    const css = `
      #playersList .player{ display:flex; align-items:center; justify-content:space-between; gap:10px; }
      #playersList .player .left{ display:flex; align-items:center; gap:10px; }
      #playersList .player .right-slot{ display:flex; align-items:center; }
      #playersList .player .right-slot .btn{ height:34px; padding:6px 10px; border-radius:10px; }
    `;
    const tag = document.createElement('style');
    tag.setAttribute('data-chemsaga-invite-style','1');
    tag.textContent = css;
    document.head.appendChild(tag);
  })();

  /* ===== Players list scroll + icon polish (isolated, non-invasive) ===== */
  (function ensurePlayersListScroll(){
    if (document.querySelector('style[data-chemsaga-playerslist-style]')) return;
    const css = `
      #playersList { max-height: 320px; overflow-y: auto; padding-right: 6px; }
      #playersList .player .right-slot .btn { transition: opacity .2s ease; }
      #playersList .player .home-icon { display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:10px; background:transparent; border:none; cursor:default; padding:0; }
      #playersList .player .home-icon svg { width:20px; height:20px; }
    `;
    const tag = document.createElement('style');
    tag.setAttribute('data-chemsaga-playerslist-style','1');
    tag.textContent = css;
    document.head.appendChild(tag);
  })();

  /* ===== Helpers ===== */
  function getCurrentRoomId(){
    const rid = qs('room_id');
    if (rid) return rid;
    const fr = qs('fromRoomId');
    if (fr) return fr;
    try{ const mem = localStorage.getItem('CHEMSAGA_CURRENT_ROOM_ID'); if (mem) return mem || null; }catch{}
    return null;
  }

  /* ===== Tiny toast fallback (used throughout) ===== */
  window.showTinyToast = window.showTinyToast || (function(){
    let el;
    return function(msg){
      if(!el){
        el=document.createElement('div');
        el.style.cssText='position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#1119;color:#fff;padding:10px 14px;border-radius:10px;font:600 13px/1 system-ui;z-index:99999;opacity:0;transition:opacity .2s';
        document.body.appendChild(el);
      }
      el.textContent=msg; el.style.opacity='1'; setTimeout(()=> el.style.opacity='0', 1500);
    };
  })();

  /* ===== Settings modal ===== */
  let _focusables=[];
  function trapFocus(m){ _focusables=m.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'); if(_focusables.length){_focusables[0].focus(); m.addEventListener('keydown',handleKeydown);} }
  function releaseFocusTrap(){ document.removeEventListener('keydown',handleKeydown); }
  function handleKeydown(e){ if(e.key==='Escape') closeSettings(); else if(e.key==='Tab'){ const f=_focusables[0], l=_focusables[_focusables.length-1]; if(e.shiftKey && document.activeElement===f){ e.preventDefault(); l.focus(); } else if(!e.shiftKey && document.activeElement===l){ e.preventDefault(); f.focus(); } } }
  function openSettings(){ const m=$('#settingsModal'); if(!m) return; m.setAttribute('aria-hidden','false'); m.style.display='block'; trapFocus(m); }
  function closeSettings(){ const m=$('#settingsModal'); if(!m) return; m.setAttribute('aria-hidden','true'); m.style.display='none'; releaseFocusTrap(); }
  $('#settingsModal')?.addEventListener('click',e=>{ if(e.target?.id==='settingsModal') closeSettings(); });
  window.openSettings=openSettings; window.closeSettings=closeSettings;

  /* ===== Back modal ===== */
  function openBackModal(){
    const modal=$('#backModal'); if(!modal) return;
    const title=modal.querySelector('.pop-title');
    const confirmBtn=modal.querySelector('.btn.danger');
    const body=modal.querySelector('.pop-body p');
    if(IS_HOST){ title.textContent='DISBAND ROOM'; body.textContent='Do you want to disband this room?'; confirmBtn.textContent='Disband'; }
    else { title.textContent='LEAVE ROOM'; body.textContent='Do you want to leave this room?'; confirmBtn.textContent='Leave'; }
    modal.style.display='flex'; modal.setAttribute('aria-hidden','false');
    const card=modal.querySelector('.pop-card');
    card.style.transform='scale(0.5)'; card.style.opacity='0';
    card.animate([{transform:'scale(0.5)',opacity:0},{transform:'scale(1.1)',opacity:1,offset:.6},{transform:'scale(.96)',offset:.8},{transform:'scale(1)',opacity:1}],{duration:350,easing:'cubic-bezier(.3,1.4,.3,1)',fill:'forwards'});
  }
  function closeBackModal(){ const modal=$('#backModal'); if(!modal) return; modal.style.display='none'; modal.setAttribute('aria-hidden','true'); }
  async function confirmBackAction(){
    const rid=getCurrentRoomId(); const fd=new FormData(); if(rid) fd.append('room_id',rid);
    try{
      if(IS_HOST){
        const r=await fetch('../php/api/disband_room.php',{method:'POST',body:fd,credentials:'include'}); const j=await r.json();
        if(!j.ok) throw new Error(j.error||'disband_failed');
        window.location.href='scene2.html';
      }else{
        const r=await fetch('../php/api/leave_room.php',{method:'POST',body:fd,credentials:'include'}); const j=await r.json();
        if(!j.ok) throw new Error(j.error||'leave_failed');
        window.location.href='lobby.html';
      }
    }catch(e){ alert('❌ '+e.message); }
  }
  $('.back-button')?.addEventListener('click',e=>{ e.preventDefault(); openBackModal(); });
  window.openBackModal=openBackModal;
  window.closeBackModal=closeBackModal;
  window.confirmDisband=confirmBackAction;

  /* ===== Profile modal ===== */
  function openProfile(){ const m=$('#profileModal'); if(!m) return; m.style.display='flex'; m.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; const c=m.querySelector('.profile-card'); if(c){ c.classList.remove('modal-pop'); void c.offsetWidth; c.classList.add('modal-pop'); } m.querySelector('.close-btn')?.focus(); }
  function closeProfile(){ const m=$('#profileModal'); if(!m) return; m.style.display='none'; m.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
  window.openProfile=openProfile; window.closeProfile=closeProfile;
  $('#profileModal')?.addEventListener('click',e=>{ if(e.target?.id==='profileModal') closeProfile(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeProfile(); });

  /* ===== Load Profile (and resolve profileReady) ===== */
  function loadProfile(attempt=1,max=5){
    const uid=$('#profileUid'); if(uid){ uid.textContent=`UID: Loading (Attempt ${attempt})...`; uid.style.color='yellow'; }
    fetch('../php/api/get_profile.php',{credentials:'include'})
      .then(r=>r.text()).then(t=>{ let d; try{d=JSON.parse(t);}catch{throw new Error('JSON parse error');}
        if(!d.success||!d.user) throw new Error(d.error||'Profile fetch failed');
        const ts=Date.now();
        const avatar=(d.user.profile_picture||'assets/img/c4.png')+`?t=${ts}`;

        CURRENT_USER_ID = d.user.id ?? d.user.user_id ?? d.user.uid ?? null;
        CURRENT_USER_NAME = d.user.username || 'Player';
        CURRENT_USER_AVATAR = d.user.profile_picture || 'assets/img/c4.png';

        $('#rightProfilePic')&&( $('#rightProfilePic').src=avatar );
        $('#rightPlayerName')&&( $('#rightPlayerName').textContent=CURRENT_USER_NAME );

        $('#profileAvatar')&&( $('#profileAvatar').src=avatar );
        $('#profileUsername')&&( $('#profileUsername').textContent=CURRENT_USER_NAME );
        if(uid){ uid.textContent=`UID: ${d.user.uid||d.user.user_id||d.user.id||'N/A'}`; uid.style.color='rgba(255,255,255,.7)'; }
        $('#profilePoints')&&( $('#profilePoints').textContent=d.user.points??'0' );
        $('#profileEmail')&&( $('#profileEmail').value=d.user.email||'' );
        $('#profileUsernameInput')&&( $('#profileUsernameInput').value=CURRENT_USER_NAME );

        // NEW: connect to the WS router as soon as we know our user id
        if (window.InviteSocket && CURRENT_USER_ID) {
          InviteSocket.init(CURRENT_USER_ID);
        }

        try { __profileReadyResolve && __profileReadyResolve(); } catch {}
      })
      .catch(err=>{ if(attempt<max) setTimeout(()=>loadProfile(attempt+1,max),1000); else { if(uid){ uid.textContent='UID: Error loading'; uid.style.color='red'; } }});
  }

  /* ===== ROOM ===== */
  async function loadRoom(){
    roomId = getCurrentRoomId();
    if(!roomId){ alert('Missing room_id'); return; }
    try{
      const res=await fetch('../php/api/room_detail.php?room_id='+encodeURIComponent(roomId),{credentials:'include',cache:'no-store'});
      const data=await res.json();
      if(!data.ok){ alert('Error loading room: '+(data.error||'unknown')); window.location.href='lobby.html'; return; }
      roomData=data.room;
      IS_HOST=!!data.is_host;
      hydrateRoomUI(data);
      applyHostPermissions();
      startRoomWatchdog();

      try { __roomReadyResolve && __roomReadyResolve(); } catch {}
    }catch(e){
      alert('Network error loading room.');
    }
  }

  function hydrateRoomUI(data){
    const r=data.room;
    const t=$('#roomTitle'), m=$('#roomMeta'), idb=$('#roomIdBadge'), vb=$('#roomVisibilityBadge');
    if(t) t.textContent=`Room #${r.room_id}`;
    if(m) m.textContent=`Host: ${r.host_username} • Status: ${r.status}`;
    if(idb) idb.textContent=`ID: ${r.room_id}`;
    if(vb) vb.textContent=`Visibility: ${r.visibility}`;
    const wantPlayers=(r.mode_label||'3P').includes('6')?6:3;
    const idx=modeItems.findIndex(x=>x.players===wantPlayers); if(idx>=0) centerMode(idx,false);
    const tInputs=$all('.time-input');
    if(tInputs[0]) tInputs[0].value=r.time_per_question_sec||30;
    if(tInputs[1]) tInputs[1].value=r.game_time_min||5;
    if($('.quiz-type-select')) $('.quiz-type-select').value=r.quiz_type||'multiple-choice';
  }

  /* ===== Host permissions ===== */
  function applyHostPermissions(){
    const editBtn = $('.edit-button');
    const modeArea = $('.mode-area');
    const hostInteractive = [
      ...$all('.mode-area .nav-btn'),
      ...$all('.mode-area .time-input'),
      ...$all('.mode-area .quiz-type-select'),
      ...$all('.mode-area .start-btn'),
      ...$all('.mode-card')
    ];
    if(IS_HOST){
      if (editBtn){ editBtn.style.pointerEvents=''; editBtn.style.opacity=''; editBtn.removeAttribute('aria-disabled'); editBtn.title='Edit'; }
      if (modeArea){ modeArea.style.pointerEvents=''; modeArea.style.opacity=''; modeArea.classList.remove('dimmed'); }
      hostInteractive.forEach(el=>{ if('disabled' in el) el.disabled=false; el.classList.remove('dimmed'); el.setAttribute('aria-disabled','false'); });
      enablePointerNav(true);
    }else{
      if (editBtn){ editBtn.style.pointerEvents='none'; editBtn.style.opacity='0.45'; editBtn.setAttribute('aria-disabled','true'); editBtn.title='Host only'; }
      if (modeArea){ modeArea.style.pointerEvents='none'; modeArea.style.opacity='0.5'; modeArea.classList.add('dimmed'); }
      hostInteractive.forEach(el=>{ if('disabled' in el) el.disabled=true; el.classList.add('dimmed'); el.setAttribute('aria-disabled','true'); });
      enablePointerNav(false);
    }
  }

  /* ======= Disband Watchdog ======= */
  let watchdogTimer=null;
  function startRoomWatchdog(){
    if(watchdogTimer) clearInterval(watchdogTimer);
    const rid = getCurrentRoomId(); if(!rid) return;

    async function check(){
      try{
        const r = await fetch('../php/api/room_detail.php?room_id='+encodeURIComponent(rid), {
          credentials:'include', cache:'no-store'
        });
        if (!r.ok) { window.location.href='scene2.html'; return; }
        const data = await r.json();
        if (!data?.ok) { window.location.href='scene2.html'; return; }

        const status = (data.room?.status || '').toLowerCase();
        // only bail if room was actually closed/disbanded/deleted
        const terminal = ['closed','disbanded','ended','deleted','archived'];
        if (terminal.includes(status)) {
          window.location.href='scene2.html';
        }
        // IMPORTANT: allow 'open' and 'in_progress' — do NOT redirect
      }catch(e){
        // Network hiccup? don't kick the user immediately
      }
    }
    check();
    watchdogTimer = setInterval(check, 4000);
  }


  /* ================= INVITES: robust render + logs (RIGHT panel) ================= */

  const INVITE_COOLDOWN_MS = 5000;         // 5s per-target cooldown
  const inviteCooldowns = new Map();       // Map<toUidNum, expiresAt>
  const INV_DEBUG = true;                  // set false to silence logs
  function logInv(...args){ if (INV_DEBUG) console.log('[INV]', ...args); }

  /* --- PHP invite helper --- */
  async function phpInvite(roomId, toUserId){
    const fd = new FormData();
    fd.append('room_id', roomId);
    fd.append('to_user_id', toUserId);
    // IMPORTANT: invitations are under php/invitations (no /api/)
    const res = await fetch('../php/invitations/send.php', { method:'POST', body: fd, credentials:'include' });
    const data = await res.json();
    if(!data.ok){
    if(data.error === 'cooldown'){
      showTinyToast('Please wait ' + (data.retry_after ?? '') + 's');
    } else if (data.error === 'target_in_other_room') {
      showTinyToast('That player is already in another room');
    } else if (data.error === 'not_room_member') {         // <— NEW
      showTinyToast('Join the room to invite players');     // <— NEW
    } else if (data.error === 'not_host') {
      // no longer used, but keep for safety with older servers
      showTinyToast('Only room members can invite');
    } else {
      showTinyToast('Invite failed: ' + (data.error || 'unknown'));
    }
    throw new Error(data.error || 'invite_failed');
    }
    return data; // keep invite.invite_id for WS payload
  }

  async function fetchOnlineAndRender(){
    try {
      const allRes = await fetch('../php/api/list_online.php', {
        credentials: 'include',
        cache: 'no-store'
      });
      if (!allRes.ok) { logInv('list_online.php HTTP', allRes.status); return; }

      const allData = await allRes.json();
      if (!allData || allData.ok === false) {
        logInv('Bad payload from list_online.php (full):', allData);
        renderOnlinePlayers([], 0);
        return;
      }
      const totalCount = Array.isArray(allData.users) ? allData.users.length : 0;

      const res = await fetch('../php/api/list_online.php?exclude_self=1', {
        credentials: 'include',
        cache: 'no-store'
      });
      if (!res.ok) { logInv('list_online.php HTTP', res.status); return; }

      const data = await res.json();
      if (!data || data.ok === false) {
        logInv('Bad payload from list_online.php (exclude_self):', data);
        renderOnlinePlayers([], totalCount);
        return;
      }

      let list = Array.isArray(data.users) ? data.users : [];
      if (!Array.isArray(data.users))
        logInv('users is not array, got:', data.users);

      const seen = new Set();
      list = list.filter(u => {
        const id = String(u.id ?? u.user_id ?? u.uid ?? '');
        const name = (u.username || '').trim();
        const key = id ? 'id:' + id : 'name:' + name;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const meId = String(CURRENT_USER_ID ?? '');
      const othersOnly = list.filter(u => {
        const uid = String(u.id ?? u.user_id ?? u.uid ?? '');
        return !(meId && uid === meId);
      });

      logInv('meId=', meId, 'IS_HOST=', IS_HOST, 'roomId=', getCurrentRoomId(), 'others=', othersOnly.length, 'total=', totalCount);
      renderOnlinePlayers(othersOnly, totalCount);

    } catch (e) {
      logInv('fetchOnlineAndRender error:', e);
      renderOnlinePlayers([], 0);
    }
  }

  /**
   * Always renders a row per online player:
   *  - Invite shows ONLY if target player has no room yet
   *  - Green home icon shows if target player already joined any room (yours or other)
   *  - Self: no button/icon
   *  - Anyone who is inside a room (host or player) can invite (server still enforces host-only by default)
   */
  function renderOnlinePlayers(users, totalCountOverride){
    const wrap = document.querySelector('#playersList');
    const topCount = document.querySelector('#onlineCount');
    const footCount = document.querySelector('#onlineCountFooter');
    if (!wrap) return;

    wrap.innerHTML = '';

    const myRoomId = String(getCurrentRoomId() ?? '');
    const myId = String(CURRENT_USER_ID ?? '');
    const canInvite = !!myRoomId;

    if (!users || !users.length){
      wrap.innerHTML = `<div class="player" style="opacity:.8;">No other players online</div>`;
    } else {
      users.forEach(u=>{
        const row = document.createElement('div');
        row.className = 'player';

        const avatarSrc = (u.avatar || u.profile_picture || 'assets/img/c4.png');
        const displayName = (u.username || 'Player');

        // Normalize ID & ensure numeric
        const rawId = u.id ?? u.user_id ?? u.uid ?? u.account_id;
        const toUidNum = Number.parseInt(rawId, 10);
        const hasNumericId = Number.isFinite(toUidNum) && toUidNum > 0;

        // Normalize their room state
        const theirRoomId = String(u.current_room_id ?? '');
        const hasRoom = !!theirRoomId;
        const isInMyRoom = hasRoom && (theirRoomId === myRoomId);
        const isSelf = hasNumericId && (String(toUidNum) === myId);

        row.innerHTML = `
          <div class="left">
            <div class="avatar">
              <img src="${avatarSrc}" alt="${displayName}" style="width:44px;height:44px;object-fit:cover;border-radius:50%;" />
            </div>
            <div class="meta"><span class="name">${displayName}</span></div>
          </div>
          <div class="right-slot"></div>
        `;

        const right = row.querySelector('.right-slot');

        if (!isSelf) {
          if (!hasNumericId) {
            const placeholder = document.createElement('span');
            placeholder.style.opacity = '0.3';
            placeholder.textContent = 'No ID';
            right.appendChild(placeholder);
            wrap.appendChild(row);
            return;
          }

          if (!hasRoom) {
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.dataset.uid = String(toUidNum);

            const now = Date.now();
            const until = inviteCooldowns.get(toUidNum) || 0;
            const isOnCooldown = now < until;

            btn.textContent = isOnCooldown ? 'Sent' : 'Invite';
            btn.disabled = !canInvite || isOnCooldown;
            btn.title = !canInvite
              ? 'Join a room to invite'
              : (isOnCooldown ? `Please wait ${Math.ceil((until - now)/1000)}s` : 'Send invitation');

            if (canInvite) {
              btn.addEventListener('click', async (e)=>{
                e.stopPropagation();
                const rid = getCurrentRoomId();
                if (!rid) { showTinyToast('No active room'); return; }

                const now2 = Date.now();
                const until2 = inviteCooldowns.get(toUidNum) || 0;
                if (now2 < until2) {
                  showTinyToast(`Wait ${Math.ceil((until2-now2)/1000)}s`);
                  return;
                }

                try {
                  const res = await phpInvite(rid, toUidNum);

                  // NEW: push realtime popup with invite_id to the recipient
                  if (window.InviteSocket) {
                    const invite = res?.invite || {};
                    InviteSocket.notifyInvite({
                      invite_id: invite.invite_id,
                      to_user_id: toUidNum,
                      from_user_id: CURRENT_USER_ID,
                      from_username: CURRENT_USER_NAME,
                      from_avatar: CURRENT_USER_AVATAR,
                      room_id: rid
                    });
                  }

                  btn.disabled = true;
                  btn.textContent = 'Sent';
                  inviteCooldowns.set(toUidNum, now2 + INVITE_COOLDOWN_MS);
                  setTimeout(() => {
                    btn.disabled = false;
                    btn.textContent = 'Invite';
                  }, INVITE_COOLDOWN_MS);

                  showTinyToast('📨 Invitation sent');
                } catch (err) {
                  console.error(err);
                }
              });
            } else {
              btn.style.opacity = '0.35';
              btn.style.pointerEvents = 'none';
            }

            right.appendChild(btn);
          } else {
            const icon = document.createElement('button');
            icon.className = 'home-icon';
            icon.setAttribute('aria-label', isInMyRoom ? 'Already in your room' : 'Already joined another room');
            icon.title = isInMyRoom ? 'Already in your room' : 'Already joined another room';
            icon.disabled = true;
            icon.innerHTML = `
              <svg viewBox="0 0 24 24" fill="none" stroke="#00e676" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 11l9-7 9 7"></path>
                <path d="M9 22V12h6v10"></path>
              </svg>
            `;
            right.appendChild(icon);
          }
        } else {
          const placeholder = document.createElement('span');
          placeholder.style.opacity = '0.3';
          right.appendChild(placeholder);
        }

        wrap.appendChild(row);
      });
    }

    const count = Number.isFinite(totalCountOverride) ? totalCountOverride : (users ? users.length : 0);
    if (topCount) topCount.textContent = String(count);
    if (footCount) footCount.textContent = String(count);
  }


  /* ===== Modes (host-gated) ===== */
  const modeItems=[
    { id:'m3', title:'Multiplayer 3P', players:3, unlocked:true,  desc:'3-player match' },
    { id:'m6', title:'Multiplayer 6P', players:6, unlocked:true, desc:'6-player match'}
  ];
  let modeIndex=0, selectedMode=modeItems[0];
  const modesRow=$('#modesRow'), modeViewport=$('#modeViewport'), navLeft=$('#navLeft'), navRight=$('#navRight');

  function renderModes() {
  if (!modesRow) return;
  modesRow.innerHTML = '';

  modeItems.forEach((m, idx) => {
    const c = document.createElement('div');
    c.className = 'mode-card';
    c.setAttribute('data-idx', idx);
    c.setAttribute('role', 'button');
    c.setAttribute('tabindex', '0');

    // Unlocked version: no locked overlay
    c.innerHTML = `
      <div class="mode-left">${m.players}P</div>
      <div class="mode-body">
        <div class="mode-title">${m.title}</div>
        <div class="mode-sub">${m.desc}</div>
      </div>
      <div class="mode-meta">
        <div style="font-size:11px">Mode</div>
        <div style="font-weight:800;font-size:14px">${m.players} Players</div>
      </div>
    `;

    // Click handler: unlocked
    c.addEventListener('click', () => {
      if (!IS_HOST) return;
      centerMode(idx, true);
    });

    // Keyboard support: unlocked
    c.addEventListener('keydown', e => {
      if (!IS_HOST) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        c.click();
      }
    });

    modesRow.appendChild(c);
  });

  requestAnimationFrame(() => centerMode(modeIndex, false));
}
  function readCurrentTranslate(){ const st=window.getComputedStyle(modesRow).transform; if(!st||st==='none') return 0; const m=st.match(/matrix.*\((.+)\)/); if(m&&m[1]){ const v=m[1].split(',').map(parseFloat); return v[4]||0; } return 0; }
  function setTranslate(x,animate=true){ modesRow.style.transition=animate?'transform 320ms ease':'none'; modesRow.style.transform=`translateX(${x}px)`; }
  let navLocked=false, pendingNav=null;
  function centerMode(idx,animate=true){
    const cards=$all('.mode-card'); if(!cards.length) return;
    idx=((idx%cards.length)+cards.length)%cards.length; modeIndex=idx;
    const sel=cards[modeIndex], sr=sel.getBoundingClientRect(), cr=modeViewport.getBoundingClientRect();
    const next=readCurrentTranslate()+(cr.left+cr.width/2)-(sr.left+sr.width/2);
    if(!animate){ setTranslate(next,false); finishVisualUpdate(); return; }
    if(navLocked){ pendingNav=idx; return; } navLocked=true; setTranslate(next,true); finishVisualUpdate();
    modesRow.addEventListener('transitionend',ev=>{ if(ev.target===modesRow) unlockNav(); },{once:true}); setTimeout(unlockNav,350);
  }
  function unlockNav(){ navLocked=false; if(pendingNav!==null){ const n=pendingNav; pendingNav=null; centerMode(n,true);} }
  function finishVisualUpdate(){ $all('.mode-card').forEach((el,i)=>{ el.classList.toggle('center',i===modeIndex); el.classList.toggle('dim',i!==modeIndex); el.classList.toggle('selected',IS_HOST && i===modeIndex); }); selectedMode=modeItems[modeIndex]; }

  /* pointer drag enable/disable depending on host */
  let pointerNavEnabled = true;
  function enablePointerNav(shouldEnable){ pointerNavEnabled = !!shouldEnable; }
  (function pointerNavWiring(){
    if(!modesRow || !modeViewport) return;
    let isDragging=false, startX=0, startTranslate=0; const dragTh=6;
    function read(){ const st=window.getComputedStyle(modesRow).transform; if(!st||st==='none') return 0; const m=st.match(/matrix.*\((.+)\)/); if(m&&m[1]){ const v=m[1].split(',').map(parseFloat); return v[4]||0; } return 0; }
    function down(e){ if(!pointerNavEnabled) return; if(e.target.closest('.nav-btn')) return; if(e.type==='pointerdown'&&e.button!==0) return; isDragging=true; startX=e.clientX??(e.touches&&e.touches[0].clientX); startTranslate=read(); modesRow.classList.add('dragging'); document.body.style.userSelect='none'; }
    function move(e){ if(!isDragging) return; const x=e.clientX??(e.touches&&e.touches[0].clientX); if(!x) return; const dx=x-startX; modesRow.style.transform=`translateX(${startTranslate+dx}px)`; }
    function up(){ if(!isDragging) return; isDragging=false; modesRow.classList.remove('dragging'); document.body.style.userSelect=''; const cards=$all('.mode-card'); const cr=modeViewport.getBoundingClientRect(); const cc=cr.left+cr.width/2; let best=0,bestD=Infinity; cards.forEach((card,i)=>{ const r=card.getBoundingClientRect(); const c=r.left+r.width/2; const d=Math.abs(c-cc); if(d<bestD){bestD=d; best=i;} }); centerMode(best,true); }
    modeViewport.addEventListener('pointerdown',down); window.addEventListener('pointermove',move); window.addEventListener('pointerup',up);
    modeViewport.addEventListener('touchstart',down,{passive:true}); window.addEventListener('touchmove',move,{passive:true}); window.addEventListener('touchend',up);
  })();

  /* ===== Edit / Lobby / Start ===== */
  function editAction(){
    if(!IS_HOST){ return; }
    const rid=getCurrentRoomId();
    if(rid) window.location.href=`create.html?room_id=${encodeURIComponent(rid)}`;
    else    window.location.href='create.html';
  }

  function goToLobby(){
    const rid=getCurrentRoomId();
    window.location.href = rid
      ? `lobby.html?fromRoomId=${encodeURIComponent(rid)}`
      : 'lobby.html';
  }
  /** Real start: POST to php/api/start_game.php and redirect to loading5.html */
  async function startGame(){
    if(!IS_HOST){ return; }
    const btn = document.getElementById('startBtn');

    try{
      if (btn) btn.disabled = true;

      // Let PHP figure out the room via $_SESSION['current_room_id'].
      // If a room_id IS available, we include it — but it's optional.
      const rid = getCurrentRoomId();
      const init = { method: 'POST' };
      if (rid) {
        init.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
        init.body    = new URLSearchParams({ room_id: rid });
      }

      const r = await fetch('/Newchemsaga/php/api/start_game.php', init);
      const j = await r.json();

      if (!j.ok) {
        alert('Start failed: ' + (j.error || 'unknown'));
        if (btn) btn.disabled = false;
        return;
      }

      // Host jumps immediately (players follow via their poll/heartbeat)
      const target = j.redirect
        || `/Newchemsaga/public/loading5.html?room_id=${j.room_id}&t=${j.session_token}`;
      window.location.replace(target); // avoid coming back to room with Back
    } catch (e) {
      alert('Start failed: network_error');
      if (btn) btn.disabled = false;
    }
  }


  window.editAction = editAction;
  window.goToLobby  = goToLobby;
  window.startGame  = startGame;


  /* ===== Init ===== */
  document.addEventListener('DOMContentLoaded',()=>{
    loadRoom();
    renderModes();
    loadProfile();

    // Right-side online list
    fetchOnlineAndRender();
    setInterval(fetchOnlineAndRender, 4000);

    // Roster after profile & room are ready
    (async () => {
      try { await Promise.all([profileReady, roomReady]); } catch {}

      // 👉 Players panel renderer (handled by profile-display.js)
      if (window.ProfileDisplay && typeof ProfileDisplay.init === 'function') {
        ProfileDisplay.init({
          apiUrl: '../php/api/room_members.php',
          getRoomId: () => getCurrentRoomId(),
          getIsHost: () => IS_HOST,
          getCurrentUser: () => ({
            id: String(CURRENT_USER_ID || ''),
            username: CURRENT_USER_NAME || 'You',
            avatar: CURRENT_USER_AVATAR || 'assets/img/c4.png'
          })
        });
        ProfileDisplay.refresh();
        setInterval(() => ProfileDisplay.refresh(), 2000);
      }
    })();
  });



  /* ===== Heartbeats ===== */
  (function startHostHeartbeat(){
    const rid=getCurrentRoomId(); if(!rid) return;
    async function ping(){ try{ const fd=new FormData(); fd.append('room_id',rid); await fetch('../php/api/host_ping.php',{method:'POST',body:fd,credentials:'include'});}catch{} }
    ping(); setInterval(ping,15000);
  })();
  (function hostHeartbeat(){
    const rid=getCurrentRoomId(); if(!rid) return;
    setInterval(()=>{ const f=new FormData(); f.append('room_id',rid); fetch('../php/api/heartbeat_room.php',{method:'POST',body:f,credentials:'include'}); },30000);
  })();

  /* ===== Keep user online ===== */
  (function userOnlineHeartbeat(){
    const rid = getCurrentRoomId();
    async function pingUser(){
      try{
        const fd = new FormData();
        if (rid) fd.append('room_id', rid);
        await fetch('../php/api/user_ping.php', { method:'POST', body: fd, credentials:'include' });
        try{ localStorage.setItem('CHEMSAGA_CURRENT_ROOM_ID', rid || ''); }catch{}
      }catch(e){ /* ignore */ }
    }
    pingUser();
    setInterval(pingUser, 15000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) pingUser();
    });
  })();

  /* ===== Inline WebSocket helper + Accept/Decline modal (fallback if not provided elsewhere) ===== */
  (function ensureInviteSocket(){
    if (window.InviteSocket) return; // if you already included an external helper, skip

    let socket = null;

    function ensureInviteModal(){
      let m=document.getElementById('inviteModal');
      if(m) return m;
      m=document.createElement('div');
      m.id='inviteModal';
      m.style.cssText='position:fixed;inset:0;display:none;place-items:center;background:rgba(0,0,0,.45);z-index:99999;';
      m.innerHTML=`
        <div class="card" role="dialog" aria-modal="true" style="width:360px;max-width:calc(100% - 24px);background:#111c;color:#fff;border-radius:16px;padding:18px;backdrop-filter:blur(8px);box-shadow:0 12px 30px rgba(0,0,0,.35);font-family:system-ui,Segoe UI,Roboto;">
          <div style="display:flex;gap:12px;align-items:center;">
            <img id="invFromAvatar" src="assets/img/c4.png" alt="Avatar" style="width:48px;height:48px;object-fit:cover;border-radius:50%;border:1px solid #ffffff24;">
            <div style="flex:1;">
              <div id="invTitle" style="font-weight:800;font-size:16px;">Room Invitation</div>
              <div id="invSubtitle" style="opacity:.85;font-size:13px;">&nbsp;</div>
            </div>
          </div>
          <div id="invMeta" style="margin-top:10px;font-size:12px;opacity:.75;"></div>
          <div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end;">
            <button id="invDecline" class="btn" style="padding:8px 12px;border-radius:10px;border:none;background:#3337;color:#fff;cursor:pointer;">Decline</button>
            <button id="invAccept"  class="btn" style="padding:8px 12px;border-radius:10px;border:none;background:#00e676;color:#041;font-weight:800;cursor:pointer;">Accept</button>
          </div>
        </div>`;
      document.body.appendChild(m);
      return m;
    }

    function openInviteModal(data){
      const m=ensureInviteModal();
      const subtitle=m.querySelector('#invSubtitle');
      const avatar=m.querySelector('#invFromAvatar');
      const meta=m.querySelector('#invMeta');
      const btnAcc=m.querySelector('#invAccept');
      const btnDec=m.querySelector('#invDecline');

      subtitle.textContent=`${data.from_username||('User '+data.from_user_id)} invited you to join their room.`;
      avatar.src=data.from_avatar||'assets/img/c4.png';
      meta.textContent=`Room #${data.room_id}`;
      m.style.display='grid';

      const close=()=>{ m.style.display='none'; };

      btnDec.onclick=async()=>{
        btnDec.disabled=btnAcc.disabled=true;
        try{
          const fd=new FormData();
          fd.append('invite_id', String(data.invite_id));
          fd.append('action','decline');
          const r=await fetch('../php/invitations/respond.php',{method:'POST',body:fd,credentials:'include'});
          const j=await r.json();
          if(!j.ok) throw new Error(j.error||'decline_failed');
          showTinyToast('❌ Invitation declined');
        }catch(e){ alert('Decline failed: '+e.message); }
        finally{ btnDec.disabled=btnAcc.disabled=false; close(); }
      };

      btnAcc.onclick=async()=>{
        btnDec.disabled=btnAcc.disabled=true;
        try{
          const fd=new FormData();
          fd.append('invite_id', String(data.invite_id));
          fd.append('action','accept');
          const r=await fetch('../php/invitations/respond.php',{method:'POST',body:fd,credentials:'include'});
          const j=await r.json();
          if(!j.ok) throw new Error(j.error||'accept_failed');
          showTinyToast('✅ Joined the room');
          const rid=j.room_id||data.room_id;
          if(rid) window.location.href=`multi2.html?room_id=${encodeURIComponent(rid)}`;
        }catch(e){ alert('Accept failed: '+e.message); btnDec.disabled=btnAcc.disabled=false; }
      };
    }

    function init(uid){
      if(!uid) return;
      try{
        socket=new WebSocket(`ws://localhost:8080?uid=${encodeURIComponent(String(uid))}`);
        socket.addEventListener('open', ()=>console.log('[WS] open as', uid));
        socket.addEventListener('close', ()=>console.log('[WS] closed'));
        socket.addEventListener('message', ev=>{
          try{
            const msg=JSON.parse(ev.data);
            if(msg.type==='invite' && msg.invite_id){
              openInviteModal(msg);
            }
          }catch{}
        });
      }catch(e){ console.warn('[WS] failed', e); }
    }

    function notifyInvite(payload){
      if(socket && socket.readyState===1){
        socket.send(JSON.stringify({ type:'invite.push', ...payload }));
      }
    }

    window.InviteSocket = { init, notifyInvite };
  })();
