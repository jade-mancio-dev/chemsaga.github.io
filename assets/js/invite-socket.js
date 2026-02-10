(function(){
  let socket=null;

  // Tiny toast fallback (only if you don't already have one)
  window.showTinyToast = window.showTinyToast || (function(){
    let el; return function(msg){
      if(!el){ el=document.createElement('div');
        el.style.cssText='position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#1119;color:#fff;padding:10px 14px;border-radius:10px;font:600 13px/1 system-ui;z-index:99999;opacity:0;transition:opacity .2s';
        document.body.appendChild(el);
      }
      el.textContent=msg; el.style.opacity='1'; setTimeout(()=>el.style.opacity='0',1500);
    };
  })();

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
    document.body.appendChild(m); return m;
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
  }

  function notifyInvite(payload){
    if(socket && socket.readyState===1){
      socket.send(JSON.stringify({ type:'invite.push', ...payload }));
    }
  }

  window.InviteSocket={ init, notifyInvite };
})();
