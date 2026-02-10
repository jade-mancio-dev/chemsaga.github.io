/* ============================
   CHEMSAGA - Global No Copy/Paste Script
   ============================ */

// Disable right-click menu
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Disable keyboard shortcuts for copy/paste/cut/select-all/save/etc.
document.addEventListener('keydown', (e) => {
  if (
    (e.ctrlKey || e.metaKey) &&
    ['c', 'v', 'x', 'a', 's', 'u'].includes(e.key.toLowerCase())
  ) {
    e.preventDefault();
  }
});

// Disable any text selection attempt
document.addEventListener('selectstart', (e) => e.preventDefault());

// Disable copy / cut / paste events
document.addEventListener('copy', (e) => e.preventDefault());
document.addEventListener('cut', (e) => e.preventDefault());
document.addEventListener('paste', (e) => e.preventDefault());

// Disable drag selection
document.addEventListener('dragstart', (e) => e.preventDefault());
