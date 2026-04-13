/* FrameFlow — script.js (fixed & enhanced) */

// ===== NAV SCROLL =====
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

// ===== MOBILE MENU =====
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
  hamburger.classList.toggle('open');
});
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('open');
  });
});

// ===== STICKY BAR =====
const stickyBar = document.getElementById('stickyBar');
const stickyClose = document.getElementById('stickyClose');
let stickyDismissed = false;
window.addEventListener('scroll', () => {
  if (!stickyDismissed && window.scrollY > 600) stickyBar.classList.add('visible');
  else if (window.scrollY < 300) stickyBar.classList.remove('visible');
});
stickyClose.addEventListener('click', () => {
  stickyDismissed = true;
  stickyBar.classList.remove('visible');
});

// ===== SCROLL FADE ANIMATIONS =====
const fadeEls = document.querySelectorAll(
  '.step-card, .bento-card, .testi-card, .pricing-card, .gallery-item, .section-header, .hero-demo, .trust-bar'
);
fadeEls.forEach(el => el.classList.add('fade-up'));
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), 60 * i);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
fadeEls.forEach(el => observer.observe(el));

// ===== PRICING TOGGLE =====
const ptSwitch = document.getElementById('pt-switch');
const ptMonthly = document.getElementById('pt-monthly');
const ptAnnual = document.getElementById('pt-annual');
let isAnnual = false;
ptSwitch.addEventListener('click', () => {
  isAnnual = !isAnnual;
  ptSwitch.classList.toggle('on', isAnnual);
  ptMonthly.classList.toggle('active', !isAnnual);
  ptAnnual.classList.toggle('active', isAnnual);
  document.querySelectorAll('.price-num[data-monthly]').forEach(el => {
    el.textContent = '$' + (isAnnual ? el.dataset.annual : el.dataset.monthly);
  });
});

// ===== STYLE PILLS =====
document.querySelectorAll('.pill').forEach(pill => {
  pill.addEventListener('click', () => {
    pill.closest('.style-pills').querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
  });
});

// ===== EXPORT BUTTONS =====
document.querySelectorAll('.export-row').forEach(row => {
  row.querySelectorAll('.ebtn').forEach(btn => {
    btn.addEventListener('click', () => {
      row.querySelectorAll('.ebtn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
});

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ===== VIDEO GENERATOR APP =====
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

const motionStyles = [
  { id: 'cinematic-pan',  label: 'Cinematic Pan',  animClass: 'anim-pan',      icon: '🎬' },
  { id: 'ken-burns',      label: 'Ken Burns',       animClass: 'anim-kenburns', icon: '📷' },
  { id: 'parallax-3d',    label: 'Parallax 3D',     animClass: 'anim-parallax', icon: '🌀' },
  { id: 'zoom-burst',     label: 'Zoom Burst',       animClass: 'anim-zoom',     icon: '⚡' },
  { id: 'glitch-reveal',  label: 'Glitch Reveal',   animClass: 'anim-glitch',   icon: '✨' },
  { id: 'slow-drift',     label: 'Slow Drift',      animClass: 'anim-drift',    icon: '🌊' },
];

let selectedStyle = motionStyles[0];
let uploadedImageSrc = null;
let isGenerating = false;

if (dropZone) {
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  });
  dropZone.addEventListener('click', (e) => {
    if (e.target.tagName !== 'LABEL' && !e.target.closest('label')) fileInput.click();
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
  });
}

function handleFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedImageSrc = e.target.result;
    showVideoApp(file.name);
  };
  reader.readAsDataURL(file);
}

function showVideoApp(fileName) {
  const ctaSection = document.querySelector('.upload-cta-section');
  ctaSection.innerHTML = `
    <div class="video-app-wrap" id="videoApp">
      <div class="va-header">
        <h2>Create your video</h2>
        <p>Pick a motion style, choose your settings, then hit Generate.</p>
      </div>
      <div class="va-layout">
        <div class="va-preview-col">
          <div class="va-preview-box" id="previewBox">
            <img id="previewImg" src="${uploadedImageSrc}" alt="Your image" class="va-img ${selectedStyle.animClass}" />
            <div class="va-preview-badge" id="previewBadge">${selectedStyle.icon} ${selectedStyle.label}</div>
            <div class="va-progress-bar" id="progressBar" style="display:none;">
              <div class="va-progress-fill" id="progressFill"></div>
            </div>
          </div>
          <div class="va-file-name">📁 ${fileName}</div>
          <button class="va-change-btn" id="changeImageBtn">← Change image</button>
        </div>
        <div class="va-controls-col">
          <div class="va-section-label">Motion Style</div>
          <div class="va-styles-grid" id="stylesGrid">
            ${motionStyles.map(s => `
              <button class="va-style-btn ${s.id === selectedStyle.id ? 'active' : ''}" data-style="${s.id}">
                <span class="va-style-icon">${s.icon}</span>
                <span class="va-style-name">${s.label}</span>
              </button>
            `).join('')}
          </div>
          <div class="va-section-label" style="margin-top:1.5rem;">Resolution</div>
          <div class="va-btn-group" id="resGroup">
            <button class="va-opt-btn" data-val="720p">720p</button>
            <button class="va-opt-btn active" data-val="1080p">1080p</button>
            <button class="va-opt-btn" data-val="4K">4K <span class="pro-tag">Pro</span></button>
          </div>
          <div class="va-section-label" style="margin-top:1rem;">Format</div>
          <div class="va-btn-group" id="fmtGroup">
            <button class="va-opt-btn active" data-val="MP4">MP4</button>
            <button class="va-opt-btn" data-val="MOV">MOV</button>
            <button class="va-opt-btn" data-val="GIF">GIF</button>
          </div>
          <button class="va-generate-btn" id="generateBtn">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2v3M9 13v3M2 9h3M13 9h3M4.22 4.22l2.12 2.12M11.66 11.66l2.12 2.12M4.22 13.78l2.12-2.12M11.66 6.34l2.12-2.12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            Generate Video
          </button>
          <div class="va-result" id="vaResult" style="display:none;">
            <div class="va-result-inner">
              <div class="va-result-icon">🎬</div>
              <div class="va-result-text">
                <strong>Video ready!</strong>
                <span id="resultDesc">Cinematic Pan · 1080p · MP4</span>
              </div>
              <button class="va-download-btn" id="downloadBtn">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 2v8M4 7l3.5 3.5L11 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 13h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  wireVideoApp();
}

function wireVideoApp() {
  document.querySelectorAll('.va-style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.va-style-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedStyle = motionStyles.find(s => s.id === btn.dataset.style);
      const img = document.getElementById('previewImg');
      img.className = 'va-img ' + selectedStyle.animClass;
      document.getElementById('previewBadge').textContent = selectedStyle.icon + ' ' + selectedStyle.label;
      document.getElementById('vaResult').style.display = 'none';
    });
  });

  ['resGroup', 'fmtGroup'].forEach(groupId => {
    document.getElementById(groupId).querySelectorAll('.va-opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById(groupId).querySelectorAll('.va-opt-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  });

  document.getElementById('generateBtn').addEventListener('click', () => {
    if (isGenerating) return;
    isGenerating = true;
    const genBtn = document.getElementById('generateBtn');
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    const vaResult = document.getElementById('vaResult');

    vaResult.style.display = 'none';
    genBtn.disabled = true;
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';

    const steps = [
      { target: 15, delay: 300,  msg: 'Analysing depth…' },
      { target: 40, delay: 700,  msg: 'Generating motion…' },
      { target: 70, delay: 900,  msg: 'Rendering frames…' },
      { target: 90, delay: 700,  msg: 'Encoding video…' },
      { target: 100, delay: 400, msg: 'Finalising…' },
    ];

    let i = 0;
    function runStep() {
      if (i >= steps.length) {
        setTimeout(() => {
          progressBar.style.display = 'none';
          progressFill.style.width = '0%';
          genBtn.disabled = false;
          genBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2v3M9 13v3M2 9h3M13 9h3M4.22 4.22l2.12 2.12M11.66 11.66l2.12 2.12M4.22 13.78l2.12-2.12M11.66 6.34l2.12-2.12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg> Generate Again';
          isGenerating = false;
          const res = document.getElementById('resGroup').querySelector('.active').dataset.val;
          const fmt = document.getElementById('fmtGroup').querySelector('.active').dataset.val;
          document.getElementById('resultDesc').textContent = selectedStyle.label + ' · ' + res + ' · ' + fmt;
          vaResult.style.display = 'block';
        }, 300);
        return;
      }
      const step = steps[i++];
      setTimeout(() => {
        progressFill.style.width = step.target + '%';
        genBtn.textContent = step.msg;
        runStep();
      }, step.delay);
    }
    runStep();
  });

  document.getElementById('downloadBtn').addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280; canvas.height = 720;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(123,97,255,0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = 'bold 36px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.textAlign = 'center';
      ctx.fillText('FrameFlow · ' + selectedStyle.label, canvas.width / 2, canvas.height - 40);
      const fmt = document.getElementById('fmtGroup').querySelector('.active').dataset.val;
      const link = document.createElement('a');
      link.download = 'frameflow-' + selectedStyle.id + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = uploadedImageSrc;
  });

  document.getElementById('changeImageBtn').addEventListener('click', () => {
    location.reload();
  });
}
