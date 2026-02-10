// ===== sfx.js =====

const buttonClickSfx = new Audio("./assets/sounds/scifi.wav");
buttonClickSfx.preload = "auto";

// Force SFX ON
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("soundEffectsToggle");
  const volumeSlider = document.getElementById("soundEffectsVolume");

  if (toggle) toggle.checked = true;
  if (volumeSlider && !volumeSlider.value) volumeSlider.value = 50;

  // Attach SFX to all clickable elements
  document.querySelectorAll("button, [role='button'], .card-button, .action-btn, .settings-close-btn, .close-btn, .top-right-profile, .cube-embed").forEach(el => {
    el.addEventListener("click", playButtonClick);
  });
});

// Play sound function
function playButtonClick() {
  const toggle = document.getElementById("soundEffectsToggle");
  const volumeSlider = document.getElementById("soundEffectsVolume");

  if (toggle && !toggle.checked) return;

  const volume = volumeSlider ? volumeSlider.value / 100 : 1;

  const clone = buttonClickSfx.cloneNode();
  clone.volume = volume;
  clone.play();
}

// Unlock audio on mobile
document.addEventListener("touchstart", () => {
  if (buttonClickSfx.paused && buttonClickSfx.currentTime === 0) {
    buttonClickSfx.play().then(() => {
      buttonClickSfx.pause();
      buttonClickSfx.currentTime = 0;
    }).catch(e => {});
  }
}, { once: true });
