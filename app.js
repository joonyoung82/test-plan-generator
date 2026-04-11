import * as webllm from "https://esm.run/@mlc-ai/web-llm";

/* ============================================================
   THEME
   ============================================================ */
(function initTheme() {
  var saved = localStorage.getItem('tpg-theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  updateThemeIcon();
})();

function updateThemeIcon() {
  var icon = document.getElementById('themeIcon');
  if (!icon) return;
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  icon.textContent = isDark ? '\u2600\uFE0F' : '\uD83C\uDF19';
}

document.getElementById('themeToggle').addEventListener('click', function () {
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  var next = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('tpg-theme', next);
  updateThemeIcon();
});

/* ============================================================
   LOCAL MODEL (WebLLM)
   ============================================================ */
var engine = null;
var modelLoaded = false;

var modelSelect = document.getElementById('modelSelect');
var loadModelBtn = document.getElementById('loadModelBtn');
var modelStatus = document.getElementById('modelStatus');
var modelProgressWrap = document.getElementById('modelProgressWrap');
var modelProgressFill = document.getElementById('modelProgressFill');
var modelProgressText = document.getElementById('modelProgressText');

loadModelBtn.addEventListener('click', async function () {
  if (modelLoaded) return;

  var modelId = modelSelect.value;
  loadModelBtn.disabled = true;
  loadModelBtn.textContent = 'Loading...';
  modelSelect.disabled = true;
  modelProgressWrap.classList.add('is-visible');
  modelStatus.textContent = 'Loading...';
  modelStatus.classList.remove('is-ready');

  try {
    engine = await webllm.CreateMLCEngine(modelId, {
      initProgressCallback: function (report) {
        var pct = Math.round(report.progress * 100);
        modelProgressFill.style.width = pct + '%';
        modelProgressText.textContent = report.text || ('Downloading... ' + pct + '%');
      }
    });

    modelLoaded = true;
    modelStatus.textContent = 'Ready';
    modelStatus.classList.add('is-ready');
    loadModelBtn.textContent = 'Loaded';
    modelProgressWrap.classList.remove('is-visible');
  } catch (err) {
    modelStatus.textContent = 'Failed';
    loadModelBtn.textContent = 'Retry';
    loadModelBtn.disabled = false;
    modelSelect.disabled = false;
    modelProgressText.textContent = 'Error: ' + err.message;
    console.error('WebLLM load error:', err);
  }
});

/* ============================================================
   TABS
   ============================================================ */
document.querySelectorAll('.tab-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

/* ============================================================
   SYSTEM PROMPT
   ============================================================ */
var SYSTEM_PROMPT = [
  'You are a senior QA engineer with 15+ years of experience in mobile and web testing.',
  'Given a project description (PRD, user story, Confluence page, or feature spec), generate a comprehensive, structured test plan.',
  '',
  'Your output MUST follow this exact structure using markdown:',
  '',
  '## Test Plan Summary',
  'Brief overview: objectives, scope (in/out), and test strategy.',
  '',
  '## Risk Assessment',
  'Identify high-risk areas that need deeper test coverage. Use a table:',
  '| Risk Area | Impact | Likelihood | Mitigation |',
  '',
  '## Test Suites & Test Cases',
  'Group test cases into logical suites. For EACH test case, use this table format:',
  '',
  '### Suite: [Suite Name]',
  '| ID | Title | Type | Priority | Preconditions | Steps | Expected Result |',
  '',
  'Rules for test cases:',
  '- IDs: TC-001, TC-002, etc. (sequential across all suites)',
  '- Type: one of Functional, Negative, Boundary, Integration, Regression, Accessibility, Performance, Security',
  '- Priority: Critical, High, Medium, or Low',
  '- Steps: numbered (1. 2. 3.)',
  '- Include negative tests, edge cases, and boundary conditions — not just happy paths',
  '- Be specific: use concrete values, not vague descriptions',
  '',
  '## Environment & Prerequisites',
  'Devices, browsers, OS versions, test data needed, account requirements.',
  '',
  '## Entry & Exit Criteria',
  'When testing can begin and when it is considered complete.',
  '',
  'IMPORTANT: Generate a minimum of 15 test cases for comprehensive coverage, 8 for critical-paths-only, and 5 for smoke tests.',
  'IMPORTANT: Do NOT use generic steps like "verify it works." Be precise and actionable.',
  'IMPORTANT: Always include at least 30% negative/edge case tests.'
].join('\n');

/* ============================================================
   GENERATE TEST PLAN
   ============================================================ */
var generateBtn = document.getElementById('generateBtn');
var projectInput = document.getElementById('projectInput');
var outputSection = document.getElementById('outputSection');
var outputRendered = document.getElementById('outputRendered');
var outputRaw = document.getElementById('outputRaw');
var errorMsg = document.getElementById('errorMsg');

// Store raw markdown for export
var rawMarkdown = '';

generateBtn.addEventListener('click', async function () {
  hideError();

  if (!modelLoaded || !engine) {
    showError('Please load a local model first.');
    return;
  }

  var description = projectInput.value.trim();
  if (!description) {
    showError('Please paste a project description before generating a test plan.');
    return;
  }

  // Gather options
  var platform = document.getElementById('platformField').value;
  var coverage = document.getElementById('coverageField').value;
  var testTypes = [];
  document.querySelectorAll('.checkbox-grid input[type="checkbox"]:checked').forEach(function (cb) {
    testTypes.push(cb.value);
  });

  var userMessage = description;
  var extras = [];
  if (platform) extras.push('Target platform: ' + platform);
  if (testTypes.length) extras.push('Test types to include: ' + testTypes.join(', '));
  if (coverage) extras.push('Coverage level: ' + coverage);
  if (extras.length) {
    userMessage += '\n\n--- Configuration ---\n' + extras.join('\n');
  }

  // Loading state
  generateBtn.classList.add('is-loading');
  generateBtn.disabled = true;
  outputSection.classList.remove('is-visible');

  try {
    var reply = await engine.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 4096,
      temperature: 0.7
    });

    var text = reply.choices[0].message.content;
    if (!text) throw new Error('No response from model');

    rawMarkdown = text;
    outputRendered.innerHTML = renderMarkdown(text);
    outputRaw.textContent = text;
    outputSection.classList.add('is-visible');
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    showError('Error: ' + err.message);
  } finally {
    generateBtn.classList.remove('is-loading');
    generateBtn.disabled = false;
  }
});

/* ============================================================
   MARKDOWN RENDERER (lightweight)
   ============================================================ */
function renderMarkdown(md) {
  var html = md;

  // Tables
  html = html.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)*)/gm, function (match, header, sep, body) {
    var cols = header.split('|').filter(function (c) { return c.trim(); });
    var rows = body.trim().split('\n');
    var t = '<table><thead><tr>';
    cols.forEach(function (c) { t += '<th>' + c.trim() + '</th>'; });
    t += '</tr></thead><tbody>';
    rows.forEach(function (row) {
      var cells = row.split('|').filter(function (c) { return c.trim(); });
      t += '<tr>';
      cells.forEach(function (c) { t += '<td>' + c.trim() + '</td>'; });
      t += '</tr>';
    });
    t += '</tbody></table>';
    return t;
  });

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Paragraphs (lines not already wrapped)
  html = html.replace(/^(?!<[hultro]|$)(.+)$/gm, '<p>$1</p>');

  // Clean up extra newlines
  html = html.replace(/\n{2,}/g, '\n');

  return html;
}

/* ============================================================
   CSV EXPORT (TestRail format)
   ============================================================ */
document.getElementById('csvBtn').addEventListener('click', function () {
  if (!rawMarkdown) return;
  var csv = generateTestRailCSV(rawMarkdown);
  downloadFile('test-plan.csv', csv, 'text/csv');
  showToast('CSV downloaded!');
});

function generateTestRailCSV(md) {
  var lines = md.split('\n');
  var csvRows = ['Section,Title,Type,Priority,Preconditions,Steps,Expected Result'];
  var currentSuite = 'General';

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();

    // Detect suite headers
    var suiteMatch = line.match(/^###\s+Suite:\s*(.+)/);
    if (suiteMatch) {
      currentSuite = suiteMatch[1].trim();
      continue;
    }

    // Detect table rows (skip header and separator)
    if (line.startsWith('|') && !line.match(/^[\|\s-:]+$/)) {
      var cells = line.split('|').filter(function (c) { return c.trim(); }).map(function (c) { return c.trim(); });
      // Skip table header row
      if (cells[0] === 'ID' || cells[0] === 'Risk Area') continue;

      // TC rows have: ID, Title, Type, Priority, Preconditions, Steps, Expected Result
      if (cells.length >= 7 && cells[0].match(/^TC-/)) {
        csvRows.push([
          escapeCSV(currentSuite),
          escapeCSV(cells[1]),
          escapeCSV(cells[2]),
          escapeCSV(cells[3]),
          escapeCSV(cells[4]),
          escapeCSV(cells[5]),
          escapeCSV(cells[6])
        ].join(','));
      }
    }
  }

  return csvRows.join('\n');
}

function escapeCSV(val) {
  if (!val) return '""';
  val = val.replace(/"/g, '""');
  return '"' + val + '"';
}

function downloadFile(filename, content, type) {
  var blob = new Blob([content], { type: type + ';charset=utf-8;' });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

/* ============================================================
   COPY BUTTONS
   ============================================================ */
document.getElementById('copyMdBtn').addEventListener('click', function () {
  if (!rawMarkdown) return;
  navigator.clipboard.writeText(rawMarkdown).then(function () { showToast('Markdown copied!'); });
});

document.getElementById('copyTextBtn').addEventListener('click', function () {
  if (!rawMarkdown) return;
  // Strip markdown formatting for plain text
  var plain = rawMarkdown
    .replace(/#{1,3}\s/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1');
  navigator.clipboard.writeText(plain).then(function () { showToast('Text copied!'); });
});

document.getElementById('clearBtn').addEventListener('click', function () {
  rawMarkdown = '';
  outputRendered.innerHTML = '';
  outputRaw.textContent = '';
  outputSection.classList.remove('is-visible');
  projectInput.value = '';
  projectInput.focus();
});

/* ============================================================
   HELPERS
   ============================================================ */
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.add('is-visible');
}

function hideError() {
  errorMsg.textContent = '';
  errorMsg.classList.remove('is-visible');
}

function showToast(msg) {
  var toast = document.getElementById('copyToast');
  toast.textContent = msg;
  toast.classList.add('is-visible');
  setTimeout(function () { toast.classList.remove('is-visible'); }, 1500);
}
