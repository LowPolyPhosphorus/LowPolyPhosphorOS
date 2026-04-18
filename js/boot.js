// boot.js - Handles the boot sequence and login screen

const bootScreen = document.getElementById('boot-screen');
const loginScreen = document.getElementById('login-screen');
const desktop = document.getElementById('desktop');
const progressFill = document.getElementById('boot-progress-fill');
const loginBtn = document.getElementById('login-btn');

// How long the boot sequence takes in ms
const BOOT_DURATION = 3500;
const BOOT_STEPS = [
  { progress: 15, delay: 300 },
  { progress: 35, delay: 800 },
  { progress: 55, delay: 1400 },
  { progress: 75, delay: 2000 },
  { progress: 90, delay: 2600 },
  { progress: 100, delay: 3000 },
];

function runBoot() {
  // Animate the progress bar in steps
  BOOT_STEPS.forEach(step => {
    setTimeout(() => {
      progressFill.style.width = step.progress + '%';
    }, step.delay);
  });

  // After boot completes, fade to login
  setTimeout(() => {
    bootScreen.style.opacity = '0';
    bootScreen.style.transition = 'opacity 0.6s ease';
    setTimeout(() => {
      bootScreen.classList.add('hidden');
      showLogin();
    }, 600);
  }, BOOT_DURATION);
}

function showLogin() {
  loginScreen.classList.remove('hidden');
  loginScreen.style.opacity = '0';
  loginScreen.style.transition = 'opacity 0.5s ease';
  // Slight delay then fade in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      loginScreen.style.opacity = '1';
    });
  });
}

function showDesktop() {
  loginScreen.style.opacity = '0';
  setTimeout(() => {
    loginScreen.classList.add('hidden');
    desktop.classList.remove('hidden');
    desktop.style.opacity = '0';
    desktop.style.transition = 'opacity 0.5s ease';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        desktop.style.opacity = '1';
      });
    });
    // Fire event so other scripts know desktop is ready
    document.dispatchEvent(new Event('desktop-ready'));
  }, 500);
}

// Login button click
loginBtn.addEventListener('click', () => {
  loginBtn.textContent = 'Logging on...';
  loginBtn.disabled = true;
  setTimeout(showDesktop, 800);
});

// Also allow pressing Enter on login
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !loginScreen.classList.contains('hidden')) {
    loginBtn.click();
  }
});

// Shutdown handler
document.getElementById('start-shutdown').addEventListener('click', () => {
  const shutdownScreen = document.getElementById('shutdown-screen');
  desktop.style.opacity = '0';
  desktop.style.transition = 'opacity 0.5s ease';
  setTimeout(() => {
    desktop.classList.add('hidden');
    shutdownScreen.classList.remove('hidden');
    shutdownScreen.style.opacity = '0';
    shutdownScreen.style.transition = 'opacity 0.5s ease';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        shutdownScreen.style.opacity = '1';
      });
    });
  }, 500);
});

// Kick off the boot sequence on page load
window.addEventListener('load', runBoot);