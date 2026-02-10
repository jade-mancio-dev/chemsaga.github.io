if (!window.bgMusic) {
  // Set default enabled to true on first run if no saved state
  let isEnabled = localStorage.getItem("bgMusicEnabled") === "true";
  if (localStorage.getItem("bgMusicEnabled") === null) {
    localStorage.setItem("bgMusicEnabled", "true");
    isEnabled = true;
  }

  // Restore last time and volume from localStorage
  const savedTime = parseFloat(localStorage.getItem("bgMusicTime")) || 0;
  const savedVolume = localStorage.getItem("bgMusicVolume") !== null
    ? parseFloat(localStorage.getItem("bgMusicVolume"))
    : 0.5;

  window.bgMusic = new Audio("assets/music/loop.mp3");
  window.bgMusic.loop = true;
  window.bgMusic.currentTime = savedTime;
  window.bgMusic.volume = savedVolume;

  // Save playback position every second only if playing
  setInterval(() => {
    if (!window.bgMusic.paused && isEnabled) {
      localStorage.setItem("bgMusicTime", window.bgMusic.currentTime.toString());
    }
  }, 1000);

  // Helper to attempt play with interaction fallback
  const attemptPlay = () => {
    window.bgMusic.play().catch(error => {
      console.error("Playback failed:", error);
      const resumeBgMusic = () => {
        window.bgMusic.play().catch(() => {});
        document.removeEventListener("pointerdown", resumeBgMusic);
        document.removeEventListener("keydown", resumeBgMusic);
        document.removeEventListener("touchstart", resumeBgMusic);
      };
      document.addEventListener("pointerdown", resumeBgMusic, { once: true });
      document.addEventListener("keydown", resumeBgMusic, { once: true });
      document.addEventListener("touchstart", resumeBgMusic, { once: true });
    });
  };

  // Always attempt to play if enabled (default true)
  if (isEnabled) {
    attemptPlay();
  }
}

// Function to toggle/enable/disable music
function setBgMusic(enabled) {
  const enabledStr = enabled ? "true" : "false";
  localStorage.setItem("bgMusicEnabled", enabledStr);
  
  if (enabled) {
    // Save current time before playing (in case paused)
    localStorage.setItem("bgMusicTime", window.bgMusic.currentTime.toString());
    // Attempt to play (resumes from saved/current time)
    window.bgMusic.play().catch(error => {
      console.error("Playback failed:", error);
    });
  } else {
    // Pause and save current time (so it resumes correctly later)
    window.bgMusic.pause();
    localStorage.setItem("bgMusicTime", window.bgMusic.currentTime.toString());
  }
}

// Function to set volume
function setBgMusicVolume(volume) {
  if (volume < 0) volume = 0;
  if (volume > 1) volume = 1;
  localStorage.setItem("bgMusicVolume", volume.toString());
  if (window.bgMusic) {
    window.bgMusic.volume = volume;
  }
}

// Helper functions to check current state
function isBgMusicEnabled() {
  return localStorage.getItem("bgMusicEnabled") === "true";
}

function getBgMusicVolume() {
  return parseFloat(localStorage.getItem("bgMusicVolume")) || 0.5;
}

// NEW: Sound Effects Global Helpers (assumes <audio id="soundEffect"> exists on pages with SFX)
// These persist volume/enabled state across pages, but apply to local audio element

function setSoundEffectsEnabled(enabled) {
  const enabledStr = enabled ? "true" : "false";
  localStorage.setItem("soundEffectsEnabled", enabledStr);
  
  const soundEffect = document.getElementById('soundEffect');
  if (soundEffect) {
    const savedVol = getSoundEffectsVolume();
    soundEffect.volume = enabled ? savedVol : 0;
  }
}

function setSoundEffectsVolume(volume) {
  if (volume < 0) volume = 0;
  if (volume > 1) volume = 1;
  localStorage.setItem("soundEffectsVolume", volume.toString());
  
  const soundEffect = document.getElementById('soundEffect');
  if (soundEffect) {
    const isEnabled = isSoundEffectsEnabled();
    soundEffect.volume = isEnabled ? volume : 0;
  }
}

function isSoundEffectsEnabled() {
  return localStorage.getItem("soundEffectsEnabled") === "true";
}

function getSoundEffectsVolume() {
  return parseFloat(localStorage.getItem("soundEffectsVolume")) || 0.5;
}

// Auto-initialize UI controls if elements exist on the page (now handles both BG and SFX)
function initAudioControls() {
  console.log('initAudioControls called'); // Debug: Confirms init runs

  // BG Music
  const bgMusicToggle = document.getElementById('bgMusicToggle');
  const bgMusicVolume = document.getElementById('bgMusicVolume');
  
  if (bgMusicToggle) {
    bgMusicToggle.checked = isBgMusicEnabled();
    console.log('BG Toggle set to:', bgMusicToggle.checked); // Debug
  }
  if (bgMusicVolume) {
    const savedVol = getBgMusicVolume();
    bgMusicVolume.value = Math.round(savedVol * 100); // Scale to 0-100
    console.log('BG Volume set to:', bgMusicVolume.value); // Debug
  }
  
  // Sound Effects
  const soundEffectsToggle = document.getElementById('soundEffectsToggle');
  const soundEffectsVolume = document.getElementById('soundEffectsVolume');
  const soundEffect = document.getElementById('soundEffect');
  
  if (soundEffectsToggle) {
    soundEffectsToggle.checked = isSoundEffectsEnabled();
    console.log('SFX Toggle set to:', soundEffectsToggle.checked); // Debug
  }
  if (soundEffectsVolume) {
    const savedVol = getSoundEffectsVolume();
    soundEffectsVolume.value = Math.round(savedVol * 100); // Scale to 0-100
    console.log('SFX Volume set to:', soundEffectsVolume.value); // Debug
  }
  if (soundEffect) {
    const isEnabled = isSoundEffectsEnabled();
    const savedVol = getSoundEffectsVolume();
    soundEffect.volume = isEnabled ? savedVol : 0;
    console.log('SFX Audio volume set to:', soundEffect.volume); // Debug
  }

  // Listeners for BG Music
  if (bgMusicToggle) {
    bgMusicToggle.removeEventListener('change', handleBgMusicToggle);
    bgMusicToggle.addEventListener('change', handleBgMusicToggle);
    console.log('BG Toggle listener added'); // Debug
  }
  if (bgMusicVolume) {
    bgMusicVolume.removeEventListener('input', handleBgMusicVolume);
    bgMusicVolume.addEventListener('input', handleBgMusicVolume);
    console.log('BG Volume listener added'); // Debug
  }

  // Listeners for Sound Effects
  if (soundEffectsToggle) {
    soundEffectsToggle.removeEventListener('change', handleSoundEffectsToggle);
    soundEffectsToggle.addEventListener('change', handleSoundEffectsToggle);
    console.log('SFX Toggle listener added'); // Debug
  }
  if (soundEffectsVolume) {
    soundEffectsVolume.removeEventListener('input', handleSoundEffectsVolume);
    soundEffectsVolume.addEventListener('input', handleSoundEffectsVolume);
    console.log('SFX Volume listener added'); // Debug
  }
}

// Handler functions for BG Music (with event prevention to avoid bubbling issues)
function handleBgMusicToggle(e) {
  e.stopPropagation(); // Prevent event bubbling to modal or parent
  e.preventDefault(); // Prevent default if needed
  console.log('BG Toggle clicked:', this.checked); // Debug: Confirms click detected
  setBgMusic(this.checked);
}

function handleBgMusicVolume(e) {
  e.stopPropagation(); // Prevent event bubbling
  e.preventDefault(); // Prevent default if needed
  const v = parseFloat(this.value) / 100;
  console.log('BG Volume changed to:', v); // Debug: Confirms slide detected
  setBgMusicVolume(v);
  
  // Auto-toggle if volume changes to/from 0
  const bgMusicToggle = document.getElementById('bgMusicToggle');
  if (v > 0 && bgMusicToggle && !bgMusicToggle.checked) {
    bgMusicToggle.checked = true;
    setBgMusic(true);
  }
  if (v === 0 && bgMusicToggle && bgMusicToggle.checked) {
    bgMusicToggle.checked = false;
    setBgMusic(false);
  }
}

// Handler functions for Sound Effects (with event prevention)
function handleSoundEffectsToggle(e) {
  e.stopPropagation(); // Prevent event bubbling
  e.preventDefault(); // Prevent default if needed
  console.log('SFX Toggle clicked:', this.checked); // Debug
  setSoundEffectsEnabled(this.checked);
}

function handleSoundEffectsVolume(e) {
  e.stopPropagation(); // Prevent event bubbling
  e.preventDefault(); // Prevent default if needed
  const v = parseFloat(this.value) / 100;
  console.log('SFX Volume changed to:', v); // Debug
  setSoundEffectsVolume(v);
  
  // Auto-toggle if volume changes to/from 0
  const soundEffectsToggle = document.getElementById('soundEffectsToggle');
  if (v > 0 && soundEffectsToggle && !soundEffectsToggle.checked) {
    soundEffectsToggle.checked = true;
    setSoundEffectsEnabled(true);
  }
  if (v === 0 && soundEffectsToggle && soundEffectsToggle.checked) {
    soundEffectsToggle.checked = false;
    setSoundEffectsEnabled(false);
  }
}

// Auto-init on DOM ready if elements exist (handles both BG and SFX)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('bgMusicToggle') || document.getElementById('bgMusicVolume') ||
        document.getElementById('soundEffectsToggle') || document.getElementById('soundEffectsVolume')) {
      initAudioControls();
    }
  });
} else {
  // Already loaded
  if (document.getElementById('bgMusicToggle') || document.getElementById('bgMusicVolume') ||
      document.getElementById('soundEffectsToggle') || document.getElementById('soundEffectsVolume')) {
    initAudioControls();
  }
}

// Optional: Expose init function for manual call (e.g., if modal is dynamically loaded)
window.initAudioControls = initAudioControls;