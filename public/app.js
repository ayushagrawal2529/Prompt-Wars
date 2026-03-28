/* ─────────────────────────────────────────────
   PromptWars — Frontend Application Logic
   ───────────────────────────────────────────── */

const API_BASE = window.location.origin;

// ── State ─────────────────────────────────────
let currentType = 'text';
let uploadedFile = null;
let history = JSON.parse(localStorage.getItem('pw_history') || '[]');

// ── DOM Refs ───────────────────────────────────
const submitBtn      = document.getElementById('submitBtn');
const btnText        = submitBtn.querySelector('.btn-text');
const btnIcon        = submitBtn.querySelector('.btn-icon');
const btnLoader      = document.getElementById('btnLoader');
const textInput      = document.getElementById('textInput');
const resultsPanel   = document.getElementById('resultsPanel');
const historyPanel   = document.getElementById('historyPanel');
const historyList    = document.getElementById('historyList');
const rawJson        = document.getElementById('rawJson');
const rawToggleBtn   = document.getElementById('rawToggleBtn');
const resultMeta     = document.getElementById('resultMeta');
const healthStatus   = document.getElementById('healthStatus');
const statusDot      = healthStatus.querySelector('.status-dot');
const statusText     = healthStatus.querySelector('.status-text');

// ── Health Check ───────────────────────────────
async function checkHealth() {
  try {
    const r = await fetch(`${API_BASE}/api/health`);
    if (r.ok) {
      statusDot.className = 'status-dot online';
      statusText.textContent = 'API Online';
    } else {
      throw new Error();
    }
  } catch {
    statusDot.className = 'status-dot offline';
    statusText.textContent = 'API Offline';
  }
}
checkHealth();
setInterval(checkHealth, 15000);

// ── Background Particles ───────────────────────
(function spawnParticles() {
  const container = document.getElementById('bgParticles');
  const colors = ['#6366f1','#a855f7','#06b6d4','#f59e0b'];
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 140 + 40;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-duration:${Math.random()*20+15}s;
      animation-delay:${Math.random()*-20}s;
    `;
    container.appendChild(p);
  }
})();

// ── Tab Switching ──────────────────────────────
document.querySelectorAll('.type-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.type-tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');

    currentType = tab.dataset.type;
    uploadedFile = null;

    document.querySelectorAll('.input-section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`section-${currentType}`).classList.remove('hidden');

    updateSubmitBtn();
  });
});

// ── Text Input Listener ────────────────────────
textInput.addEventListener('input', updateSubmitBtn);

// ── Quick Prompt Buttons ───────────────────────
document.querySelectorAll('.quick-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    textInput.value = btn.dataset.prompt;
    updateSubmitBtn();
  });
});

// ── File Drop Zones ────────────────────────────
setupDropZone('dropZoneAudio', 'fileAudio', 'browseAudio', 'previewAudio', 'audio');
setupDropZone('dropZoneImage', 'fileImage', 'browseImage', 'previewImage', 'image');

function setupDropZone(zoneId, inputId, browseId, previewId, type) {
  const zone    = document.getElementById(zoneId);
  const fileIn  = document.getElementById(inputId);
  const browse  = document.getElementById(browseId);
  const preview = document.getElementById(previewId);

  browse.addEventListener('click', () => fileIn.click());
  zone.addEventListener('click', (e) => { if (e.target !== browse) fileIn.click(); });

  fileIn.addEventListener('change', () => {
    if (fileIn.files[0]) handleFile(fileIn.files[0], preview, type);
  });

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file, preview, type);
  });
}

function handleFile(file, previewEl, expectedType) {
  uploadedFile = file;
  previewEl.classList.remove('hidden');
  previewEl.innerHTML = `✅ <strong>${file.name}</strong> (${formatBytes(file.size)})`;
  updateSubmitBtn();
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/(1024*1024)).toFixed(1)} MB`;
}

// ── Submit Enable/Disable ──────────────────────
function updateSubmitBtn() {
  const hasText = currentType === 'text' && textInput.value.trim().length > 0;
  const hasFile = currentType !== 'text' && uploadedFile !== null;
  submitBtn.disabled = !(hasText || hasFile);
}

// ── Pipeline Stage Highlighting ────────────────
function resetStages() {
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById(`stage-${i}`);
    el.classList.remove('active', 'done');
  }
}

async function animateStages(onComplete) {
  resetStages();
  for (let i = 1; i <= 5; i++) {
    if (i > 1) document.getElementById(`stage-${i-1}`).classList.replace('active','done');
    document.getElementById(`stage-${i}`).classList.add('active');
    await sleep(200);
  }
  await sleep(150);
  document.getElementById('stage-5').classList.replace('active','done');
  onComplete && onComplete();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Submit Handler ─────────────────────────────
submitBtn.addEventListener('click', async () => {
  setLoading(true);
  resetStages();
  resultsPanel.classList.add('hidden');

  const stagePromise = animateStages(null);

  try {
    let response;

    if (currentType === 'text') {
      response = await fetch(`${API_BASE}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'text', payload: textInput.value.trim() })
      });
    } else {
      const form = new FormData();
      form.append('file', uploadedFile);
      form.append('type', currentType);
      response = await fetch(`${API_BASE}/api/process`, { method: 'POST', body: form });
    }

    await stagePromise;

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Server error');
    }

    const data = await response.json();
    renderResults(data);
    saveHistory(data);
    renderHistory();

    // Scroll to results
    setTimeout(() => resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

  } catch (err) {
    await stagePromise;
    alert(`❌ Error: ${err.message}`);
    resetStages();
  } finally {
    setLoading(false);
  }
});

function setLoading(on) {
  submitBtn.classList.toggle('loading', on);
  btnLoader.classList.toggle('hidden', !on);
  btnIcon.classList.toggle('hidden', on);
  btnText.textContent = on ? 'Processing…' : 'Run Pipeline';
}

// ── Render Results ─────────────────────────────
function renderResults(data) {
  const { result, input } = data;
  const now = new Date().toLocaleTimeString();

  resultMeta.textContent = `Type: ${input.type} · Processed at ${now}`;

  // Stage 1 – Normalization
  document.getElementById('rs-norm-type').textContent = result.normalized.type;
  document.getElementById('rs-norm-text').textContent = result.normalized.normalizedText;

  // Stage 2 – Intent
  const intentEl = document.getElementById('rs-intent');
  intentEl.textContent = result.intent.intent;
  intentEl.className = 'rs-val intent-chip';

  const urgencyEl = document.getElementById('rs-urgency');
  urgencyEl.textContent = result.intent.urgency;
  urgencyEl.className = `rs-val urgency-chip chip-${result.intent.urgency}`;

  document.getElementById('rs-entities').textContent = JSON.stringify(result.intent.entities, null, 2);

  // Stage 3 – Context
  document.getElementById('rs-context').textContent =
    JSON.stringify(result.context.context, null, 2);

  // Stage 4 – Decision
  const priorityEl = document.getElementById('rs-priority');
  priorityEl.textContent = result.actions.priority;
  priorityEl.className = `rs-val priority-chip chip-${result.actions.priority}`;

  const riskEl = document.getElementById('rs-risk');
  riskEl.textContent = result.actions.riskLevel;
  riskEl.className = `rs-val risk-chip chip-${result.actions.riskLevel}`;

  const actionsList = document.getElementById('rs-actions');
  actionsList.innerHTML = result.actions.actions.map(a =>
    `<div class="action-item">${a}</div>`
  ).join('');

  // Stage 5 – Verification
  const conf = result.verified.confidence;
  const confBar = document.getElementById('rs-conf-bar');
  const confPct = document.getElementById('rs-conf-pct');
  confBar.style.setProperty('--conf', `${Math.round(conf * 100)}%`);
  confPct.textContent = `${Math.round(conf * 100)}%`;

  const verifiedList = document.getElementById('rs-verified-actions');
  verifiedList.innerHTML = result.verified.verifiedActions.map(a =>
    `<div class="action-item">${a}</div>`
  ).join('');

  // Raw JSON
  rawJson.textContent = JSON.stringify(result, null, 2);

  // Show panel
  resultsPanel.classList.remove('hidden');

  // Expand all stage bodies by default
  document.querySelectorAll('.rs-body').forEach(b => b.classList.remove('collapsed'));
  document.querySelectorAll('.rs-toggle').forEach(t => t.classList.add('open'));
}

// ── Collapsible Stage Bodies ───────────────────
document.querySelectorAll('.rs-header').forEach(header => {
  header.addEventListener('click', () => {
    const targetId = header.querySelector('.rs-toggle').dataset.target;
    const body = document.getElementById(targetId);
    const toggle = header.querySelector('.rs-toggle');
    body.classList.toggle('collapsed');
    toggle.classList.toggle('open');
  });
});

// ── Raw JSON Toggle ────────────────────────────
rawToggleBtn.addEventListener('click', () => {
  rawJson.classList.toggle('hidden');
  rawToggleBtn.textContent = rawJson.classList.contains('hidden') ? 'View Raw JSON' : 'Hide Raw JSON';
});

// ── History ────────────────────────────────────
function saveHistory(data) {
  history.unshift({
    type: data.input.type,
    intent: data.result.intent.intent,
    urgency: data.result.intent.urgency,
    actions: data.result.verified.verifiedActions,
    confidence: data.result.verified.confidence,
    ts: Date.now(),
    raw: data.result
  });
  history = history.slice(0, 10); // keep last 10
  localStorage.setItem('pw_history', JSON.stringify(history));
}

function renderHistory() {
  if (history.length === 0) {
    historyPanel.classList.add('hidden');
    return;
  }
  historyPanel.classList.remove('hidden');
  historyList.innerHTML = history.map((h, idx) => `
    <div class="history-item" onclick="loadHistoryItem(${idx})">
      <div class="hist-left">
        <span class="hist-type-badge">${h.type}</span>
        <span class="hist-intent">${h.intent}</span>
      </div>
      <div class="hist-right">${new Date(h.ts).toLocaleTimeString()}</div>
    </div>
  `).join('');
}

window.loadHistoryItem = function(idx) {
  const h = history[idx];
  const mockData = {
    input: { type: h.type },
    result: h.raw
  };
  renderResults(mockData);
  resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

document.getElementById('clearHistoryBtn').addEventListener('click', () => {
  history = [];
  localStorage.removeItem('pw_history');
  renderHistory();
});

// ── Init ───────────────────────────────────────
renderHistory();
