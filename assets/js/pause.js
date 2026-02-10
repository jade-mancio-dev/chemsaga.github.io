// pause.js
function showRulesModal(startGameCallback) {
    if (localStorage.getItem('dontShowRules') === 'true') {
        showCountdown(startGameCallback);
        return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'rules-overlay';
    const card = document.createElement('div');
    card.className = 'rules-card';
    card.innerHTML = `
        <h2>How to Play</h2>
        <ul>
            <li><span class="rule-icon dice-3d-icon"></span>Roll the dice to move across the board.</li>
            <li><span class="rule-icon dice-3d-icon"></span>Answer questions correctly to earn points.</li>
            <li><span class="rule-icon dice-3d-icon"></span>Beat the AI by scoring higher!</li>
            <li><span class="rule-icon dice-3d-icon"></span>First to hit the Fm tile and answer it correctly declares the Winner!</li>
        </ul>
        <button class="start-btn">Start Game</button>
        <button class="skip-btn">Skip</button>
        <div class="dont-show-again">
            <input type="checkbox" id="dontShowAgain">
            <label for="dontShowAgain">Don't show again</label>
        </div>
    `;
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Fallback: add a unicode dice if SVG didn't render
    const icons = card.querySelectorAll('.dice-3d-icon');
    icons.forEach(icon => { if (!icon.innerHTML.trim()) icon.innerHTML = '🎲'; });

    const startBtn = card.querySelector('.start-btn');
    const skipBtn  = card.querySelector('.skip-btn');
    const dontShowCheckbox = card.querySelector('#dontShowAgain');

    function exitRulesAndCountdown() {
        if (dontShowCheckbox.checked) {
            localStorage.setItem('dontShowRules', 'true');
        }
        overlay.remove();
        // show the same 5s countdown as Start
        showCountdown(startGameCallback);
    }

    startBtn.addEventListener('click', exitRulesAndCountdown);

    // ⬇️ Changed: Skip now also triggers the 5-second countdown
    skipBtn.addEventListener('click', exitRulesAndCountdown);
}


function showCountdown(startGameCallback) {
    const overlay = document.createElement('div');
    overlay.className = 'countdown-overlay';
    const countdownText = document.createElement('div');
    countdownText.className = 'countdown-text';
    countdownText.textContent = '5';
    overlay.appendChild(countdownText);
    document.body.appendChild(overlay);

    let timeLeft = 5;
    const countdownInterval = setInterval(() => {
        timeLeft--;
        countdownText.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            overlay.remove();
            startGameCallback();
        }
    }, 1000);
}

function showPauseModal(resumeCallback, restartCallback, exitCallback) {
    const existingOverlay = document.querySelector('.pause-overlay');
    if (existingOverlay) return;

    const overlay = document.createElement('div');
    overlay.className = 'pause-overlay';
    const card = document.createElement('div');
    card.className = 'pause-card';
    card.innerHTML = `
        <h2>Game Paused</h2>
        <p>Choose an option to continue.</p>
        <button class="resume-btn">Resume</button>
        <button class="restart-btn">Restart</button>
        <button class="exit-btn">Exit</button>
    `;
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const resumeBtn = card.querySelector('.resume-btn');
    const restartBtn = card.querySelector('.restart-btn');
    const exitBtn = card.querySelector('.exit-btn');

    resumeBtn.addEventListener('click', () => {
        overlay.remove();
        resumeCallback();
    });

    restartBtn.addEventListener('click', () => {
        overlay.remove();
        restartCallback();
    });

    exitBtn.addEventListener('click', () => {
        overlay.remove();
        exitCallback();
    });
}