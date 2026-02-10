// ===============================================
// CHEMSAGA Persistent Background Music Loader
// ===============================================

(function() {
  try {
    // Run only in the top-most window
    if (window.top === window) {

      // Create iframe ONCE only
      if (!window.top.document.getElementById("bgmusic-frame")) {
        const iframe = document.createElement("iframe");
        iframe.src = "assets/music/music-frame.html";
        iframe.id = "bgmusic-frame";
        iframe.name = "bgmusic-frame";
        iframe.style.display = "none";
        iframe.allow = "autoplay";

        window.top.document.body.appendChild(iframe);
        console.log("[Music Loader] Music iframe CREATED and persistent.");
      } else {
        console.log("[Music Loader] Music iframe already running.");
      }

    } else {
      console.log("[Music Loader] Inside frame — no need to create iframe.");
    }

  } catch (err) {
    console.error("[Music Loader] Error:", err);
  }
})();
