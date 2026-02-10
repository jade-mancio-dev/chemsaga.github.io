/* ==== PROFILE MODAL BRIDGE v2 (full p1 behavior for multi2) ====
   - Fetch + hydrate ALL fields (UID, points, achievements, records)
   - Avatar click-to-upload (update_profile.php)
   - Inline edit on blur for email/username
   - Logout via AJAX -> loading2.html
*/
(function () {
  const $ = (s) => document.querySelector(s);

  // ---- Fetch + hydrate like p1 ----
  async function fetchProfile() {
    const r = await fetch('../php/api/get_profile.php', { credentials: 'include', cache: 'no-store' });
    const t = await r.text();
    let d; try { d = JSON.parse(t); } catch { throw new Error('JSON parse error: ' + t); }
    if (!d.success || !d.user) throw new Error(d.error || 'Profile fetch failed');
    return d.user;
  }

  function fillAchievements(listEl, arr) {
    if (!listEl) return;
    listEl.innerHTML = '';
    const items = Array.isArray(arr) ? arr : [];
    if (!items.length) {
      // optional: show empty state
      const empty = document.createElement('div');
      empty.className = 'stat-item';
      empty.innerHTML = `<span class="stat-label">No achievements yet</span><span class="stat-value">—</span>`;
      listEl.appendChild(empty);
      return;
    }
    items.forEach(a => {
      const div = document.createElement('div');
      div.className = 'stat-item';
      div.innerHTML = `<span class="stat-label">${a.name ?? '—'}</span><span class="stat-value">${a.status ?? '—'}</span>`;
      listEl.appendChild(div);
    });
  }

  function fillRecords(listEl, arr) {
    if (!listEl) return;
    listEl.innerHTML = '';
    const items = Array.isArray(arr) ? arr : [];
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'stat-item';
      empty.innerHTML = `<span class="stat-label">No records yet</span><span class="stat-value">—</span>`;
      listEl.appendChild(empty);
      return;
    }
    items.forEach(r => {
      const div = document.createElement('div');
      div.className = 'stat-item';
      div.innerHTML = `<span class="stat-label">${r.name ?? '—'}</span><span class="stat-value">${r.value ?? '—'}</span>`;
      listEl.appendChild(div);
    });
  }

  async function hydrateProfileUI() {
    // Small loading hint (UID)
    const uidEl = $('#profileUid');
    if (uidEl) { uidEl.textContent = 'UID: Loading...'; uidEl.style.color = 'yellow'; }

    const u = await fetchProfile();
    const ts = Date.now();

    // Top-right chip
    const miniName = $('#rightPlayerName');
    const miniPic  = $('#rightProfilePic');
    if (miniName) miniName.textContent = u.username || 'Player';
    if (miniPic)  miniPic.src = (u.profile_picture || 'assets/img/c4.png') + `?t=${ts}`;

    // Modal header block
    const avatar = $('#profileAvatar');
    if (avatar) avatar.src = (u.profile_picture || 'assets/img/c4.png') + `?t=${ts}`;

    const nameH = $('#profileUsername');
    if (nameH) nameH.textContent = u.username || 'Player';

    if (uidEl) { uidEl.textContent = `UID: ${u.uid || u.user_id || u.id || 'N/A'}`; uidEl.style.color = 'rgba(255,255,255,0.7)'; }

    const pts = $('#profilePoints');
    if (pts) pts.textContent = (u.points ?? '0');

    const email = $('#profileEmail');
    if (email) email.value = u.email || '';

    const uname = $('#profileUsernameInput');
    if (uname) uname.value = u.username || '';

    // Lists
    fillAchievements($('#achievementsList'), u.achievements);
    fillRecords($('#recordsList'), u.records);
  }

  // ---- Avatar upload + preview ----
  function wireAvatarUpload() {
    const avatar = $('#profileAvatar');
    const input  = $('#profileAvatarInput');
    if (!avatar || !input) return;

    avatar.addEventListener('click', () => input.click());
    input.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      avatar.src = URL.createObjectURL(file); // preview

      try {
        const fd = new FormData();
        fd.append('update_type', 'avatar');
        fd.append('profile_picture', file);

        const res  = await fetch('../php/api/update_profile.php', {
          method: 'POST', body: fd, credentials: 'include'
        });
        const text = await res.text();
        let data; try { data = JSON.parse(text); } catch { throw new Error('Invalid JSON: ' + text); }
        if (!data.success) throw new Error(data.error || 'Avatar update failed');

        await hydrateProfileUI();
        alert('✅ Avatar updated');
      } catch (err) {
        console.error('Avatar upload error:', err);
        alert('❌ Avatar update failed: ' + err.message);
      } finally {
        input.value = '';
      }
    });
  }

  // ---- Inline field updates (blur) ----
  function wireInlineUpdates() {
    const email = $('#profileEmail');
    const uname = $('#profileUsernameInput');

    async function updateField(field, value) {
      try {
        const fd = new FormData();
        fd.append('update_type', 'profile');
        fd.append(field, value);

        const res = await fetch('../php/api/update_profile.php', {
          method: 'POST', body: fd, credentials: 'include'
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Update failed');

        await hydrateProfileUI();
      } catch (err) {
        console.error('Profile update error:', err);
        alert('❌ Profile update failed: ' + err.message);
      }
    }

    email && email.addEventListener('blur', () => updateField('email', email.value));
    uname && uname.addEventListener('blur', () => updateField('username', uname.value));
  }

  // ---- Logout (AJAX -> loading2.html) ----
  function wireLogout() {
    const form = $('#logoutForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const res  = await fetch('../php/api/logout.php', { method: 'POST', credentials: 'include' });
        const text = await res.text();
        if (text.trim() === 'success') {
          try { sessionStorage.removeItem('loggedIn'); } catch {}
          location.href = 'loading2.html';
        } else {
          alert('❌ Logout failed: ' + text);
        }
      } catch (err) {
        console.error('Logout error:', err);
        alert('❌ Logout failed: ' + err.message);
      }
    });
  }

  // ---- Open/close modal already provided by multi2.js (openProfile/closeProfile) ----

  document.addEventListener('DOMContentLoaded', async () => {
    // Make sure UI starts filled like p1
    try { await hydrateProfileUI(); } catch (e) { console.error(e); }

    wireAvatarUpload();
    wireInlineUpdates();
    wireLogout();
  });
})();
