/**
 * quit.js — Gorgeous Quit Confirmation Modal
 * 
 * Prevents accidental exit, handles ESC key, browser back button (including mobile swipe-back),
 * and provides a graceful quit experience with proper WebSocket cleanup.
 */

class QuitManager {
  constructor(gameInstance) {
    this.game = gameInstance;
    this.overlay = null;
    this.hasIntent = false; // Prevents double-trigger on back button
  }

  /**
   * quit confirmation modal
   */
  show() {
    if (this.overlay || this.game.gameOver) return;

    // Create dark overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'quit-overlay';

    // Create modal card
    const card = document.createElement('div');
    card.className = 'quit-card pause-card';

    card.innerHTML = `
      <h2>Leave Match?</h2>
      <p>Are you sure you want to quit the game?<br>
         <span style="font-size:0.9em;opacity:0.8;">Other players will be notified.</span>
      </p>
      <div class="quit-buttons">
        <button class="quit-confirm-btn exit-btn">Yes, Quit</button>
        <button class="quit-cancel-btn resume-btn">Cancel</button>
      </div>
    `;

    this.overlay.appendChild(card);
    document.body.appendChild(this.overlay);

    // Close when clicking outside the card
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.hide();
    });

    // Cancel button
    card.querySelector('.quit-cancel-btn')?.addEventListener('click', () => {
      this.hide();
    });

    card.querySelector('.quit-confirm-btn')?.addEventListener('click', () => {
    this.hide();
    this.game.quitGameGracefully(); // ✅ sends quit, closes WS, redirects
});


    // Auto-focus Cancel for better UX (ESC will also work)
    card.querySelector('.quit-cancel-btn')?.focus();
  }

  /**
   * Removes the modal from DOM
   */
  hide() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  /**
   * Initializes ESC key and browser back/swipe-back protection
   */
  init() {
    // 1. ESC Key → Open or close quit modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.overlay && !this.game.gameOver) {
        e.preventDefault();
        this.show();
      } else if (e.key === 'Escape' && this.overlay) {
        e.preventDefault();
        this.hide();
      }
    });

    // 2. Browser back button & mobile swipe-back protection
    const handleBack = (e) => {
      if (this.game.gameOver) return;

      // If user already confirmed intent (second back press), allow normal navigation
      if (this.hasIntent) {
        this.hasIntent = false;
        return;
      }

      // Prevent immediate page leave
      e.preventDefault();

      // Show quit confirmation
      this.show();

      // Mark intent and push a dummy state so next back press can actually leave
      this.hasIntent = true;
      history.pushState(null, '', location.href);
    };

    window.addEventListener('popstate', handleBack);

    // Initial history state to enable back-button blocking
    if (history.state === null) {
      history.pushState(null, '', location.href);
    }
  }
}

// Auto-initialize when the main game instance is fully loaded
const initQuitSystem = () => {
  const checkInterval = setInterval(() => {
    // Wait for your main game instance to be available
    if (
      window.ChemsagaMultiTileBoot &&
      window.ChemsagaMultiTileBoot.session &&
      window.ChemsagaMultiTileBoot.ws
    ) {
      clearInterval(checkInterval);
      console.log('QuitManager initialized successfully.');

      const quitManager = new QuitManager(window.ChemsagaMultiTileBoot);
      quitManager.init();

      // Optional: expose globally for debugging
      window.QuitManager = quitManager;
    }
  }, 100);
};

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', initQuitSystem);