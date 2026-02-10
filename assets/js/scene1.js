// Particle Animation
const canvas = document.getElementById("background-canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 1.2;
    this.vy = (Math.random() - 0.5) * 1.2;
    this.size = Math.random() * 4 + 1;
    this.hue = Math.random() * 360;
    this.alpha = Math.random() * 0.4 + 0.4;
    this.phase = Math.random() * Math.PI * 2;
    this.orbitRadius = Math.random() * 20 + 10;
  }

  update() {
    this.x += this.vx + Math.cos(this.phase) * this.orbitRadius * 0.02;
    this.y += this.vy + Math.sin(this.phase) * this.orbitRadius * 0.02;
    this.phase += 0.03;
    if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    this.size = Math.max(1, this.size + Math.sin(this.phase) * 0.3);
    this.hue = (this.hue + 0.8) % 360;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${this.hue}, 80%, 60%, ${this.alpha})`;
    ctx.fill();
  }
}

const particles = [];
for (let i = 0; i < 80; i++) {
  particles.push(new Particle());
}

function drawBackground() {
  const gradient = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
  );
  gradient.addColorStop(0, "rgba(13, 5, 48, 0.2)");
  gradient.addColorStop(1, "rgba(13, 5, 48, 0.8)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  particles.forEach(p => {
    p.update();
    p.draw();
  });

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 100) {
        const opacity = 1 - distance / 100;
        const avgHue = (particles[i].hue + particles[j].hue) / 2;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `hsla(${avgHue}, 80%, 60%, ${opacity * 0.4})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(animate);
}

animate();

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Modal Functions
function openModal(type) {
  document.querySelectorAll(".modal").forEach(modal => {
    modal.style.display = "none";
  });
  const modalId =
    type === "login"
      ? "loginModal"
      : type === "signup"
      ? "signupModal"
      : type === "forgot"
      ? "forgotPasswordModal"
      : "";
  if (modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = "flex";
    const content = modal.querySelector(".modal-content");
    if (content) {
      content.classList.remove("coc-pop");
      void content.offsetWidth; // Force reflow
      content.classList.add("coc-pop");
    }
    // Test Font Awesome
    const icons = modal.querySelectorAll('i[class*="fa-"]');
    icons.forEach(icon => {
      if (!window.getComputedStyle(icon, ':before').content) {
        icon.textContent = '🔍'; // Fallback emoji
      }
    });
  }
}

function closeModal(type) {
  const modalId =
    type === "login"
      ? "loginModal"
      : type === "signup"
      ? "signupModal"
      : type === "forgot"
      ? "forgotPasswordModal"
      : "";
  if (modalId) document.getElementById(modalId).style.display = "none";
}

function openForgotModal() {
  closeModal("login");
  document.getElementById("forgotPasswordModal").style.display = "flex";
}

window.onclick = function (event) {
  if (event.target.classList.contains("modal")) {
    event.target.style.display = "none";
  }
};

// Form Submission
document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const formData = new FormData(this);

  fetch("../php/api/login.php", {
    method: "POST",
    body: formData,
    credentials: "include"
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res.json(); // Parse JSON
    })
    .then(data => {
      console.log("Login response:", data); // Debug
      if (data.status === "success") {
        closeModal("login");
        window.location.href = "loading1.html";
      } else {
        alert("❌ " + (data.message || "Login failed"));
      }
    })
    .catch(err => {
      console.error("Login error:", err);
      alert("❌ Login failed: " + err.message);
    });
});

document.getElementById("signupForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const formData = new FormData(this);

  fetch("../php/api/signup.php", {
    method: "POST",
    body: formData
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res.text();
    })
    .then(data => {
      if (data.trim() === "success") {
        alert("✅ Registered successfully! You can now log in.");
        closeModal("signup");
        openModal("login");
      } else {
        alert("❌ " + data);
      }
    })
    .catch(err => {
      console.error("Signup error:", err);
      alert("❌ Signup failed: " + err.message);
    });
});

document.getElementById("forgotForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const formData = new FormData(this);
  const submitBtn = this.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Sending...";
  submitBtn.disabled = true;

  fetch("../php/api/forgot_password.php", {
    method: "POST",
    body: formData
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res.json();
    })
    .then(data => {
      if (data.success) {
        alert("✅ A 6-digit code has been sent to your email.");
        closeModal("forgot");
        if (data.redirect) {
          window.location.href = data.redirect;
        } else {
          window.location.href = `resetpassword.html?email=${encodeURIComponent(
            formData.get("email")
          )}`;
        }
      } else {
        alert("❌ " + data.error);
      }
    })
    .catch(err => {
      console.error("Forgot password error:", err);
      alert("❌ Failed to send reset code: " + err.message);
    })
    .finally(() => {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    });
});