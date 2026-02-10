/* ---------- back button handler ---------- */
    function goBack() {
      try {
        window.location.href = 'scene2.html';
      } catch (e) {
        console.error('Error navigating back:', e);
      }
    }

    /* ---------- settings handlers ---------- */
    function openSettings() {
      try {
        const s = document.getElementById('settingsModal');
        if (!s) return;
        s.style.display = 'block';
        s.setAttribute('aria-hidden', 'false');
        const btn = s.querySelector('.settings-close-btn');
        if (btn) btn.focus();
      } catch (e) {
        console.error('Error opening settings:', e);
      }
    }

    function closeSettings() {
      try {
        const s = document.getElementById('settingsModal');
        if (!s) return;
        s.style.display = 'none';
        s.setAttribute('aria-hidden', 'true');
      } catch (e) {
        console.error('Error closing settings:', e);
      }
    }

    document.getElementById('settingsModal').addEventListener('click', function(e) {
      if (e.target && e.target.id === 'settingsModal') closeSettings();
    });

    

    // single.js
let selectedDifficulty = null;

function selectDifficulty(difficulty) {
  try {
    const difficultyList = document.querySelector('.difficulty-list');
    const btns = document.querySelectorAll('.difficulty-button');

    // remove any old Start button
    const existingStartBtnDiv = document.querySelector('#startGameButtonContainer');
    if (existingStartBtnDiv) existingStartBtnDiv.remove();

    const clickedBtn = Array.from(btns).find(b => b.textContent.trim().toLowerCase() === difficulty.toLowerCase());

    // toggle selection
    if (selectedDifficulty && selectedDifficulty.toLowerCase() === difficulty.toLowerCase()) {
      clickedBtn?.classList.remove('selected');
      selectedDifficulty = null;
      return;
    }

    // reset + select
    btns.forEach(b => b.classList.remove('selected'));
    clickedBtn?.classList.add('selected');
    selectedDifficulty = difficulty;

    // map difficulty -> version number
    const diff = difficulty.toLowerCase();
    const ver = diff === 'easy' ? 1 : (diff === 'normal' ? 2 : 3);

    // Add Start Game button
    const startBtnDiv = document.createElement('div');
    startBtnDiv.id = 'startGameButtonContainer';
    const startBtn = document.createElement('button');
    startBtn.id = 'startGameButton';
    startBtn.className = 'start-game-button';
    startBtn.textContent = 'Start Game';
    startBtn.setAttribute('aria-label', `Start game (${difficulty})`);
    startBtn.addEventListener('click', () => {
  const diffLower = diff; // already lower-case
  const verNum = ver;

  const url = `loading.html?difficulty=${diffLower}&ver=${verNum}`;
  console.log("Redirecting to loading:", url);

  window.location.href = url;
});

    startBtnDiv.appendChild(startBtn);
    difficultyList.appendChild(startBtnDiv);

    console.log(`Difficulty selected: ${difficulty} (ver=${ver})`);
  } catch (e) {
    console.error('Error in selectDifficulty:', e);
  }
}


    
    /* --- Helper to trigger pop-click effect on buttons --- */
function addPopEffect(selector) {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => {
    el.addEventListener('click', () => {
      el.classList.remove('pop-click'); // reset if already active
      void el.offsetWidth; // reflow trick para mag-refresh animation
      el.classList.add('pop-click');
    });
  });
}

/* Apply sa Settings, Difficulty, Start */
window.addEventListener('DOMContentLoaded', () => {
  addPopEffect('.settings-button, .difficulty-button, .start-game-button, .back-button');
});



/* --- Helper to add pop-click on buttons --- */
function addPopEffect(selector) {
  const elements = document.querySelectorAll(selector);
  elements.forEach(el => {
    el.addEventListener('click', () => {
      el.classList.remove('pop-click'); // reset kung naka-run na
      void el.offsetWidth; // force reflow para ma-retrigger
      el.classList.add('pop-click');
    });
  });
}

/* Apply effect ONLY sa Easy/Normal/Hard/Start */
window.addEventListener('DOMContentLoaded', () => {
  addPopEffect('.difficulty-button, .start-game-button');
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