/* ==========================================================
   CHEMSAGA — Global Profile Guard
   Purpose:
   - Lock account email field everywhere
   - Block unwanted email updates
   - Prevent blur/focus spam & interruptions
   - Defensive against duplicated scripts
   ========================================================== */

(function () {
  'use strict';

  if (window.__PROFILE_GUARD_ACTIVE__) return;
  window.__PROFILE_GUARD_ACTIVE__ = true;

  console.log('[ProfileGuard] Active');

  /* ---------- CONFIG ---------- */
  const LOCKED_FIELDS = ['profileEmail'];
  const BLOCKED_UPDATE_FIELDS = ['email'];

  /* ---------- UTIL ---------- */
  function qs(id) {
    return document.getElementById(id);
  }

  /* ---------- LOCK EMAIL INPUT ---------- */
  function lockEmailField() {
    LOCKED_FIELDS.forEach(id => {
      const el = qs(id);
      if (!el) return;

      // Hard lock
      el.setAttribute('readonly', 'true');
      el.setAttribute('tabindex', '-1');
      el.style.pointerEvents = 'none';
      el.style.userSelect = 'none';
      el.style.opacity = '0.65';
      el.style.cursor = 'not-allowed';

      // Defensive: stop focus / click / blur
      ['click', 'focus', 'mousedown', 'keydown', 'blur'].forEach(evt => {
        el.addEventListener(evt, e => {
          e.preventDefault();
          e.stopImmediatePropagation();
          return false;
        }, true);
      });
    });
  }

  /* ---------- BLOCK EMAIL UPDATE CALLS ---------- */
  const originalSubmit = window.submitProfileUpdate;

  window.submitProfileUpdate = function (field, value) {
    if (BLOCKED_UPDATE_FIELDS.includes(field)) {
      console.warn('[ProfileGuard] Blocked update for field:', field);
      return;
    }

    if (typeof originalSubmit === 'function') {
      return originalSubmit(field, value);
    }
  };

  /* ---------- PREVENT DUPLICATE BLUR HANDLERS ---------- */
  function removeEmailBlurHandlers() {
    const el = qs('profileEmail');
    if (!el) return;

    // Clone trick removes all listeners safely
    const clone = el.cloneNode(true);
    el.parentNode.replaceChild(clone, el);
  }

  /* ---------- OBSERVE DOM (for modals & SPA-like pages) ---------- */
  const observer = new MutationObserver(() => {
    lockEmailField();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  /* ---------- INIT ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    removeEmailBlurHandlers();
    lockEmailField();
  });

})();
