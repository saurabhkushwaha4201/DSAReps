import React from 'react';
import { createRoot } from 'react-dom/client';
import CaptureModal from './CaptureModal';
import FloatingCapsule from './FloatingCapsule';
import { detectPlatform, isKnownHubPage } from './platformConfigs';

console.log('[DSA Tracker] Content Script Loaded');

// ── Platform Detection & Problem Extraction ────────────────

let activeConfig = null; // current platform config (or null)

function getProblemDetails() {
  const url = window.location.href;
  const hostname = window.location.hostname;
  const config = detectPlatform(hostname, url);

  if (!config) return { isValid: false };

  activeConfig = config;
  let problemTitle = document.title;

  if (config.titleCleanup instanceof RegExp) {
    problemTitle = problemTitle.replace(config.titleCleanup, '').trim();
  } else if (typeof config.titleCleanup === 'string') {
    problemTitle = problemTitle.replace(config.titleCleanup, '').trim();
  }

  return {
    isValid: true,
    data: { platform: config.platform, problemTitle, url },
  };
}

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_PROBLEM_DETAILS') {
    sendResponse(getProblemDetails());
  }
});

// ── Shadow DOM Host Creation ────────────────────────────────

function createShadowHost(id) {
  const existing = document.getElementById(id);
  if (existing) return existing.shadowRoot;

  const host = document.createElement('div');
  host.id = id;
  host.style.cssText = 'all: initial; position: fixed; z-index: 2147483647;';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });
  return shadow;
}

// ── Bookmark Icon Injection ─────────────────────────────────

// "Shield-Gem" identity animation CSS — injected once into the page
const BOOKMARK_STYLES = `
  /* Base */
  .p-bookmark-btn {
    display: inline-flex;
    cursor: pointer;
    margin-left: 10px;
    vertical-align: middle;
    background: none;
    border: none;
    padding: 0;
    animation: gem-entrance 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
  }
  .p-bookmark-btn:hover svg {
    stroke: #6b7280;
    transform: scale(1.15);
  }
  .p-bookmark-btn svg {
    stroke: #9ca3af;
    fill: none;
    transition: stroke 0.25s ease, fill 0.25s ease, transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  /* Tier 1: Subtle entrance for every icon (unsaved) */
  @keyframes gem-entrance {
    0%   { opacity: 0; transform: scale(0.55); }
    100% { opacity: 1; transform: scale(1); }
  }

  /* Tier 2: Saved — blue fill + persistent glow pulse */
  .p-bookmark-btn.is-saved svg {
    stroke: #3b82f6;
    fill: #3b82f6;
    animation: gem-glow-pulse 2.5s 0.8s ease-in-out infinite;
  }
  .p-bookmark-btn.is-saved {
    animation: gem-entrance 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) both,
               gem-pop 0.55s 0.5s ease-out both;
  }

  /* Persistent glow: drop-shadow pulses in/out every 2.5s */
  @keyframes gem-glow-pulse {
    0%   { filter: drop-shadow(0 0 2px rgba(59, 130, 246, 0.3)); }
    50%  { filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.85)); }
    100% { filter: drop-shadow(0 0 2px rgba(59, 130, 246, 0.3)); }
  }

  /* Click-to-save pop (applied via .just-saved) */
  .p-bookmark-btn.just-saved {
    animation: gem-pop 0.55s ease-out both;
  }

  @keyframes gem-pop {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.5); }
    100% { transform: scale(1); }
  }

  /* ── Toast ── */
  .dsa-toast {
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%) translateY(12px);
    background: #1e1e2e;
    color: #cdd6f4;
    border: 1px solid #313244;
    border-radius: 10px;
    padding: 10px 18px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    z-index: 2147483646;
    opacity: 0;
    animation: toast-in 0.25s ease-out forwards, toast-out 0.3s ease-in 2s forwards;
    pointer-events: none;
  }
  .dsa-toast .toast-icon { font-size: 16px; }
  @keyframes toast-in {
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  @keyframes toast-out {
    to { opacity: 0; transform: translateX(-50%) translateY(8px); }
  }
`;

function injectBookmarkStyles() {
  if (document.getElementById('dsa-tracker-bookmark-styles')) return;
  const style = document.createElement('style');
  style.id = 'dsa-tracker-bookmark-styles';
  style.textContent = BOOKMARK_STYLES;
  document.head.appendChild(style);
}

// ── Toast Notification ──────────────────────────────────────

function showToast(message, icon = '🗑️') {
  injectBookmarkStyles(); // ensure CSS is present
  document.querySelector('.dsa-toast')?.remove();
  const toast = document.createElement('div');
  toast.className = 'dsa-toast';
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  document.body.appendChild(toast);
  // Remove from DOM after animation finishes (2s in + 0.3s out)
  setTimeout(() => toast.remove(), 2400);
}

// ── Storage Controller ─────────────────────────────────────

const StorageController = {
  getProblemId: (config) => {
    // Use slugIndex (unfiltered split) when available, e.g. LC /problems/two-sum/description → index 2 = 'two-sum'
    const parts = window.location.pathname.split('/');
    const slug = config.slugIndex != null
      ? (parts[config.slugIndex] || parts.filter(Boolean).pop())
      : parts.filter(Boolean).pop();
    return `${config.platform}_${slug}`;
  },
  isSaved: async (problemId) => {
    const data = await chrome.storage.local.get(['savedProblems']);
    return !!(data.savedProblems && data.savedProblems[problemId]);
  },
  get: async (problemId) => {
    const data = await chrome.storage.local.get(['savedProblems']);
    return data.savedProblems?.[problemId] || null;
  },
  save: async (problemData) => {
    const data = await chrome.storage.local.get(['savedProblems']);
    const saved = data.savedProblems || {};
    saved[problemData.id] = { ...problemData, date: new Date().toISOString() };
    await chrome.storage.local.set({ savedProblems: saved });
  },
  remove: async (problemId) => {
    const data = await chrome.storage.local.get(['savedProblems']);
    const saved = data.savedProblems || {};
    delete saved[problemId];
    await chrome.storage.local.set({ savedProblems: saved });
  },
};

let captureModalRoot = null;
let captureModalShadow = null;

function openCaptureModal(onConfirmed, onCancelled) {
  if (!captureModalShadow) {
    captureModalShadow = createShadowHost('dsa-tracker-modal-host');
  }

  const mountPoint = document.createElement('div');
  mountPoint.id = 'capture-modal-mount';
  captureModalShadow.innerHTML = '';
  captureModalShadow.appendChild(mountPoint);

  const details = getProblemDetails();
  captureModalRoot = createRoot(mountPoint);
  captureModalRoot.render(
    <CaptureModal
      problemDetails={details.isValid ? details.data : null}
      onClose={(saved, dbId) => {
        captureModalRoot.unmount();
        captureModalShadow.innerHTML = '';
        captureModalRoot = null;
        if (saved) onConfirmed?.(dbId);
        else onCancelled?.();
      }}
    />
  );
}

async function injectAndSync(config) {
  // 1. Find title element
  const selectors = Array.isArray(config.titleSelector)
    ? config.titleSelector
    : [config.titleSelector];
  let titleEl = null;
  for (const s of selectors) {
    try { titleEl = document.querySelector(s); } catch { /* invalid selector */ }
    if (titleEl) break;
  }

  // Stop if title not found or already injected (check both button and in-progress marker)
  if (!titleEl || titleEl.querySelector('.p-bookmark-btn') || titleEl.dataset.dsaInjecting) return;

  // Mark synchronously before any await to prevent race condition with MutationObserver
  titleEl.dataset.dsaInjecting = '1';

  injectBookmarkStyles();

  const problemId = StorageController.getProblemId(config);
  const problemTitle = titleEl.innerText.replace(/\n/g, '').trim();

  // 2. Create Triple Layered Diamond icon
  const btn = document.createElement('div');
  btn.className = 'p-bookmark-btn';
  btn.title = 'Save to DSA Revision Tracker';
  btn.innerHTML = `
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
    </svg>`;

  // 3. Initial sync — check local cache first, then backend as fallback
  let alreadySaved = await StorageController.isSaved(problemId);

  if (!alreadySaved) {
    // Not in local cache — ask backend (covers problems saved via dashboard/popup)
    const backendCheck = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'CHECK_PROBLEM_BY_URL', data: { url: window.location.href } },
        (res) => resolve(res || { saved: false, problem: null })
      );
    });
    if (backendCheck.saved && backendCheck.problem) {
      // Sync into local cache so future checks are instant
      await StorageController.save({
        id: problemId,
        title: problemTitle,
        url: window.location.href,
        platform: config.platform,
        dbId: backendCheck.problem._id,
      });
      alreadySaved = true;
    }
  }

  // is-saved triggers Tier 2 (big pop after entrance); plain btn gets Tier 1 (subtle entrance)
  if (alreadySaved) btn.classList.add('is-saved');

  // 4. Click: unsave + remove from backend if already saved, otherwise open modal first
  btn.onclick = async (e) => {
    e.stopPropagation();
    btn.style.pointerEvents = 'none';

    const currentlySaved = await StorageController.isSaved(problemId);

    if (currentlySaved) {
      // Already saved — remove from backend first, then local cache
      const saved = await StorageController.get(problemId);
      if (saved?.dbId) {
        const response = await Promise.race([
          new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'REMOVE_PROBLEM', data: { dbId: saved.dbId } }, resolve);
          }),
          new Promise((resolve) => setTimeout(() => resolve({ error: 'timeout' }), 8000)),
        ]);
        if (response?.error) {
          showToast('Failed to remove problem', '❌');
          btn.style.pointerEvents = 'auto';
          return;
        }
      }
      await StorageController.remove(problemId);
      btn.classList.remove('is-saved', 'just-saved');
      showToast('Problem removed from tracker', '🗑️');
      btn.style.pointerEvents = 'auto';    } else {
      // Not saved — open modal first, only save after user confirms
      btn.style.pointerEvents = 'auto';
      openCaptureModal(
        async (dbId) => {
          // Confirmed: save to local storage with dbId for future removal
          await StorageController.save({ id: problemId, title: problemTitle, url: window.location.href, platform: config.platform, dbId });
          btn.classList.add('is-saved');
          btn.classList.remove('just-saved');
          void btn.offsetWidth;
          btn.classList.add('just-saved');
        },
        () => { /* Cancelled: icon stays gray */ }
      );
    }
  };

  // 5. Smart injection
  titleEl.appendChild(btn);
}

// ── Floating Capsule Injection ──────────────────────────────

let capsuleRoot = null;

function injectFloatingCapsule(pageType = 'problem') {
  // On problem pages require capsuleEnabled; on hub pages always inject
  if (pageType === 'problem' && activeConfig && !activeConfig.capsuleEnabled) return;
  if (document.getElementById('dsa-tracker-capsule-host')) return;

  const offset = activeConfig?.capsuleOffset || { bottom: 24, right: 24 };
  const capsuleShadow = createShadowHost('dsa-tracker-capsule-host');
  const host = document.getElementById('dsa-tracker-capsule-host');
  host.style.cssText = `all: initial; position: fixed; bottom: ${offset.bottom}px; right: ${offset.right}px; z-index: 2147483647;`;

  const mountPoint = document.createElement('div');
  mountPoint.id = 'capsule-mount';
  capsuleShadow.appendChild(mountPoint);

  capsuleRoot = createRoot(mountPoint);
  capsuleRoot.render(<FloatingCapsule pageType={pageType} />);
}

// ── Cleanup — destroys all injected UI ──────────────────────

function cleanup() {
  capsuleRoot?.unmount();
  capsuleRoot = null;
  document.getElementById('dsa-tracker-capsule-host')?.remove();
  // Remove button AND clear the injection marker so SPA re-navigation can re-inject
  document.querySelectorAll('[data-dsa-injecting]').forEach(el => {
    el.querySelector('.p-bookmark-btn')?.remove();
    delete el.dataset.dsaInjecting;
  });
  captureModalRoot?.unmount();
  captureModalRoot = null;
  document.getElementById('dsa-tracker-modal-host')?.remove();
  captureModalShadow = null;
}

// ── Initialization ─────────────────────────────────────────

async function tryInjectAll() {
  const url = window.location.href;
  const hostname = window.location.hostname;
  const config = detectPlatform(hostname, url);

  if (config) {
    // ── Problem Page: full widget (bookmark button + capsule with rating)
    activeConfig = config;
    injectFloatingCapsule('problem');
    await injectAndSync(config);
  } else if (isKnownHubPage(hostname, url)) {
    // ── Hub/Exploration Page: capsule only (same UI as problem page, no bookmark btn)
    injectFloatingCapsule('problem');
  }
}

let lastUrl = location.href;
let injectTimeout = null;

const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    // URL changed (LeetCode/GFG SPA navigation)
    lastUrl = location.href;
    cleanup();
    setTimeout(() => tryInjectAll(), 500);
  } else {
    // DOM changed — try to inject if title now available
    if (injectTimeout) clearTimeout(injectTimeout);
    injectTimeout = setTimeout(() => tryInjectAll(), 100);
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial run
tryInjectAll();
