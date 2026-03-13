// popup.js - Vanilla JS Logic

// Constants
const STATES = {
    LOADING: 'state-loading',
    AUTH: 'state-auth',
    UNSUPPORTED: 'state-unsupported',
    FORM: 'state-form',
    MANUAL: 'state-manual',
    SUCCESS: 'state-success',
    ERROR: 'state-error'
};

// State Variables
let currentProblem = null;
let isAuth = false;
let userIntervals = { hard: 1, medium: 3, easy: 5 };

// DOM Elements
const views = {};
Object.values(STATES).forEach(id => {
    views[id] = document.getElementById(id);
});

function syncBtnGroup(groupId, dataAttr, value) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.querySelectorAll('.btn-group-item').forEach((button) => {
        button.classList.toggle('active', button.getAttribute(dataAttr) === value);
    });
}

function initBtnGroup(groupId, selectId, dataAttr) {
    const group = document.getElementById(groupId);
    const select = document.getElementById(selectId);
    if (!group || !select) return;

    group.addEventListener('click', (event) => {
        const button = event.target.closest(`[${dataAttr}]`);
        if (!button) return;
        const value = button.getAttribute(dataAttr);
        select.value = value;
        syncBtnGroup(groupId, dataAttr, value);
    });

    syncBtnGroup(groupId, dataAttr, select.value);
}

function initManualGroups() {
    initBtnGroup('difficulty-group', 'difficulty', 'data-val');
    initBtnGroup('manual-diff-group', 'manual-difficulty', 'data-diff');
    initBtnGroup('manual-platform-group', 'manual-platform', 'data-platform');
}

// UI Helpers
function showState(stateId) {
    // Hide all views
    Object.values(views).forEach(el => {
        if (el) el.classList.add('hidden');
    });

    // Show target view
    if (views[stateId]) {
        views[stateId].classList.remove('hidden');
    }

    // Header Visibility Logic
    // Hidden during Loading and Auth steps to reduce noise
    const header = document.getElementById('app-header');
    if (header) {
        if (stateId === STATES.LOADING || stateId === STATES.AUTH) {
            header.classList.add('hidden');
        } else {
            header.classList.remove('hidden');
        }
    }
}

function setLoading(msg) {
    const el = document.getElementById('loading-text');
    if (el) el.innerText = msg || 'Loading...';
    showState(STATES.LOADING);
}

function showError(msg) {
    const el = document.getElementById('error-msg');
    if (el) el.innerText = msg || 'An error occurred';
    showState(STATES.ERROR);
}

// Logic
async function init() {
    console.log('[Popup] Init');
    setLoading('Checking authentication...');

    try {
        // 1. Check Auth (checks token existence + expiry)
        const authResponse = await chrome.runtime.sendMessage({ type: 'AUTH_STATUS' });
        isAuth = authResponse.isAuthenticated;

        if (!isAuth) {
            showState(STATES.AUTH);
            return;
        }

        // 2. Fetch user's revision intervals to show correct button labels
        try {
            const { intervals } = await chrome.runtime.sendMessage({ type: 'GET_INTERVALS' });
            if (intervals) userIntervals = intervals;
        } catch (_) { /* use defaults */ }

        // 3. Check Page Content (if auth is good)
        setLoading('Detecting problem context...');
        checkCurrentPage();

    } catch (err) {
        console.error(err);
        showError(err.message);
    }
}

async function checkCurrentPage() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.id || !tab.url) {
            showState(STATES.UNSUPPORTED);
            return;
        }

        // Fast-fail for unsupported hosts so popup doesn't stay in spinner state.
        const SUPPORTED_URL_PATTERNS = [
            /^https?:\/\/(www\.)?leetcode\.com\//i,
            /^https?:\/\/(www\.)?codeforces\.com\//i,
            /^https?:\/\/(www\.)?cses\.fi\//i,
            /^https?:\/\/(www\.)?geeksforgeeks\.org\//i,
            /^https?:\/\/practice\.geeksforgeeks\.org\//i,
        ];
        const isSupportedHost = SUPPORTED_URL_PATTERNS.some((rx) => rx.test(tab.url));
        if (!isSupportedHost) {
            showState(STATES.UNSUPPORTED);
            return;
        }

        let responded = false;
        const timeoutId = setTimeout(() => {
            if (!responded) {
                console.warn('Content script response timeout');
                showState(STATES.UNSUPPORTED);
            }
        }, 3000);

        // Send message to content script
        chrome.tabs.sendMessage(tab.id, { action: 'GET_PROBLEM_DETAILS' }, (response) => {
            responded = true;
            clearTimeout(timeoutId);

            if (chrome.runtime.lastError) {
                // Usually means content script not loaded (restricted page or loading)
                console.warn('Content script error:', chrome.runtime.lastError);
                showState(STATES.UNSUPPORTED);
                return;
            }

            if (response && response.isValid) {
                currentProblem = response.data;
                renderForm(currentProblem);
            } else {
                showState(STATES.UNSUPPORTED);
            }
        });
    } catch (e) {
        showState(STATES.UNSUPPORTED);
    }
}

function renderForm(problem) {
    const badge = document.getElementById('platform-badge');
    const title = document.getElementById('problem-title');
    const diffSelect = document.getElementById('difficulty');

    if (badge) badge.innerText = problem.platform;
    if (title) title.innerText = problem.problemTitle;

    // Default Difficulty based on platform logic could go here
    if (diffSelect) diffSelect.value = 'Medium';
    syncBtnGroup('difficulty-group', 'data-val', 'Medium');

    // Update button labels with user's actual revision intervals
    const labels = { Hard: userIntervals.hard, Medium: userIntervals.medium, Easy: userIntervals.easy };
    const group = document.getElementById('difficulty-group');
    if (group) {
        group.querySelectorAll('[data-val]').forEach(btn => {
            const val = btn.dataset.val; // 'Hard', 'Medium', 'Easy'
            const days = labels[val];
            const span = btn.querySelector('span');
            if (span && days !== undefined) span.textContent = `Review in ${days}d`;
        });
    }

    showState(STATES.FORM);

    // Reset button state
    const btnSave = document.getElementById('btn-save');
    const msgDiv = document.getElementById('duplicate-msg');
    const attemptSelect = document.getElementById('attempt-type');

    if (btnSave) {
        btnSave.disabled = false;
        btnSave.innerText = 'Track Problem';
    }
    if (msgDiv) {
        msgDiv.classList.add('hidden');
        msgDiv.innerText = '';
    }
    if (attemptSelect) {
        attemptSelect.value = 'solved';
        attemptSelect.disabled = false;
    }
}

// --- Event Listeners ---

// 1. Navigation
const linkDashboard = document.getElementById('link-dashboard');
if (linkDashboard) {
    linkDashboard.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'OPEN_DASHBOARD' }, (response) => {
            if (chrome.runtime.lastError || !response?.success) {
                chrome.tabs.create({ url: 'https://dsareps.vercel.app/dashboard' });
            }
        });
    });
}

const btnOpenLc = document.getElementById('btn-open-lc');
if (btnOpenLc) {
    btnOpenLc.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://leetcode.com/problemset/all/' });
    });
}

// 2. Auth
const btnLogin = document.getElementById('btn-login');
if (btnLogin) btnLogin.addEventListener('click', () => {
    setLoading('Opening login...');
    chrome.runtime.sendMessage({ type: 'AUTH_LOGIN' }, (response) => {
        if (response.success) {
            pollAuthStatus();
        } else {
            showError('Login initiation failed');
        }
    });
});

const btnLogoutSmall = document.getElementById('btn-logout-small');
if (btnLogoutSmall) btnLogoutSmall.addEventListener('click', handleLogout);

async function handleLogout() {
    await chrome.runtime.sendMessage({ type: 'AUTH_LOGOUT' });
    isAuth = false;
    currentProblem = null;
    window.close();
}

// 3. Form
document.getElementById('save-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentProblem) return;

    const difficulty = document.getElementById('difficulty').value;
    const notes = document.getElementById('notes').value;
    const attemptSelect = document.getElementById('attempt-type');

    const btnSave = document.getElementById('btn-save');
    const msgDiv = document.getElementById('duplicate-msg');

    if (btnSave) {
        btnSave.disabled = true;
        btnSave.innerText = 'Saving...';
    }

    const payload = {
        platform: currentProblem.platform.toLowerCase(),
        title: currentProblem.problemTitle,
        url: currentProblem.url,
        difficulty: difficulty.toLowerCase(),
        notes: notes,
        attemptType: attemptSelect ? attemptSelect.value : 'solved',
        timeSpent: 0,
    };

    console.log("SAVE PAYLOAD", payload);

    chrome.runtime.sendMessage({ type: 'SAVE_PROBLEM', data: payload }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Runtime error:", chrome.runtime.lastError);
            showError('Extension error: ' + chrome.runtime.lastError.message);
            return;
        }

        if (response && response.error === 'AUTH_REQUIRED') {
            showError('Session expired. Please log in again.');
            return;
        }

        if (response && response.isDuplicate) {
            if (btnSave) btnSave.innerText = 'Already Saved';
            if (msgDiv) {
                msgDiv.innerText = `Problem already tracked!`;
                msgDiv.classList.remove('hidden');
            }
            // Transition to success briefly or stay? User logic said "LOCK the UI".
            // But maybe we want the success feedback visual?
            // "if (msgDiv) ... msgDiv.classList.remove('hidden');"
            return;
        } else if (response && response.success) {
            showState(STATES.SUCCESS);
        } else {
            showError(response ? response.error : 'Failed to save');
        }
    });
});

const btnRetry = document.getElementById('btn-retry');
if (btnRetry) btnRetry.addEventListener('click', () => init());
const btnClose = document.getElementById('btn-close');
if (btnClose) btnClose.addEventListener('click', () => window.close());

// 4. Manual Track
const btnManualTrack = document.getElementById('btn-manual-track');
if (btnManualTrack) {
    btnManualTrack.addEventListener('click', () => {
        showState(STATES.MANUAL);
    });
}

const btnBackManual = document.getElementById('btn-back-manual');
if (btnBackManual) {
    btnBackManual.addEventListener('click', () => {
        showState(STATES.UNSUPPORTED);
    });
}

// Auto-detect platform from URL in manual form
const manualUrlInput = document.getElementById('manual-url');
const manualPlatformSelect = document.getElementById('manual-platform');
if (manualUrlInput && manualPlatformSelect) {
    const PLATFORM_HOSTS = [
        { host: 'leetcode.com', value: 'leetcode' },
        { host: 'codeforces.com', value: 'codeforces' },
        { host: 'cses.fi', value: 'cses' },
        { host: 'geeksforgeeks.org', value: 'gfg' },
    ];

    manualUrlInput.addEventListener('input', () => {
        try {
            const { hostname } = new URL(manualUrlInput.value);
            const match = PLATFORM_HOSTS.find(p => hostname.includes(p.host));
            if (match) manualPlatformSelect.value = match.value;
            else manualPlatformSelect.value = 'other';
            syncBtnGroup('manual-platform-group', 'data-platform', manualPlatformSelect.value);
        } catch { /* invalid URL yet */ }
    });
}

const manualForm = document.getElementById('manual-form');
if (manualForm) {
    manualForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const url = document.getElementById('manual-url').value.trim();
        const title = document.getElementById('manual-title').value.trim();
        const platform = document.getElementById('manual-platform').value;
        const difficulty = document.getElementById('manual-difficulty').value;
        const notes = document.getElementById('manual-notes').value.trim();

        if (!url || !title) return;

        const btnSave = document.getElementById('btn-manual-save');
        if (btnSave) {
            btnSave.disabled = true;
            btnSave.innerText = 'Saving...';
        }

        const payload = {
            platform,
            title,
            url,
            difficulty,
            attemptType: 'fresh',
            notes,
            timeSpent: 0,
        };

        chrome.runtime.sendMessage({ type: 'SAVE_PROBLEM', data: payload }, (response) => {
            if (chrome.runtime.lastError) {
                showError('Extension error: ' + chrome.runtime.lastError.message);
                return;
            }

            if (response && response.error === 'AUTH_REQUIRED') {
                showError('Session expired. Please log in again.');
                return;
            }

            if (response && response.isDuplicate) {
                if (btnSave) btnSave.innerText = 'Already Tracked';
                setTimeout(() => showState(STATES.SUCCESS), 800);
                return;
            }

            if (response && response.success) {
                showState(STATES.SUCCESS);
            } else {
                showError(response ? response.error : 'Failed to save');
            }
        });
    });
}

// Auth Polling
function pollAuthStatus() {
    const interval = setInterval(() => {
        chrome.runtime.sendMessage({ type: 'AUTH_STATUS' }, (res) => {
            if (res && res.isAuthenticated) {
                clearInterval(interval);
                isAuth = true;
                // Reload to go to form
                init();
            }
        });
    }, 2000);
}

// Start
initManualGroups();
init();
