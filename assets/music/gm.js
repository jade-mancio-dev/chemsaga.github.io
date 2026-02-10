/* =====================================================
   CHEMSAGA — Background Game Music (gm.js)
   - Auto play after loading screen
   - Loop forever until page unload
   - Safe autoplay handling
===================================================== */

(function () {
  const MUSIC_KEY = 'CHEMSAGA_BG_MUSIC_STARTED';

  // Prevent restarting music if already running
  if (window.__CHEMSAGA_BGM__) return;

  const audio = new Audio('./assets/music/fun.mp3');
  audio.loop = true;
  audio.volume = 0.6; // adjust if needed
  audio.preload = 'auto';

  window.__CHEMSAGA_BGM__ = audio;

  function tryPlay() {
    audio.play().then(() => {
      sessionStorage.setItem(MUSIC_KEY, '1');
      console.log('[BGM] Playing');
    }).catch(() => {
      // Browser blocked autoplay → wait for first interaction
      console.log('[BGM] Autoplay blocked, waiting for user interaction');
      waitForInteraction();
    });
  }

  function waitForInteraction() {
    const resume = () => {
      audio.play().catch(() => {});
      document.removeEventListener('click', resume);
      document.removeEventListener('keydown', resume);
      document.removeEventListener('touchstart', resume);
    };

    document.addEventListener('click', resume, { once: true });
    document.addEventListener('keydown', resume, { once: true });
    document.addEventListener('touchstart', resume, { once: true });
  }

  // Start music only once per session
  if (!sessionStorage.getItem(MUSIC_KEY)) {
    tryPlay();
  } else {
    // Already started earlier (from loading → game)
    tryPlay();
  }

  // Optional: stop music when leaving game
  window.addEventListener('beforeunload', () => {
    audio.pause();
    audio.currentTime = 0;
    sessionStorage.removeItem(MUSIC_KEY);
  });

})();
