// public/assets/js/realtime.js
(function(){
  const u = new URL(location.href);
  const room_id = parseInt(u.searchParams.get('room_id') || '0', 10);
  const token   = u.searchParams.get('t') || '';
  if(!room_id || !token) return;

  const API_BASE = '/Newchemsaga/php/api';
  let UID = null, ws = null, myTurn = false;

  async function whoAmI(){
    try{
      const r = await fetch(`${API_BASE}/get_profile.php`, { credentials:'include' });
      const t = await r.text(); const j = JSON.parse(t);
      UID = j?.user?.id || j?.user?.user_id || j?.user?.uid || null;
    }catch{}
  }

  // ---- Optional shims: use your own functions if they exist ----
  const animateDiceTo = window.animateDiceTo || (val => {
    const d = document.getElementById('dice');
    if(d) d.setAttribute('data-face', String(val));
  });
  const moveTokenBy = window.moveTokenBy || ((uid,steps)=>{
    // If you only move "self" in your current code, call that here:
    if(window.movePlayer) window.movePlayer(steps);
  });
  const showQuestion = window.showQuestionFromServer || (q=>{
    // Render your modal here. Keep order of q.options (index 0..3).
    window.currentQuestionId = q.id;
    if(window.renderQuestionModal) window.renderQuestionModal(q);
  });
  const flashAnswer = window.flashAnswer || (ok=>{
    if(window.closeQuestionModal) window.closeQuestionModal(ok);
  });
  const updateTurnGlow = window.updateTurnGlow || (uid=>{
    // Implement your yellow-glow here if not already exposed
  });

  async function connect(){
    await whoAmI();
    if(!UID){ alert('Not logged in'); return; }

    // Reuse the same WS server (8080) used by invites
    ws = new WebSocket(`ws://localhost:8080?uid=${encodeURIComponent(UID)}`);

    ws.onopen = () => {
      // Join the game stream
      ws.send(JSON.stringify({ type:'game.join', uid: UID, room_id, t: token }));
    };
    ws.onmessage = (ev)=>{
      let msg={}; try{ msg=JSON.parse(ev.data); }catch{ return; }

      if(msg.type==='game.sync'){
        const s = msg.state;
        myTurn = String(s.current_turn_id) === String(UID);
        updateTurnGlow(s.current_turn_id);
      }
      if(msg.type==='roll.result'){
        animateDiceTo(msg.dice);
        if(String(msg.uid)===String(UID)) moveTokenBy(UID, msg.dice);
      }
      if(msg.type==='question.show'){
        if(String(msg.uid)===String(UID)) showQuestion(msg.question);
      }
      if(msg.type==='answer.result'){
        if(String(msg.uid)===String(UID)) flashAnswer(msg.correct);
        // You can also refresh a scoreboard UI using msg.scores
      }
      if(msg.type==='turn.advance'){
        myTurn = String(msg.current_turn_id) === String(UID);
        updateTurnGlow(msg.current_turn_id);
      }
    };
  }

  // Intercept your Roll button: send request instead of rolling locally
  document.addEventListener('DOMContentLoaded', ()=>{
    const rollBtn = document.getElementById('rollBtn');
    if(rollBtn){
      rollBtn.addEventListener('click', ()=>{
        if(!ws || ws.readyState!==1) return;
        if(!myTurn) return;
        ws.send(JSON.stringify({ type:'roll.request' }));
      });
    }
  });

  // Wire your answer buttons to send 0..3
  window.submitAnswerChoice = function(index){
    if(!ws || ws.readyState!==1) return;
    if(window.currentQuestionId == null) return;
    ws.send(JSON.stringify({ type:'answer.submit', question_id: window.currentQuestionId, choiceIndex: index }));
  };

  connect();
})();
