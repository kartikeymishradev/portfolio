// Scroll reveal animation
const reveals = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
reveals.forEach(el => io.observe(el));

// ── 0. WEB AUDIO API "THWIP!" SOUND SYNTHESIZER ──
let audioCtx = null;
let soundEnabled = true;

const soundToggleBtn = document.getElementById('sound-toggle');

function setSoundState(enabled) {
  soundEnabled = enabled;
  if (soundToggleBtn) {
    const labelEl = soundToggleBtn.querySelector('.sound-label');
    const iconEl = soundToggleBtn.querySelector('.sound-icon');
    if (labelEl) labelEl.textContent = enabled ? 'SOUND: ON' : 'SOUND: OFF';
    if (iconEl) iconEl.textContent = enabled ? '🔊' : '🔇';
  }
  localStorage.setItem('spider-sound', enabled ? 'on' : 'off');
}

if (soundToggleBtn) {
  soundToggleBtn.addEventListener('click', () => {
    setSoundState(!soundEnabled);
  });
}

const savedSound = localStorage.getItem('spider-sound');
if (savedSound) {
  setSoundState(savedSound === 'on');
}

function playThwipSound() {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;

    const bufferSize = Math.floor(audioCtx.sampleRate * 0.11);
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;

    const bandpass = audioCtx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(3400 + (Math.random() * 400 - 200), now);
    bandpass.frequency.exponentialRampToValueAtTime(550, now + 0.09);
    bandpass.Q.setValueAtTime(3.5, now);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

    noise.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);

    noise.start(now);
    noise.stop(now + 0.1);

    const whipOsc = audioCtx.createOscillator();
    const whipGain = audioCtx.createGain();

    whipOsc.type = 'triangle';
    whipOsc.frequency.setValueAtTime(2800, now);
    whipOsc.frequency.exponentialRampToValueAtTime(280, now + 0.07);

    whipGain.gain.setValueAtTime(0.3, now);
    whipGain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    whipOsc.connect(whipGain);
    whipGain.connect(audioCtx.destination);

    whipOsc.start(now);
    whipOsc.stop(now + 0.08);

    const clickOsc = audioCtx.createOscillator();
    const clickGain = audioCtx.createGain();

    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(900, now);
    clickOsc.frequency.exponentialRampToValueAtTime(120, now + 0.015);

    clickGain.gain.setValueAtTime(0.35, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.016);

    clickOsc.connect(clickGain);
    clickGain.connect(audioCtx.destination);

    clickOsc.start(now);
    clickOsc.stop(now + 0.016);
  } catch(e) {}
}

function playSignalSound() {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.4);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  } catch(e) {}
}

// ── 1. MULTIVERSE SPIDER-SUIT SELECTOR (4 SUITS) ──
const suitToggleBtn = document.getElementById('suit-toggle');
const mobileSuitToggleBtn = document.getElementById('mobile-suit-toggle');

const suitNames = ['classic', 'miles', '2099', 'iron'];
const suitLabels = {
  classic: { text: 'SUIT: CLASSIC', icon: '🕷️' },
  miles: { text: 'SUIT: MILES MORALES', icon: '⚡' },
  '2099': { text: 'SUIT: SPIDER-MAN 2099', icon: '🌌' },
  iron: { text: 'SUIT: IRON SPIDER', icon: '🤖' }
};

function setSuitTheme(theme) {
  document.body.classList.remove('theme-miles', 'theme-2099', 'theme-iron');
  if (theme !== 'classic') {
    document.body.classList.add(`theme-${theme}`);
  }
  
  const info = suitLabels[theme] || suitLabels.classic;

  [suitToggleBtn, mobileSuitToggleBtn].forEach(btn => {
    if (btn) {
      const labelEl = btn.querySelector('.suit-label');
      const iconEl = btn.querySelector('.suit-icon');
      if (labelEl) labelEl.textContent = info.text;
      if (iconEl) iconEl.textContent = info.icon;
    }
  });

  localStorage.setItem('spider-theme', theme);
}

function toggleSuitTheme() {
  let current = 'classic';
  if (document.body.classList.contains('theme-miles')) current = 'miles';
  else if (document.body.classList.contains('theme-2099')) current = '2099';
  else if (document.body.classList.contains('theme-iron')) current = 'iron';

  const idx = suitNames.indexOf(current);
  const next = suitNames[(idx + 1) % suitNames.length];
  setSuitTheme(next);
  playThwipSound();
}

if (suitToggleBtn) suitToggleBtn.addEventListener('click', toggleSuitTheme);
if (mobileSuitToggleBtn) mobileSuitToggleBtn.addEventListener('click', toggleSuitTheme);

const savedTheme = localStorage.getItem('spider-theme');
if (savedTheme) {
  setSuitTheme(savedTheme);
}

// ── 2. MOBILE NAVIGATION MENU DRAWER ──
const menuToggle = document.getElementById('menu-toggle');
const closeMenu = document.getElementById('close-menu');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');

function openMobileMenu() {
  if (mobileMenu) mobileMenu.classList.add('active');
  document.body.style.overflow = 'hidden';
  playThwipSound();
}

function closeMobileMenu() {
  if (mobileMenu) mobileMenu.classList.remove('active');
  document.body.style.overflow = '';
}

if (menuToggle) menuToggle.addEventListener('click', openMobileMenu);
if (closeMenu) closeMenu.addEventListener('click', closeMobileMenu);

if (mobileMenu) {
  mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) closeMobileMenu();
  });
}

mobileLinks.forEach(link => {
  link.addEventListener('click', closeMobileMenu);
});

// ── 3. PROJECT CATEGORY FILTER TABS ──
const filterTabs = document.querySelectorAll('.filter-tab');
const projectCards = document.querySelectorAll('.project-card');

filterTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    filterTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const filter = tab.dataset.filter;

    projectCards.forEach(card => {
      const category = card.dataset.category;
      if (filter === 'all' || category === filter) {
        card.classList.remove('hidden-card');
      } else {
        card.classList.add('hidden-card');
      }
    });

    playThwipSound();
  });
});

// ── 4. CERTIFICATE CREDENTIAL MODAL DIALOG ──
const certData = {
  goldman: {
    title: "Goldman Sachs — Controllers Virtual Experience",
    subtitle: "Issued via Forage · Job Simulation Credential",
    link: "https://www.theforage.com/simulations/goldman-sachs/controllers-rhq",
    pdf: "certificates/controllers.pdf",
    body: `
      <p>In this simulation with Goldman Sachs Controllers division, key contributions included:</p>
      <ul>
        <li><strong>Financial Analysis & Reporting:</strong> Calculated Net Asset Valuation (NAV) and unitized complex financial data for reporting clarity.</li>
        <li><strong>Excel Data Reconciliation:</strong> Performed thorough data validation, trend analysis, and accounts reconciliation in Excel.</li>
        <li><strong>Corporate Governance:</strong> Evaluated operational risk controls and compliance protocols for financial reporting integrity.</li>
      </ul>
    `
  },
  tata: {
    title: "Tata — Data Analytics Virtual Experience",
    subtitle: "Issued via Forage · Business Data Analytics",
    link: "https://www.theforage.com/simulations/tata/data-visualization-p5ft",
    pdf: null,
    body: `
      <p>Worked through a end-to-end data analytics workflow for Tata Group leadership:</p>
      <ul>
        <li><strong>Executive Data Storytelling:</strong> Transformed raw business telemetry datasets into clear visual dashboards.</li>
        <li><strong>Strategic Insights:</strong> Identified revenue leakage trends and provided data-backed recommendations for executive decision-making.</li>
      </ul>
    `
  },
  citi: {
    title: "Citi — Personal Banking Virtual Experience",
    subtitle: "Issued via Forage · Financial & Economic Analysis",
    link: "https://www.theforage.com/simulations/citi/personal-banking-6bvw",
    pdf: "certificates/personal%20banking.pdf",
    body: `
      <p>Applied quantitative financial modeling in personal banking scenarios:</p>
      <ul>
        <li><strong>Financial Risk Assessment:</strong> Evaluated credit risk models and economic indicator impacts on retail banking products.</li>
        <li><strong>Data-Driven Advisory:</strong> Analyzed customer portfolio trends to optimize risk-adjusted returns.</li>
      </ul>
    `
  },
  ncmpcs: {
    title: "NCMPCS-2026 — Research Paper Co-Author",
    subtitle: "National Conference on Machine Learning & Predictive Analytics · FOET DSMNRU",
    link: "certificates/ncmpcs_2026_paper.png",
    pdf: "certificates/ncmpcs_2026_paper.png",
    body: `
      <img src="certificates/ncmpcs_2026_paper.png" alt="NCMPCS-2026 Certificate" style="width:100%; border:3px solid var(--ink); box-shadow:4px 4px 0 var(--ink); margin-bottom:14px; border-radius:2px;">
      <p>Co-authored & presented research paper at NCMPCS-2026:</p>
      <ul>
        <li><strong>Paper Title:</strong> <em>"AI Driven Early Detection of Economic Slowdown in India Using Multi Sector High Frequency Indicators"</em></li>
        <li><strong>Organized By:</strong> Department of Computer Science & Engineering, FOET, Dr. Shakuntala Misra National Rehabilitation University, Lucknow (10th March 2026).</li>
      </ul>
    `
  },
  conash: {
    title: "CONASH AI SUMMIT 2026 — Participation Certificate",
    subtitle: "Department of Applied Science & Humanities · FOET DSMNRU",
    link: "certificates/conash_ai_summit_2026.png",
    pdf: "certificates/conash_ai_summit_2026.png",
    body: `
      <img src="certificates/conash_ai_summit_2026.png" alt="CONASH AI SUMMIT 2026 Certificate" style="width:100%; border:3px solid var(--ink); box-shadow:4px 4px 0 var(--ink); margin-bottom:14px; border-radius:2px;">
      <p>Awarded Certificate of Participation for active engagement in the CONASH AI SUMMIT 2026:</p>
      <ul>
        <li><strong>Summit Theme:</strong> Computational AI & Applied Machine Learning in Multi-Disciplinary Sciences.</li>
        <li><strong>Organized By:</strong> Department of Applied Science & Humanities, FOET, Dr. Shakuntala Misra National Rehabilitation University, Lucknow (17th March 2026).</li>
      </ul>
    `
  }
};

const certModal = document.getElementById('cert-modal');
const certTitle = document.getElementById('cert-title');
const certSubtitle = document.getElementById('cert-subtitle');
const certBody = document.getElementById('cert-body');
const certLink = document.getElementById('cert-link');
const certPdfLink = document.getElementById('cert-pdf-link');
const certCloseBtn = document.getElementById('cert-close');
const certDismissBtn = document.getElementById('cert-dismiss');

function openCertModal(certKey) {
  const info = certData[certKey];
  if (!info) return;

  if (certTitle) certTitle.textContent = info.title;
  if (certSubtitle) certSubtitle.textContent = info.subtitle;
  if (certBody) certBody.innerHTML = info.body;
  if (certLink) certLink.href = info.link;

  if (certPdfLink) {
    if (info.pdf) {
      certPdfLink.href = info.pdf;
      certPdfLink.style.display = 'inline-block';
    } else {
      certPdfLink.style.display = 'none';
    }
  }

  if (certModal) certModal.classList.add('active');
  document.body.style.overflow = 'hidden';
  playThwipSound();
}

function closeCertModal() {
  if (certModal) certModal.classList.remove('active');
  document.body.style.overflow = '';
}

document.querySelectorAll('.cert-view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const certKey = btn.dataset.cert;
    openCertModal(certKey);
  });
});

if (certCloseBtn) certCloseBtn.addEventListener('click', closeCertModal);
if (certDismissBtn) certDismissBtn.addEventListener('click', closeCertModal);

if (certModal) {
  certModal.addEventListener('click', (e) => {
    if (e.target === certModal) closeCertModal();
  });
}

// RECRUITER 30-SEC PITCH MODAL HANDLER
const pitchToggle = document.getElementById('pitch-toggle');
const pitchModal = document.getElementById('pitch-modal');
const pitchClose = document.getElementById('pitch-close');
const pitchDismiss = document.getElementById('pitch-dismiss');

function openPitchModal() {
  if (pitchModal) pitchModal.classList.add('active');
  document.body.style.overflow = 'hidden';
  playThwipSound();
}
function closePitchModal() {
  if (pitchModal) pitchModal.classList.remove('active');
  document.body.style.overflow = '';
}
if (pitchToggle) pitchToggle.addEventListener('click', openPitchModal);
if (pitchClose) pitchClose.addEventListener('click', closePitchModal);
if (pitchDismiss) pitchDismiss.addEventListener('click', closePitchModal);
if (pitchModal) {
  pitchModal.addEventListener('click', (e) => { if (e.target === pitchModal) closePitchModal(); });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCertModal();
    closePitchModal();
    closeMobileMenu();
  }
});

// ── 5. MOBILE TOUCH & DESKTOP WEB-DECAL & COMIC POP IMPACT ──
const sfxWords = ['THWIP!', 'BAM!', 'ZAP!', 'POW!', 'DATA!', 'KAPOW!', 'WHAM!', 'ZIP!'];

let shotsRemaining = 12;
let isReloading = false;

function updateFluidHUD() {
  const countEl = document.getElementById('fluid-count');
  const fillEl = document.getElementById('fluid-fill');
  if (countEl) countEl.textContent = `${shotsRemaining} / 12`;
  if (fillEl) {
    const pct = (shotsRemaining / 12) * 100;
    fillEl.style.width = pct + '%';
    if (shotsRemaining === 0) {
      fillEl.className = 'hud-fill empty';
    } else if (shotsRemaining <= 3) {
      fillEl.className = 'hud-fill low';
    } else {
      fillEl.className = 'hud-fill';
    }
  }
}

function playEmptyFluidSound() {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.03);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  } catch(e) {}
}

function playReloadSound() {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.06);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch(e) {}
}

function triggerWebReload() {
  if (isReloading) return;
  isReloading = true;

  playEmptyFluidSound();
  const hud = document.getElementById('web-fluid-hud');
  const toast = document.getElementById('web-reload-toast');

  if (hud) hud.classList.add('shake');
  if (toast) toast.classList.add('active');

  setTimeout(() => {
    shotsRemaining = 12;
    updateFluidHUD();
    playReloadSound();

    if (hud) hud.classList.remove('shake');
    if (toast) toast.classList.remove('active');
    isReloading = false;
  }, 1200);
}

function createComicPopText(x, y) {
  const word = isReloading ? 'NO FLUID!' : sfxWords[Math.floor(Math.random() * sfxWords.length)];
  const pop = document.createElement('div');
  pop.className = 'comic-pop-text';
  pop.textContent = word;
  pop.style.left = x + 'px';
  pop.style.top = y + 'px';
  document.body.appendChild(pop);
  pop.addEventListener('animationend', () => pop.remove());
}

function createWebDecal(x, y) {
  if (isReloading) return;

  if (shotsRemaining <= 0) {
    triggerWebReload();
    return;
  }

  shotsRemaining--;
  updateFluidHUD();

  playThwipSound();
  createComicPopText(x, y);

  if (shotsRemaining === 0) {
    setTimeout(triggerWebReload, 250);
  }

  const c = 50;
  const strands = [
    { x1: 4, y1: 30, x2: 96, y2: 62, amp: 5, coils: 6, seed: 0 },
    { x1: 4, y1: 72, x2: 96, y2: 22, amp: 6, coils: 7, seed: 1.3 },
    { x1: 20, y1: 96, x2: 78, y2: 4, amp: 5.5, coils: 6, seed: 2.6 },
    { x1: 6, y1: 50, x2: 60, y2: 96, amp: 4.5, coils: 5, seed: 4.1 }
  ];
  
  function wavyPath(x1, y1, x2, y2, amp, coils, seed) {
    const steps = 26;
    let d = `M ${x1} ${y1}`;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const bx = x1 + (x2 - x1) * t;
      const by = y1 + (y2 - y1) * t;
      const nx = -(y2 - y1);
      const ny = (x2 - x1);
      const len = Math.sqrt(nx * nx + ny * ny) || 1;
      const wob = Math.sin(t * Math.PI * coils + seed) * amp * (0.4 + 0.6 * Math.sin(t * Math.PI));
      d += ` L ${bx + (nx / len) * wob} ${by + (ny / len) * wob}`;
    }
    return d;
  }

  const paths = strands.map(s =>
    `<path d="${wavyPath(s.x1, s.y1, s.x2, s.y2, s.amp, s.coils, s.seed)}"
           stroke="#F4F1E8" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
  ).join('');

  let knot = `M ${c-6} ${c}`;
  for (let a = 0; a <= Math.PI * 4; a += 0.3) {
    const r = (a / (Math.PI * 4)) * 14;
    knot += ` L ${c + Math.cos(a) * r} ${c + Math.sin(a) * r}`;
  }
  const knotPath = `<path d="${knot}" stroke="#F4F1E8" stroke-width="1.2" fill="none"/>`;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.className = 'web-decal';
  svg.style.left = x + 'px';
  svg.style.top = y + 'px';
  svg.innerHTML = paths + knotPath;

  document.body.appendChild(svg);
  svg.addEventListener('animationend', () => svg.remove());
}

document.addEventListener('touchstart', (e) => {
  if (e.target.closest('a, button, input, textarea, select')) return;
  if (e.touches.length > 0) {
    const t = e.touches[0];
    createWebDecal(t.clientX, t.clientY);
  }
}, { passive: true });

document.addEventListener('click', (e) => {
  if (e.target.closest('a, button, input, textarea, select')) return;
  createWebDecal(e.clientX, e.clientY);
});

// ── FLOATING SCROLL-TO-TOP BUTTON ──
const scrollTopBtn = document.getElementById('scroll-top-btn');

function handleScrollTopBtn() {
  if (window.scrollY > 400) {
    scrollTopBtn.classList.add('visible');
  } else {
    scrollTopBtn.classList.remove('visible');
  }
}

window.addEventListener('scroll', handleScrollTopBtn);

if (scrollTopBtn) {
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    playThwipSound();
  });
}

// ── PENDULUM SWING & SPIDER RETICLE CURSOR ──
const isTouch = window.matchMedia('(pointer: coarse)').matches;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!isTouch) {
  const ring = document.getElementById('cursor-ring');
  const legEls = Array.from(document.querySelectorAll('.leg'));
  let mx = innerWidth / 2, my = innerHeight / 2;
  let rx = mx, ry = my;

  let angle = Math.PI / 2;
  let angVel = 0;
  const threadLen = 16;
  let anchorX = mx, anchorY = -30;
  let spiderX = mx, spiderY = my;

  let lastMoveTime = performance.now();
  let lastMx = mx, lastMy = my;
  let speed = 0;
  let idle = false;
  let idleT = 0;
  let wasMovingFast = false;
  let squashT = 0;
  const IDLE_DELAY = 2400;

  let pendingMove = null;
  document.addEventListener('mousemove', e => {
    pendingMove = { x: e.clientX, y: e.clientY };
    if (ring) ring.classList.add('active');
  });

  function animateRing(now) {
    if (pendingMove) {
      mx = pendingMove.x; my = pendingMove.y;
      pendingMove = null;
      lastMoveTime = now;
    }

    const dx = mx - lastMx, dy = my - lastMy;
    const instSpeed = Math.sqrt(dx * dx + dy * dy);
    speed += (instSpeed - speed) * 0.25;
    lastMx = mx; lastMy = my;

    const sinceMove = now - lastMoveTime;
    const nowIdle = sinceMove > IDLE_DELAY;

    if (idle && !nowIdle) squashT = 1;
    if (!idle && nowIdle) idleT = 0;
    idle = nowIdle;

    rx += (mx - rx) * 0.22;
    ry += (my - ry) * 0.22;

    const restAngle = Math.PI / 2;
    const driveX = (mx - rx) * 0.05;
    angVel += -driveX * 0.02;
    angVel += (restAngle - angle) * 0.012;
    angVel *= 0.94;
    angle += reducedMotion ? 0 : angVel;

    const hangX = Math.cos(angle) * threadLen;
    const hangY = Math.sin(angle) * threadLen * 0.6;

    spiderX = rx + hangX;
    spiderY = ry + hangY;

    const settling = Math.abs(angVel) < 0.004 && wasMovingFast;
    if (settling) { squashT = Math.max(squashT, 1); wasMovingFast = false; }
    if (Math.abs(angVel) > 0.02) wasMovingFast = true;
    if (squashT > 0) squashT = Math.max(0, squashT - 0.045);
    const squashEase = squashT * squashT;
    const squashScaleY = 1 - squashEase * 0.22;
    const squashScaleX = 1 + squashEase * 0.22;

    let breathScale = 1;
    if (idle && !reducedMotion) {
      idleT += 0.045;
      breathScale = 1 + Math.sin(idleT) * 0.045;
    }

    if (ring) {
      ring.style.left = spiderX + 'px';
      ring.style.top = spiderY + 'px';

      const tiltDeg = reducedMotion ? 0 : Math.max(-32, Math.min(32, (angle - restAngle) * 55));
      const totalScaleX = squashScaleX * breathScale;
      const totalScaleY = squashScaleY * breathScale;
      ring.style.transform =
        `translate(-50%, -50%) rotate(${tiltDeg}deg) scale(${totalScaleX}, ${totalScaleY})`;
    }

    if (!reducedMotion) {
      const legDrive = Math.max(-1, Math.min(1, angVel * 26 + (dx * 0.015)));
      legEls.forEach(leg => {
        const side = leg.dataset.side === 'l' ? -1 : 1;
        const idx = parseInt(leg.dataset.idx, 10);
        const stagger = idx * 0.6;
        const grip = Math.sin(idleT * 1.3 + stagger) * (idle ? 0.4 : 0);
        const kick = legDrive * side * -1 * (0.5 + idx * 0.12);
        const skew = kick * 10 + grip * 2;
        const scale = 1 + Math.min(0.18, Math.abs(legDrive) * 0.12) - squashEase * 0.05;
        leg.style.transformOrigin = '20px 20px';
        leg.style.transform = `rotate(${skew}deg) scale(${scale})`;
      });
    }

    anchorX += (spiderX - anchorX) * 0.025;

    requestAnimationFrame(animateRing);
  }
  requestAnimationFrame(animateRing);

  let shootStrand = null;
  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => {
      if (ring) ring.classList.add('hover');
      const r = el.getBoundingClientRect();
      shootStrand = {
        x1: spiderX, y1: spiderY,
        x2: r.left + r.width / 2, y2: r.top + r.height / 2,
        born: performance.now()
      };
    });
    el.addEventListener('mouseleave', () => {
      if (ring) ring.classList.remove('hover');
      shootStrand = null;
    });
  });

  const canvas = document.getElementById('web-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let resizeTimer = null;
    function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
    resize();
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 120);
    });

    let trail = [];
    let lastTrailPoint = null;

    function drawWireStrand(x1, y1, x2, y2, amp, coils, phase, color, width) {
      const steps = 40;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const bx = x1 + (x2 - x1) * t;
        const by = y1 + (y2 - y1) * t;
        const nx = -(y2 - y1), ny = (x2 - x1);
        const len = Math.sqrt(nx * nx + ny * ny) || 1;
        const taper = Math.sin(t * Math.PI);
        const wob = Math.sin(t * Math.PI * coils + phase) * amp * taper;
        const px = bx + (nx / len) * wob;
        const py = by + (ny / len) * wob;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    }

    let wirePhase = 0;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      wirePhase += 0.045;
      drawWireStrand(anchorX, anchorY, spiderX, spiderY, 7, 5, wirePhase, 'rgba(244,241,232,0.75)', 1.4);

      if (shootStrand) {
        const age = performance.now() - shootStrand.born;
        const dur = 260;
        if (age < dur) {
          const t = age / dur;
          const ex = shootStrand.x1 + (shootStrand.x2 - shootStrand.x1) * Math.min(1, t * 1.6);
          const ey = shootStrand.y1 + (shootStrand.y2 - shootStrand.y1) * Math.min(1, t * 1.6);
          const alpha = 0.8 * (1 - t);
          drawWireStrand(spiderX, spiderY, ex, ey, 3, 3, wirePhase * 1.4, `rgba(244,241,232,${alpha})`, 1.2);
        } else {
          shootStrand = null;
        }
      }

      if (!lastTrailPoint || Math.hypot(spiderX - lastTrailPoint.x, spiderY - lastTrailPoint.y) > 1.5) {
        trail.push({ x: spiderX, y: spiderY, life: 1 });
        lastTrailPoint = { x: spiderX, y: spiderY };
        if (trail.length > 14) trail.shift();
      }
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1], b = trail[i];
        const alpha = (i / trail.length) * 0.35;
        ctx.strokeStyle = `rgba(244,241,232,${alpha})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      trail.forEach(p => p.life -= 0.02);
      trail = trail.filter(p => p.life > 0);

      requestAnimationFrame(draw);
    }
    draw();
  }
}

// ── 6. ARTHSPANDAN INTERACTIVE ML SLOWDOWN SIMULATOR ──
const sliderGdp = document.getElementById('slider-gdp');
const sliderInf = document.getElementById('slider-inf');
const sliderOil = document.getElementById('slider-oil');

const valGdp = document.getElementById('val-gdp');
const valInf = document.getElementById('val-inf');
const valOil = document.getElementById('val-oil');
const simRiskBadge = document.getElementById('sim-risk-badge');

function calculateSimulatedRisk() {
  if (!sliderGdp || !sliderInf || !sliderOil || !simRiskBadge) return;

  const gdp = parseFloat(sliderGdp.value);
  const inf = parseFloat(sliderInf.value);
  const oil = parseFloat(sliderOil.value);

  if (valGdp) valGdp.textContent = gdp.toFixed(1) + '%';
  if (valInf) valInf.textContent = inf.toFixed(1) + '%';
  if (valOil) valOil.textContent = '$' + Math.round(oil) + '/bbl';

  const risk = Math.min(95, Math.max(5, Math.round(20 + (6.5 - gdp) * 9 + (inf - 5.5) * 6 + (oil - 85) * 0.35)));

  let label = 'LOW RISK';
  let badgeClass = 'sim-badge low';

  if (risk > 65) {
    label = 'HIGH SLOWDOWN RISK';
    badgeClass = 'sim-badge high';
  } else if (risk >= 35) {
    label = 'MODERATE RISK';
    badgeClass = 'sim-badge mod';
  }

  simRiskBadge.textContent = `${label} // ${risk.toFixed(1)}%`;
  simRiskBadge.className = badgeClass;
}

if (sliderGdp) sliderGdp.addEventListener('input', calculateSimulatedRisk);
if (sliderInf) sliderInf.addEventListener('input', calculateSimulatedRisk);
if (sliderOil) sliderOil.addEventListener('input', calculateSimulatedRisk);

// ── 7. SPIDER-SENSE KEYBOARD SHORTCUTS ([T], [M], [R]) ──
document.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

  const key = e.key.toLowerCase();
  if (key === 't') {
    toggleSuitTheme();
    playThwipSound();
  } else if (key === 'm') {
    setSoundState(!soundEnabled);
  } else if (key === 'r') {
    triggerWebReload();
  }
});

// ── 8. COPY EMAIL CLIPBOARD & TOAST ALERT ──
const copyToast = document.getElementById('copy-toast');

document.querySelectorAll('.copy-email-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const email = 'kartikeymishra.dev@gmail.com';
    navigator.clipboard.writeText(email).then(() => {
      playThwipSound();
      createComicPopText(e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight / 2);
      sendTelegramAlert("Copy Email ✉️ Button");
      if (copyToast) {
        copyToast.classList.add('active');
        setTimeout(() => copyToast.classList.remove('active'), 2500);
      }
    }).catch(() => {
      window.location.href = `mailto:${email}`;
    });
  });
});

// ── 9. FEATURE 2: SPIDER WEB SKILLS RADAR CANVAS ──
const radarCanvas = document.getElementById('skills-web-canvas');
if (radarCanvas) {
  const rctx = radarCanvas.getContext('2d');
  const skills = [
    { label: 'Python/SQL', val: 0.88 },
    { label: 'Data EDA', val: 0.92 },
    { label: 'ML Models', val: 0.82 },
    { label: 'Finance Data', val: 0.86 },
    { label: 'Data Viz', val: 0.85 },
    { label: 'Git & Cloud', val: 0.84 }
  ];

  function renderSkillsRadar() {
    const cx = radarCanvas.width / 2;
    const cy = radarCanvas.height / 2;
    const radius = Math.min(cx, cy) - 36;
    const total = skills.length;

    rctx.clearRect(0, 0, radarCanvas.width, radarCanvas.height);

    // Draw spider web polygon rings
    const rings = 4;
    for (let r = 1; r <= rings; r++) {
      const ringRadius = (radius / rings) * r;
      rctx.beginPath();
      for (let i = 0; i < total; i++) {
        const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
        const x = cx + Math.cos(angle) * ringRadius;
        const y = cy + Math.sin(angle) * ringRadius;
        if (i === 0) rctx.moveTo(x, y); else rctx.lineTo(x, y);
      }
      rctx.closePath();
      rctx.strokeStyle = 'rgba(242, 239, 228, 0.18)';
      rctx.lineWidth = 1.2;
      rctx.stroke();
    }

    // Draw axis lines
    for (let i = 0; i < total; i++) {
      const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      rctx.beginPath();
      rctx.moveTo(cx, cy);
      rctx.lineTo(x, y);
      rctx.strokeStyle = 'rgba(242, 239, 228, 0.25)';
      rctx.lineWidth = 1.2;
      rctx.stroke();

      // Labels
      const lx = cx + Math.cos(angle) * (radius + 22);
      const ly = cy + Math.sin(angle) * (radius + 18);
      rctx.font = '700 11px "IBM Plex Mono", monospace';
      rctx.fillStyle = '#F4C430';
      rctx.textAlign = 'center';
      rctx.textBaseline = 'middle';
      rctx.fillText(skills[i].label, lx, ly);
    }

    // Draw skill data web polygon
    rctx.beginPath();
    skills.forEach((s, i) => {
      const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
      const r = radius * s.val;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) rctx.moveTo(x, y); else rctx.lineTo(x, y);
    });
    rctx.closePath();
    rctx.fillStyle = 'rgba(214, 39, 42, 0.4)';
    rctx.fill();
    rctx.strokeStyle = '#D6272A';
    rctx.lineWidth = 2.5;
    rctx.stroke();

    // Draw glowing skill nodes
    skills.forEach((s, i) => {
      const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
      const r = radius * s.val;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;

      rctx.beginPath();
      rctx.arc(x, y, 4.5, 0, Math.PI * 2);
      rctx.fillStyle = '#F4C430';
      rctx.fill();
      rctx.strokeStyle = '#15171C';
      rctx.lineWidth = 1.5;
      rctx.stroke();
    });
  }
  renderSkillsRadar();
}

// ── 10. FEATURE 4: SPIDER-SIGNAL SKY PROJECTION BEAM ──
const signalBtn = document.getElementById('signal-btn');
const spiderSignalBeam = document.getElementById('spider-signal-beam');

if (signalBtn && spiderSignalBeam) {
  signalBtn.addEventListener('click', (e) => {
    e.preventDefault();
    playSignalSound();
    spiderSignalBeam.classList.add('active');

    // Trigger Telegram Bot Alert when Spider-Signal is activated!
    sendTelegramAlert("PROJECT SPIDER-SIGNAL 🏮");

    setTimeout(() => {
      spiderSignalBeam.classList.remove('active');
    }, 3200);
  });
}

// ── 11. TELEGRAM BOT REAL-TIME NOTIFICATION MODULE (SECURE VERCEL BACKEND) ──
function sendTelegramAlert(actionName, extraDetails = {}) {
  fetch('/api/telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: actionName, ...extraDetails })
  }).then(res => res.json())
    .then(data => console.log('[Telegram Alert Status]', data))
    .catch(err => console.log('[Telegram Alert Note] Secure Vercel backend ready.'));
}

// Track PDF Certificate Clicks
document.querySelectorAll('.cert-pdf-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const certName = btn.getAttribute('href') || 'Certificate PDF';
    sendTelegramAlert(`Viewed PDF/Image Certificate (${certName})`);
  });
});

// Direct Telegram Contact Form Submit Handler
const tgForm = document.getElementById('telegram-contact-form');
const tgStatus = document.getElementById('tg-form-status');

if (tgForm) {
  tgForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('tg-name')?.value || '';
    const contact = document.getElementById('tg-contact')?.value || '';
    const message = document.getElementById('tg-message')?.value || '';

    sendTelegramAlert("Direct Message Form Submit", {
      name: name,
      contact: contact,
      customMessage: message
    });

    playThwipSound();
    if (tgStatus) tgStatus.textContent = '⚡ Signal sent! Kartikey will receive your message instantly.';
    tgForm.reset();

    setTimeout(() => {
      if (tgStatus) tgStatus.textContent = '';
    }, 5000);
  });
}
