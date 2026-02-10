function showRulesModal(startGameCallback) {
    if (localStorage.getItem('dontShowRules') === 'true') {
        showCountdown(startGameCallback);
        return;
    }

    const overlay = document.querySelector('.rules-overlay');
    overlay.style.display = 'flex';

    const startBtn = overlay.querySelector('.start-btn');
    const skipBtn = overlay.querySelector('.skip-btn');
    const dontShowCheckbox = overlay.querySelector('#dontShowAgain');

    startBtn.addEventListener('click', () => {
        if (dontShowCheckbox.checked) {
            localStorage.setItem('dontShowRules', 'true');
        }
        overlay.style.display = 'none';
        showCountdown(startGameCallback);
    });

    skipBtn.addEventListener('click', () => {
        if (dontShowCheckbox.checked) {
            localStorage.setItem('dontShowRules', 'true');
        }
        overlay.style.display = 'none';
        startGameCallback();
    });
}

function showCountdown(startGameCallback) {
    const overlay = document.querySelector('.countdown-overlay');
    const countdownText = overlay.querySelector('.countdown-text');
    overlay.style.display = 'flex';

    let timeLeft = 5;
    countdownText.textContent = timeLeft;
    const countdownInterval = setInterval(() => {
        timeLeft--;
        countdownText.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            overlay.style.display = 'none';
            startGameCallback();
        }
    }, 1000);
}

function showPauseModal(resumeCallback, restartCallback, exitCallback) {
    const existingOverlay = document.querySelector('.pause-overlay');
    if (existingOverlay && existingOverlay.style.display === 'flex') return;

    const overlay = document.querySelector('.pause-overlay');
    overlay.style.display = 'flex';

    const resumeBtn = overlay.querySelector('.resume-btn');
    const restartBtn = overlay.querySelector('.restart-btn');
    const exitBtn = overlay.querySelector('.exit-btn');

    resumeBtn.addEventListener('click', () => {
        overlay.style.display = 'none';
        resumeCallback();
    });

    restartBtn.addEventListener('click', () => {
        overlay.style.display = 'none';
        restartCallback();
    });

    exitBtn.addEventListener('click', () => {
        overlay.style.display = 'none';
        exitCallback();
    });
}