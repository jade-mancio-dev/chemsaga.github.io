// Canvas background
const canvas = document.getElementById('background-canvas');
const ctx = canvas.getContext('2d');
function resizeCanvas() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resizeCanvas();

let width, height;
const particles = [];
const particleCount = 40; // Optimized count

// 1. Create a "Pre-rendered" particle for performance
const glowCanvas = document.createElement('canvas');
const glowCtx = glowCanvas.getContext('2d');
glowCanvas.width = 40;
glowCanvas.height = 40;

function createGlow() {
    const gradient = glowCtx.createRadialGradient(20, 20, 0, 20, 20, 20);
    gradient.addColorStop(0, 'hsla(260, 80%, 60%, 1)');
    gradient.addColorStop(0.3, 'hsla(260, 80%, 60%, 0.3)');
    gradient.addColorStop(1, 'hsla(260, 80%, 60%, 0)');
    glowCtx.fillStyle = gradient;
    glowCtx.fillRect(0, 0, 40, 40);
}
createGlow();

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Particle {
    constructor() {
        this.init();
    }

    init() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        // SLOWED ANIMATION: Velocity lowered to 0.4
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.size = Math.random() * 15 + 10; // Size of the glow area
        this.alpha = Math.random() * 0.5 + 0.2;
        this.pulse = Math.random() * 0.005 + 0.002;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha += this.pulse;

        if (this.alpha > 0.7 || this.alpha < 0.2) this.pulse *= -1;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
    }

    draw() {
        ctx.globalAlpha = this.alpha;
        // Optimization: Draw the pre-rendered glow instead of calculating shadows
        ctx.drawImage(glowCanvas, this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
    }
}

for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
}

function animate() {
    // Smooth trail effect
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);

    // Draw Connections
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distSq = dx * dx + dy * dy;

            if (distSq < 22500) { // 150 pixels squared
                const opacity = (1 - Math.sqrt(distSq) / 150) * 0.2;
                ctx.beginPath();
                ctx.strokeStyle = `rgba(138, 43, 226, ${opacity})`;
                ctx.lineWidth = 1;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }

    // Update and Draw Particles
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(animate);
}

animate();


requestAnimationFrame(animate);

// Profile & settings modal functions
function openProfile() {
  const m = document.getElementById('profileModal');
  if (!m) return console.error('profileModal not found');
  m.style.display = 'flex';
  m.setAttribute('aria-hidden', 'false');
  const btn = m.querySelector('.close-btn');
  if (btn) btn.focus();
}
function closeProfile() {
  const m = document.getElementById('profileModal');
  if (!m) return console.error('profileModal not found');
  m.style.display = 'none';
  m.setAttribute('aria-hidden', 'true');
}
function openSettings() {
  const s = document.getElementById('settingsModal');
  if (!s) return console.error('settingsModal not found');
  s.style.display = 'block';
  s.setAttribute('aria-hidden', 'false');
  const btn = s.querySelector('.settings-close-btn');
  if (btn) btn.focus();
}
function closeSettings() {
  const s = document.getElementById('settingsModal');
  if (!s) return console.error('settingsModal not found');
  s.style.display = 'none';
  s.setAttribute('aria-hidden', 'true');
}

document.getElementById('profileModal').addEventListener('click', function (e) {
  if (e.target && e.target.id === 'profileModal') closeProfile();
});
document.getElementById('settingsModal').addEventListener('click', function (e) {
  if (e.target && e.target.id === 'settingsModal') closeSettings();
});

// Trigger file input on avatar click
document.addEventListener('DOMContentLoaded', function () {
  const avatar = document.getElementById('profileAvatar');
  const input = document.getElementById('profileAvatarInput');
  if (avatar && input) {
    console.log('Avatar and input elements found');
    avatar.addEventListener('click', function (e) {
      console.log('Avatar clicked:', { x: e.clientX, y: e.clientY });
      input.click();
    });
  } else {
    console.error('Avatar or input not found:', { avatar: !!avatar, input: !!input });
    alert('❌ Avatar or file input not found');
  }
});

document.getElementById('profileAvatarInput').addEventListener('change', function (e) {
  console.log('File input changed:', e.target.files);
  const file = e.target.files[0];
  if (!file) {
    console.log('No file selected');
    alert('❌ No file selected');
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    console.log('Previewing avatar');
    const avatar = document.getElementById('profileAvatar');
    if (avatar) avatar.src = e.target.result;
    else console.error('profileAvatar not found');
  };
  reader.readAsDataURL(file);

  const formData = new FormData();
  formData.append('update_type', 'avatar');
  formData.append('profile_picture', file);
  console.log('Submitting avatar form:', [...formData.entries()]);

  fetch('../php/api/update_profile.php', {
    method: 'POST',
    body: formData,
    credentials: 'include'
  })
    .then(res => {
      console.log('Avatar upload status:', res.status);
      return res.text().then(text => ({ res, text }));
    })
    .then(({ res, text }) => {
      console.log('Avatar update response:', text);
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('Invalid JSON: ' + text);
      }
      if (data.success) {
        alert('✅ Avatar updated');
        loadProfile();
      } else {
        alert('❌ Avatar update failed: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(err => {
      console.error('Avatar upload error:', err);
      alert('❌ Avatar update failed: ' + err.message);
    });
});

// Handle profile updates on blur
function submitProfileUpdate(field, value) {
  const formData = new FormData();
  formData.append('update_type', 'profile');
  formData.append(field, value);
  console.log(`Submitting profile update for ${field}: ${value}`);
  fetch('../php/api/update_profile.php', {
    method: 'POST',
    body: formData,
    credentials: 'include'
  })
    .then(res => {
      console.log('Profile update status:', res.status);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      console.log('Profile update response:', data);
      if (data.success) {
        alert('✅ Profile updated');
        loadProfile();
      } else {
        alert('❌ Profile update failed: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(err => {
      console.error('Profile update error:', err);
      alert('❌ Profile update failed: ' + err.message);
    });
}

document.addEventListener('DOMContentLoaded', function () {
  const emailInput = document.getElementById('profileEmail');
  const usernameInput = document.getElementById('profileUsernameInput');
  if (emailInput) emailInput.addEventListener('blur', () => submitProfileUpdate('email', emailInput.value));
  if (usernameInput) usernameInput.addEventListener('blur', () => submitProfileUpdate('username', usernameInput.value));
});

// Fetch and display profile data
function loadProfile(attempt = 1, maxAttempts = 5) {
  console.log(`loadProfile attempt ${attempt}/${maxAttempts}`);
  const profileUid = document.getElementById('profileUid');
  if (profileUid) {
    profileUid.textContent = `UID: Loading (Attempt ${attempt})...`;
    profileUid.style.color = 'yellow';
  }

  fetch('../php/api/get_profile.php', {
    method: 'GET',
    credentials: 'include'
  })
    .then(res => {
      console.log('Profile fetch status:', res.status);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res.text();
    })
    .then(text => {
      console.log('Profile raw response:', text);
      const debugResponse = document.getElementById('debugResponse');
      if (debugResponse) debugResponse.innerHTML += `<p>Profile Response (Attempt ${attempt}): ${text}</p>`;
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('JSON parse error: ' + text);
      }
      console.log('Parsed profile data:', data);
      
      if (data.success && data.user) {
        const timestamp = Date.now();
        const { topProfilePic, topPlayerName, profileAvatar, profileUsername, profilePoints, profileEmail, profileUsernameInput, achievementsList, recordsList } = {
          topProfilePic: document.getElementById('topProfilePic'),
          topPlayerName: document.getElementById('topPlayerName'),
          profileAvatar: document.getElementById('profileAvatar'),
          profileUsername: document.getElementById('profileUsername'),
          profilePoints: document.getElementById('profilePoints'),
          profileEmail: document.getElementById('profileEmail'),
          profileUsernameInput: document.getElementById('profileUsernameInput'),
          achievementsList: document.getElementById('achievementsList'),
          recordsList: document.getElementById('recordsList')
        };

        if (topProfilePic) topProfilePic.src = `${data.user.profile_picture}?t=${timestamp}`;
        if (topPlayerName) topPlayerName.textContent = data.user.username || 'Unknown';
        if (profileAvatar) profileAvatar.src = `${data.user.profile_picture}?t=${timestamp}`;
        if (profileUsername) profileUsername.textContent = data.user.username || 'Unknown';
        if (profileUid) {
          profileUid.textContent = `UID: ${data.user.uid || 'N/A'}`;
          profileUid.style.color = 'rgba(255,255,255,0.7)';
          console.log('Set UID to:', profileUid.textContent);
        }
        if (profilePoints) profilePoints.textContent = data.user.points ?? '0';
        if (profileEmail) profileEmail.value = data.user.email || '';
        if (profileUsernameInput) profileUsernameInput.value = data.user.username || '';

        if (achievementsList) {
          achievementsList.innerHTML = '';
          (data.user.achievements || []).forEach(a => {
            const div = document.createElement('div');
            div.className = 'stat-item';
            div.innerHTML = `<span class="stat-label">${a.name}</span><span class="stat-value">${a.status}</span>`;
            achievementsList.appendChild(div);
          });
        }
        if (recordsList) {
          recordsList.innerHTML = '';
          (data.user.records || []).forEach(r => {
            const div = document.createElement('div');
            div.className = 'stat-item';
            div.innerHTML = `<span class="stat-label">${r.name}</span><span class="stat-value">${r.value}</span>`;
            recordsList.appendChild(div);
          });
        }
      } else {
        throw new Error(data.error || 'Profile fetch failed');
      }
    })
    .catch(err => {
      console.error(`Profile fetch error (Attempt ${attempt}):`, err);
      const debugResponse = document.getElementById('debugResponse');
      if (debugResponse) debugResponse.innerHTML += `<p>Error (Attempt ${attempt}): ${err.message}</p>`;
      
      if (attempt < maxAttempts) {
        console.log(`Retrying attempt ${attempt + 1}`);
        setTimeout(() => loadProfile(attempt + 1, maxAttempts), 1000);
      } else {
        console.error('Max retries reached');
        if (profileUid) {
          profileUid.textContent = 'UID: Error loading';
          profileUid.style.color = 'red';
        }
        alert('❌ Failed to load profile: ' + err.message);
      }
    });
}

// Logout handler
document.getElementById('logoutForm').addEventListener('submit', function (e) {
  e.preventDefault();
  fetch('../php/api/logout.php', {
    method: 'POST',
    credentials: 'include'
  })
    .then(res => {
      console.log('Logout status:', res.status);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then(data => {
      console.log('Logout response:', data);
      if (data.trim() === 'success') {
        sessionStorage.removeItem('loggedIn');
        window.location.href = 'loading2.html';
      } else {
        alert('❌ Logout failed: ' + data);
      }
    })
    .catch(err => {
      console.error('Logout error:', err);
      alert('❌ Logout failed: ' + err.message);
    });
});

// UI interactions
document.querySelectorAll('.card-button').forEach(b => {
  b.addEventListener('mouseenter', () => (b.style.filter = 'brightness(1.2)'));
  b.addEventListener('mouseleave', () => (b.style.filter = 'brightness(1)'));
});

// Cube embed initialization
// Cube embed initialization (safe overlays + color changer + smooth + responsive)
(function initCubeEmbed() {
  const symbols = ['H','He','Li','Be','B','C','N','O','F','Ne','Na','Mg','Al','Si','P','S','Cl','Ar','K','Ca','Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn','Ga','Ge','As','Se','Br','Kr','Rb','Sr','Y','Zr','Nb','Mo','Tc','Ru','Rh','Pd','Ag','Cd','In','Sn','Sb','Te','I','Xe','Cs','Ba','La','Ce','Pr','Nd','Pm','Sm','Eu','Gd','Tb','Dy','Ho','Er','Tm','Yb','Lu','Hf','Ta','W','Re','Os','Ir','Pt','Au','Hg','Tl','Pb','Bi','Po','At','Rn','Fr','Ra','Ac','Th','Pa','U','Np','Pu','Am','Cm','Bk','Cf','Es','Fm'];
  const names = [
    'Hydrogen','Helium','Lithium','Beryllium','Boron','Carbon','Nitrogen','Oxygen','Fluorine','Neon',
    'Sodium','Magnesium','Aluminum','Silicon','Phosphorus','Sulfur','Chlorine','Argon','Potassium','Calcium',
    'Scandium','Titanium','Vanadium','Chromium','Manganese','Iron','Cobalt','Nickel','Copper','Zinc',
    'Gallium','Germanium','Arsenic','Selenium','Bromine','Krypton','Rubidium','Strontium','Yttrium','Zirconium',
    'Niobium','Molybdenum','Technetium','Ruthenium','Rhodium','Palladium','Silver','Cadmium','Indium','Tin',
    'Antimony','Tellurium','Iodine','Xenon','Cesium','Barium','Lanthanum','Cerium','Praseodymium','Neodymium',
    'Promethium','Samarium','Europium','Gadolinium','Terbium','Dysprosium','Holmium','Erbium','Thulium','Ytterbium',
    'Lutetium','Hafnium','Tantalum','Tungsten','Rhenium','Osmium','Iridium','Platinum','Gold','Mercury',
    'Thallium','Lead','Bismuth','Polonium','Astatine','Radon','Francium','Radium','Actinium','Thorium',
    'Protactinium','Uranium','Neptunium','Plutonium','Americium','Curium','Berkelium','Californium','Einsteinium','Fermium'
  ];
  const colors = [
    'linear-gradient(135deg, rgba(138,43,226,0.9), rgba(75,0,130,0.9))',
    'linear-gradient(145deg, rgba(255,99,71,0.95), rgba(139,0,0,0.9))',
    'linear-gradient(120deg, rgba(50,205,50,0.9), rgba(0,100,0,0.9))',
    'linear-gradient(150deg, rgba(255,215,0,0.9), rgba(184,134,11,0.9))',
    'linear-gradient(140deg, rgba(30,144,255,0.9), rgba(0,70,160,0.9))',
    'linear-gradient(160deg, rgba(255,105,180,0.95), rgba(199,21,133,0.9))',
    'linear-gradient(130deg, rgba(112,128,144,0.9), rgba(47,79,79,0.9))',
    'linear-gradient(145deg, rgba(255,165,0,0.95), rgba(210,105,30,0.9))',
    'linear-gradient(125deg, rgba(64,224,208,0.9), rgba(0,128,128,0.9))',
    'linear-gradient(135deg, rgba(186,85,211,0.9), rgba(123,104,238,0.9))',
    'linear-gradient(155deg, rgba(255,69,0,0.95), rgba(139,0,0,0.9))',
    'linear-gradient(145deg, rgba(0,191,255,0.9), rgba(0,0,128,0.9))',
    'linear-gradient(135deg, rgba(255,20,147,0.95), rgba(148,0,211,0.9))'
  ];

  const elements = symbols.map((s, i) => ({
    symbol: s,
    name: names[i] || s,
    number: i + 1,
    color: colors[i % colors.length]
  }));

  const faces = document.querySelectorAll('.cube-embed .face');
  const spinner = document.getElementById('spinner-cube'); // the rotating element
  if (!faces.length || !spinner) return;

  // --- Performance hints on spinner (the rotating wrapper) ---
  spinner.style.willChange = 'transform';
  spinner.style.backfaceVisibility = 'hidden';
  spinner.style.transformStyle = 'preserve-3d';

  // --- Prepare faces: keep transforms; only add overlays once ---
  faces.forEach(face => {
    if (getComputedStyle(face).position === 'static') {
      face.style.position = 'relative'; // anchor for overlays, safe for 3D
    }
    // smooth color transitions (if not already set in CSS)
    if (!face.style.transition) {
      face.style.transition = 'background 240ms ease, color 120ms ease';
    }

    let sym = face.querySelector('.el-sym');
    if (!sym) {
      const wrap = document.createElement('span');
      wrap.className = 'el-sym';
      wrap.style.cssText = `
        position:absolute; left:0; right:0; top:50%;
        transform:translateY(-50%);
        font-size:inherit; line-height:1; font-weight:900;
        letter-spacing:.02em; text-shadow:0 2px 6px rgba(0,0,0,.35);
        display:block; text-align:center; color:inherit; pointer-events:none;
      `;
      // move current nodes into wrapper (non-destructive)
      while (face.firstChild) wrap.appendChild(face.firstChild);
      face.appendChild(wrap);
      sym = wrap;
    }

    if (!face.querySelector('.el-num')) {
      const num = document.createElement('span');
      num.className = 'el-num';
      num.style.cssText = `
        position:absolute; left:8px; top:6px;
        font-size:.45em; line-height:1; opacity:.95;
        letter-spacing:.01em; font-weight:700;
        text-shadow:0 1px 2px rgba(0,0,0,.35);
        pointer-events:none;
      `;
      face.appendChild(num);
    }

    if (!face.querySelector('.el-name')) {
      const nm = document.createElement('span');
      nm.className = 'el-name';
      nm.style.cssText = `
        position:absolute; left:8px; right:8px; bottom:8px;
        font-size:.42em; line-height:1.1; opacity:.95;
        letter-spacing:.02em; font-weight:600;
        text-shadow:0 1px 2px rgba(0,0,0,.35);
        white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        pointer-events:none; text-align:left;
      `;
      face.appendChild(nm);
    }
  });

  let idx = 0;
  let rafId = 0;

  // Batch DOM writes to the next animation frame (avoids mid-frame jank)
  function updateFaces() {
    const el = elements[idx];
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      faces.forEach(face => {
        const sym = face.querySelector('.el-sym'); if (sym) sym.textContent = el.symbol;
        const num = face.querySelector('.el-num'); if (num) num.textContent = el.number;
        const nm  = face.querySelector('.el-name'); if (nm)  nm.textContent  = el.name;
        face.style.background = el.color; // color changer
        face.style.color = '#fff';
      });
    });
  }

  updateFaces();

  // Advance element on each completed rotation
  spinner.addEventListener('animationiteration', () => {
    idx = (idx + 1) % elements.length;
    updateFaces();
  }, { passive: true });

  // --- Responsiveness: re-scale typography smoothly with container size ---
  // Uses ResizeObserver on the .cube-embed to set a CSS var, which your CSS uses.
  const host = document.querySelector('.cube-embed');
  if (host && 'ResizeObserver' in window) {
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const w = e.contentBoxSize?.[0]?.inlineSize || e.contentRect?.width || host.clientWidth;
        // Derive symbol size from width; clamp similar to CSS to avoid layout jumps
        const symSize = Math.max(28, Math.min(64, w * 0.10)); // 10% of width, 28–64px
        host.style.setProperty('--sym-size', symSize + 'px');
        // (num/name sizes are derived in CSS from --sym-size)
      }
    });
    ro.observe(host);
  }
})();


// Navigation redirects
document.getElementById('joinLobbyBtn')?.addEventListener('click', () => (window.location.href = 'lobby.html'));
document.getElementById('multiplayerBtn')?.addEventListener('click', () => (window.location.href = 'multi.html'));
document.getElementById('creategameBtn')?.addEventListener('click', () => (window.location.href = 'create.html'));
document.getElementById('singlemodeBtn')?.addEventListener('click', () => (window.location.href = 'single.html'));

// Check session
function checkSession() {
  console.log('checkSession started');
  fetch('../php/auth/check_session.php', {
  method: 'GET',
  credentials: 'include'
})
  .then(res => {
    console.log('Session fetch status:', res.status);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  })
  .then(text => {
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('JSON parse error: ' + text);
    }
    if (data.loggedIn) {
      console.log('Session valid');
      loadProfile();
    } else {
      console.log('Session invalid, redirecting');
      sessionStorage.removeItem('loggedIn');
      window.location.href = 'index.html';
    }
  })
  .catch(err => {
    console.error('Session check error:', err);
    loadProfile(); // Fallback
  });
}

// Debug UI and immediate profile load
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded:', new Date().toISOString());
  console.log('profileUid exists:', !!document.getElementById('profileUid'));

  const debugDiv = document.createElement('div');
  debugDiv.id = 'debugResponse';
  debugDiv.style.position = 'fixed';
  debugDiv.style.bottom = '10px';
  debugDiv.style.left = '10px';
  debugDiv.style.background = 'white';
  debugDiv.style.padding = '10px';
  debugDiv.style.border = '1px solid black';
  debugDiv.style.maxWidth = '400px';
  debugDiv.style.maxHeight = '300px';
  debugDiv.style.overflowY = 'auto';
  debugDiv.style.fontSize = '12px';
  debugDiv.style.display = 'none'; // Hidden by default
  debugDiv.innerHTML = '<p><strong>Debug:</strong></p><button onclick="loadProfile()">Load Profile</button><p>Responses:</p>';
  document.body.appendChild(debugDiv);

  // Toggle debug UI with Ctrl+Shift+D
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      debugDiv.style.display = debugDiv.style.display === 'none' ? 'block' : 'none';
    }
  });

  loadProfile(); // Immediate load
  setTimeout(checkSession, 100); // Delayed session check
  setTimeout(() => {
    const profileUid = document.getElementById('profileUid');
    if (profileUid && profileUid.textContent.includes('Loading')) {
      console.log('Fallback: UID still loading');
      loadProfile();
    }
  }, 5000);
});

// popping trigger
// --- Pop effect for buttons only ---
document.querySelectorAll('.card-button, .settings-button, .top-right-profile')
  .forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.add('pop');
      setTimeout(() => btn.classList.remove('pop'), 250);
    });
  });

// --- Apply pop effect when modals open ---
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "flex"; // or "block" depende sa setup mo
    const content = modal.querySelector('.profile-card, .settings-content');
    if (content) {
      content.classList.remove('modal-pop'); // reset if reopened
      void content.offsetWidth; // trick para ma-retrigger animation
      content.classList.add('modal-pop');
    }
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = "none";
}
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.style.display = "flex"; // show modal

  // Hanapin container, kung wala, mismong modal na
  const content =
    modal.querySelector(".profile-card, .settings-card") || modal;

  if (content) {
    content.classList.remove("modal-pop"); // reset
    void content.offsetWidth; // reflow para ma-trigger ulit
    content.classList.add("modal-pop");
  }
}

// Example triggers
document.querySelector(".top-right-profile")?.addEventListener("click", () => {
  openModal("profileModal");
});

document.querySelector(".settings-button")?.addEventListener("click", () => {
  openModal("settingsModal");
});

// Settings Modal Functions (add this to each page's JS file, e.g., single.js)
function openSettings() {
  const modal = document.getElementById('settingsModal');
  const settingsContent = modal.querySelector('.settings-content'); // For backdrop handling
  
  // Show modal
  modal.setAttribute('aria-hidden', 'false');
  modal.style.display = 'block'; // Or use classList.add('show') if you have CSS for .show { display: block; }
  
  // Optional: Focus on title for accessibility
  const title = document.getElementById('settingsTitle');
  if (title) title.focus();
  
  // Sync audio controls UI (toggles/sliders to saved state)
  if (window.initAudioControls) {
    window.initAudioControls();
  }
  
  // Backdrop click to close (outside content area)
  const handleBackdropClick = (e) => {
    if (e.target === modal && !settingsContent.contains(e.target)) {
      closeSettings();
    }
  };
  modal.addEventListener('click', handleBackdropClick);
  
  // Trap focus inside modal (optional, for accessibility)
  trapFocus(modal);
}

function closeSettings() {
  const modal = document.getElementById('settingsModal');
  
  // Hide modal
  modal.setAttribute('aria-hidden', 'true');
  modal.style.display = 'none'; // Or classList.remove('show')
  
  // Remove backdrop listener
  modal.removeEventListener('click', handleBackdropClick); // Note: This assumes the listener is defined in scope—see note below
  
  // Return focus to trigger button (optional—replace #settingsBtn with your actual button ID)
  const triggerBtn = document.getElementById('settingsBtn'); // Or whatever opens it
  if (triggerBtn) triggerBtn.focus();
  
  // Release focus trap
  releaseFocusTrap();
}

// Helper: Trap focus inside modal (prevents tabbing outside)
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

function handleKeydown(e) {
  if (e.key === 'Escape') {
    closeSettings();
  } else if (e.key === 'Tab') {
    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
}

// Note: For the backdrop listener in closeSettings(), define it globally or use event delegation
// If scope issue, add this once on page load:
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('settingsModal');
  if (modal) {
    let backdropHandler; // Store reference
    modal.addEventListener('click', (e) => {
      if (backdropHandler) backdropHandler(e); // Call current handler if set
    });
    // Then in openSettings(), set: backdropHandler = (e) => { if (e.target === modal) closeSettings(); };
    // In closeSettings(): backdropHandler = null;
  }
});