// assets/js/profile-display.js
// Standalone renderer for the Players section (left panel)
// Tolerant sa iba't ibang PHP response shapes + optional debug logs.

(function(){
  const DEFAULT_AVATAR = 'assets/img/c4.png';
  const DEBUG = true; // set to false kung ayaw mo ng console logs

  let cfg = {
    apiUrl: '../php/api/room_members.php',
    getRoomId: () => null,
    getIsHost: () => false,
    getCurrentUser: () => ({ id: '', username: 'You', avatar: DEFAULT_AVATAR })
  };

  function log(...a){ if(DEBUG) console.log('[ProfileDisplay]', ...a); }

  function normalizeMember(m){
    // accept wide variety of shapes from PHP
    const idRaw =
      m?.id ?? m?.user_id ?? m?.uid ??
      m?.player_id ?? m?.account_id ?? m?.member_id ?? '';

    const username =
      m?.username ?? m?.name ?? m?.player_name ??
      m?.display_name ?? m?.nickname ?? 'Player';

    const avatar =
      m?.avatar ?? m?.profile_picture ?? m?.photo ??
      m?.picture ?? m?.image_url ?? DEFAULT_AVATAR;

    const role =
      (m?.role ?? m?.user_role ?? m?.type ?? '').toString().toLowerCase();

    return {
      id: String(idRaw ?? ''),
      username,
      avatar: avatar || DEFAULT_AVATAR,
      role
    };
  }

  function renderLeftPlayers(members, hostId){
    const hostIdStr = String(hostId || '');
    const wrap = document.querySelector('#playersListLeft');
    const countEl = document.querySelector('#invitedPlayerCount');
    if(!wrap) { log('❗ #playersListLeft not found'); return; }

    wrap.innerHTML = '';

    if(!members.length){
      wrap.innerHTML = `<div class="player" style="opacity:.8;">No players yet</div>`;
    }else{
      const me = cfg.getCurrentUser?.() || {};
      const meIdStr = String(me.id ?? '');

      members.forEach(mm => {
        const m = normalizeMember(mm);
        const isHost = (m.role === 'host') || (hostIdStr && m.id === hostIdStr);
        const isYou  = (meIdStr && m.id === meIdStr);

        const row = document.createElement('div');
        row.className = 'player';
        row.innerHTML = `
          <div class="left">
            <div class="avatar">
              <img src="${(m.avatar || DEFAULT_AVATAR)}" alt="${m.username}"
                   style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />
            </div>
            <div class="meta">
              <span class="name">${m.username}</span>
              ${isHost ? `<span class="role-badge host" style="margin-left:6px;font-weight:800;color:#ffd;">HOST</span>` : ''}
              ${!isHost && isYou ? `<span class="role-badge you" style="margin-left:6px;opacity:.9;">YOU</span>` : ''}
            </div>
          </div>
        `;
        wrap.appendChild(row);
      });
    }

    if(countEl) countEl.textContent = String(members.length);
  }

  function coerceMembersPayload(data){
    // 1) success flag tolerance
    const success = (data?.ok === true) || (data?.success === true) || Array.isArray(data?.members) || Array.isArray(data?.players);
    if(!success) return { ok:false };

    // 2) members list tolerance
    let members = [];
    if (Array.isArray(data?.members)) members = data.members;
    else if (Array.isArray(data?.players)) members = data.players;
    else if (Array.isArray(data?.list)) members = data.list;
    else members = [];

    // 3) host info tolerance
    const room = data?.room || data?.data || {};
    const hostId =
      room?.host_user_id ?? room?.host_id ?? data?.host_user_id ??
      data?.host_id ?? data?.host?.id ?? '';

    const hostUsername =
      room?.host_username ?? data?.host_username ??
      data?.host?.username ?? 'Host';

    const hostAvatar =
      room?.host_avatar ?? data?.host_avatar ?? data?.host?.avatar ?? DEFAULT_AVATAR;

    return {
      ok: true,
      members,
      hostId: (hostId !== undefined && hostId !== null) ? String(hostId) : '',
      hostUsername,
      hostAvatar
    };
  }

  async function refresh(){
    const rid = cfg.getRoomId?.();
    if(!rid) { log('⏭️ skip refresh — no room id'); return; }

    try{
      const url = `${cfg.apiUrl}?room_id=${encodeURIComponent(rid)}`;
      const res = await fetch(url, { credentials:'include', cache:'no-store' });
      let data;
      try{
        data = await res.json();
      }catch(parseErr){
        log('❌ JSON parse error', parseErr);
        return;
      }

      if (DEBUG) log('payload:', data);

      const shaped = coerceMembersPayload(data);
      if(!shaped.ok){
        log('⚠️ API not OK — expected ok/success or members array');
        return;
      }

      let members = (Array.isArray(shaped.members) ? shaped.members : []).map(normalizeMember);

      // Host info (strings)
      const hostIdStr     = String(shaped.hostId || '');
      const hostNameStr   = shaped.hostUsername || 'Host';
      const hostAvatarStr = shaped.hostAvatar || DEFAULT_AVATAR;

      const cur   = cfg.getCurrentUser?.() || {};
      const isHost = !!cfg.getIsHost?.();

      // Prefer current user profile kung siya ang host
      const synthHost = isHost ? {
        id: String(cur.id || hostIdStr || ''),
        username: cur.username || hostNameStr || 'Host',
        avatar: cur.avatar || hostAvatarStr || DEFAULT_AVATAR,
        role: 'host'
      } : {
        id: String(hostIdStr || ''),
        username: hostNameStr || 'Host',
        avatar: hostAvatarStr || DEFAULT_AVATAR,
        role: 'host'
      };

      // Ensure host row exists and marked
      const hasHost = members.some(m =>
        (synthHost.id ? (String(m.id) === synthHost.id) : false) ||
        m.role === 'host' ||
        (synthHost.username && m.username === synthHost.username)
      );
      if (!hasHost && (synthHost.id || synthHost.username)){
        members.unshift(synthHost);
      } else {
        members = members.map(m => {
          if ((synthHost.id && String(m.id) === synthHost.id) ||
              (synthHost.username && m.username === synthHost.username)) {
            return { ...m, role: 'host', avatar: m.avatar || synthHost.avatar, username: m.username || synthHost.username };
          }
          return m;
        });
      }

      // Ensure current player shows as YOU immediately
      const meIdStr = String(cur.id || '');
      const mePresent = meIdStr && members.some(m => String(m.id) === meIdStr);
      if (meIdStr && !mePresent) {
        members.push({
          id: meIdStr,
          username: cur.username || 'You',
          avatar: cur.avatar || DEFAULT_AVATAR,
          role: (isHost ? 'host' : 'player')
        });
      }

      // Dedup: prefer ID; fallback username
      const seen = new Set();
      members = members.filter(m => {
        const key = (m.id ? 'id:'+m.id : 'name:'+m.username);
        if (seen.has(key)) return false;
        seen.add(key); return true;
      });

      // Host first
      members.sort((a,b)=> (a.role==='host'?0:1) - (b.role==='host'?0:1));

      const hostIdForRender = (members.find(m=>m.role==='host')?.id) || synthHost.id || '';
      renderLeftPlayers(members, String(hostIdForRender || ''));
    }catch(e){
      log('❌ refresh error', e);
    }
  }

  function init(options){
    cfg = { ...cfg, ...(options||{}) };
    log('init cfg:', cfg);
  }

  // expose to global
  window.ProfileDisplay = { init, refresh };
})();
