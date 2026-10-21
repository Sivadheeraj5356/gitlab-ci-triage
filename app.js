const rules = [
  {
    type: 'Test failure',
    patterns: [/rspec.*failed/i, /jest.*failed/i, /pytest.*failed/i, /npm test.*failed/i, /assertionerror/i, /expected .* received/i],
    owner: 'Owning product team',
    action: 'Open the first failing test, reproduce it locally with the same job image, then fix the assertion or code path before rerunning the pipeline.'
  },
  {
    type: 'Dependency or install failure',
    patterns: [/npm err!/i, /yarn.*error/i, /bundle install.*failed/i, /pip install.*failed/i, /could not resolve dependency/i, /econnrefused|etimedout|503 service unavailable/i],
    owner: 'Build or platform owner',
    action: 'Check the lockfile, package registry status, and job image. Pin the failing dependency or restore registry access, then retry the pipeline.'
  },
  {
    type: 'Docker or runner failure',
    patterns: [/docker: not found/i, /cannot connect to the docker daemon/i, /pull access denied/i, /no space left on device/i, /runner.*offline|executor.*failed/i],
    owner: 'CI platform owner',
    action: 'Verify runner health, image pull rights, disk space, and Docker service availability. Requeue only after the runner checks pass.'
  },
  {
    type: 'Lint or type check failure',
    patterns: [/eslint.*error/i, /rubocop.*offense/i, /typecheck.*failed|tsc.*error/i, /prettier.*check.*failed/i, /golangci-lint.*failed/i],
    owner: 'Owning product team',
    action: 'Run the same lint or type command locally, apply the narrow fix, and confirm the exact job passes before pushing.'
  },
  {
    type: 'Timeout or flaky job',
    patterns: [/execution timed out/i, /timeout after/i, /job exceeded/i, / flaky |flaky test|retrying/i],
    owner: 'Owning product team with CI platform support',
    action: 'Compare runtime with the last green job, split slow work if needed, and mark only proven flaky tests for follow-up.'
  }
];

const sampleLog = `$ gitlab-runner exec docker test
Fetching changes...
$ npm ci
npm error code ERESOLVE
npm error ERESOLVE unable to resolve dependency tree
npm error While resolving: web-app@1.4.0
npm error Could not resolve dependency: eslint-config-custom@2.1.0
npm error 503 Service Unavailable
ERROR: Job failed: exit code 1`;

let logInput;
let results;
let emptyState;
let evidenceList;
let handoff;

function analyzeLog(text) {
  const matches = rules.map(rule => {
    const evidence = rule.patterns
      .filter(pattern => pattern.test(text))
      .map(pattern => pattern.source.replaceAll('\\', ''));
    return { ...rule, score: evidence.length, evidence };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);

  if (!matches.length) {
    return {
      type: 'Needs manual review',
      confidence: 20,
      owner: 'Pipeline owner',
      action: 'The log does not match a common failure class. Read the final non-empty error lines and compare them with the last green job.',
      evidence: ['No known failure signature matched.']
    };
  }

  const total = matches.reduce((sum, item) => sum + item.score, 0);
  const best = matches[0];
  return {
    type: best.type,
    confidence: Math.min(96, 55 + best.score * 15 + Math.max(0, total - best.score) * 5),
    owner: best.owner,
    action: best.action,
    evidence: best.evidence
  };
}

function render(result) {
  document.querySelector('#primaryType').textContent = result.type;
  document.querySelector('#confidence').textContent = `${result.confidence}%`;
  document.querySelector('#owner').textContent = result.owner;
  document.querySelector('#nextAction').textContent = result.action;
  evidenceList.replaceChildren(...result.evidence.map(item => {
    const li = document.createElement('li');
    li.textContent = item;
    return li;
  }));
  handoff.textContent = [
    `Primary signal: ${result.type}`,
    `Confidence: ${result.confidence}%`,
    `Likely owner: ${result.owner}`,
    `Next action: ${result.action}`,
    `Evidence: ${result.evidence.join('; ')}`
  ].join('\n');
  emptyState.hidden = true;
  results.hidden = false;
}

if (typeof document !== 'undefined') {
  logInput = document.querySelector('#logInput');
  results = document.querySelector('#results');
  emptyState = document.querySelector('#emptyState');
  evidenceList = document.querySelector('#evidenceList');
  handoff = document.querySelector('#handoff');

  document.querySelector('#analyzeBtn').addEventListener('click', () => render(analyzeLog(logInput.value.trim())));
  document.querySelector('#sampleBtn').addEventListener('click', () => { logInput.value = sampleLog; render(analyzeLog(sampleLog)); });
  document.querySelector('#clearBtn').addEventListener('click', () => { logInput.value = ''; results.hidden = true; emptyState.hidden = false; });
  document.querySelector('#copyBtn').addEventListener('click', async () => {
    await navigator.clipboard.writeText(handoff.textContent);
  });
}

if (typeof module !== 'undefined') module.exports = { analyzeLog };
