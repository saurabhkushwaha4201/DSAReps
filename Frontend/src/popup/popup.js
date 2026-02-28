// popup.js - Vanilla JS Logic

// Constants
const STATES = {
    LOADING: 'state-loading',
    AUTH: 'state-auth',
    UNSUPPORTED: 'state-unsupported',
    FORM: 'state-form',
    SUCCESS: 'state-success',
    ERROR: 'state-error'
};

// State Variables
let currentProblem = null;
let isAuth = false;

// DOM Elements
const views = {};
Object.values(STATES).forEach(id => {
    views[id] = document.getElementById(id);
});

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

        // 2. Check Page Content (if auth is good)
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

        if (!tab || !tab.id) {
            showState(STATES.UNSUPPORTED);
            return;
        }

        // Send message to content script
        chrome.tabs.sendMessage(tab.id, { action: 'GET_PROBLEM_DETAILS' }, (response) => {
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

    showState(STATES.FORM);

    // Reset button state
    const btnSave = document.getElementById('btn-save');
    const msgDiv = document.getElementById('duplicate-msg');
    const attemptSelect = document.getElementById('attempt-type');

    if (btnSave) {
        btnSave.disabled = false;
        btnSave.innerText = 'Save to Revision Queue';
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
        chrome.tabs.create({ url: 'http://localhost:5175/dashboard' });
    });
}

const btnOpenLc = document.getElementById('btn-open-lc');
if (btnOpenLc) {
    btnOpenLc.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://leetcode.com/problemset/all/' });
    });
}

// 2. Auth
document.getElementById('btn-login').addEventListener('click', () => {
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
    const timeSpent = document.getElementById('time-spent').value;
    const notes = document.getElementById('notes').value;
    const attemptType = document.getElementById('attempt-type').value;

    const btnSave = document.getElementById('btn-save');
    const msgDiv = document.getElementById('duplicate-msg');
    const attemptSelect = document.getElementById('attempt-type');

    if (btnSave) {
        btnSave.disabled = true;
        btnSave.innerText = 'Saving...';
    }
    if (attemptSelect) {
        attemptSelect.disabled = true;
    }

    const payload = {
        platform: currentProblem.platform.toLowerCase(),
        title: currentProblem.problemTitle,
        url: currentProblem.url,
        difficulty: difficulty.toLowerCase(),
        attemptType: attemptType,
        timeSpent: timeSpent ? parseInt(timeSpent) : 0,
        notes: notes
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
                msgDiv.innerText = `Refreshed entry! Next review in ${response.nextRevisionInDays || 1} days`;
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

document.getElementById('btn-retry').addEventListener('click', () => init());
document.getElementById('btn-close').addEventListener('click', () => window.close());

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
init();
