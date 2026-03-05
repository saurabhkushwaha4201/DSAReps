import React from 'react';
import { createRoot } from 'react-dom/client';
import CaptureModal from './CaptureModal';
import FloatingCapsule from './FloatingCapsule';
import { detectPlatform } from './platformConfigs';

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

const BOOKMARK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" 
     fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
</svg>`;

let captureModalRoot = null;
let captureModalShadow = null;

function openCaptureModal() {
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
      onClose={() => {
        captureModalRoot.unmount();
        captureModalShadow.innerHTML = '';
        captureModalRoot = null;
      }}
    />
  );
}

function injectBookmarkIcon() {
  if (document.querySelector('#dsa-tracker-bookmark-btn')) return false;
  if (!activeConfig?.titleSelector) return false;

  // Resolve title element from config selector(s)
  let titleElement = null;
  try {
    const selectors = Array.isArray(activeConfig.titleSelector)
      ? activeConfig.titleSelector
      : [activeConfig.titleSelector];

    for (const sel of selectors) {
      titleElement = document.querySelector(sel);
      if (titleElement) break;
    }
  } catch {
    // Selector parse error — fail silently
    return false;
  }

  if (!titleElement) return false;

  const btn = document.createElement('button');
  btn.id = 'dsa-tracker-bookmark-btn';
  btn.innerHTML = BOOKMARK_SVG;
  btn.title = 'Save to DSA Revision Tracker';
  btn.style.cssText = `
    all: unset;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    color: #6366f1;
    margin-left: 8px;
    vertical-align: middle;
    transition: background 0.15s, color 0.15s;
  `;

  btn.addEventListener('mouseenter', () => {
    btn.style.background = 'rgba(99, 102, 241, 0.12)';
    btn.style.color = '#4f46e5';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.background = 'transparent';
    btn.style.color = '#6366f1';
  });

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openCaptureModal();
  });

  // Use config.injectPosition to place the bookmark
  const position = activeConfig.injectPosition || 'afterend';
  try {
    titleElement.insertAdjacentElement(position, btn);
  } catch {
    // Fallback: append next to title
    titleElement.parentElement?.insertBefore(btn, titleElement.nextSibling);
  }
  return true;
}

// ── Floating Capsule Injection ──────────────────────────────

let capsuleRoot = null;

function injectFloatingCapsule() {
  if (!activeConfig?.capsuleEnabled) return;
  if (document.getElementById('dsa-tracker-capsule-host')) return;

  const offset = activeConfig.capsuleOffset || { bottom: 24, right: 24 };
  const capsuleShadow = createShadowHost('dsa-tracker-capsule-host');
  const host = document.getElementById('dsa-tracker-capsule-host');
  host.style.cssText = `all: initial; position: fixed; bottom: ${offset.bottom}px; right: ${offset.right}px; z-index: 2147483647;`;

  const mountPoint = document.createElement('div');
  mountPoint.id = 'capsule-mount';
  capsuleShadow.appendChild(mountPoint);

  capsuleRoot = createRoot(mountPoint);
  capsuleRoot.render(<FloatingCapsule />);
}

// ── Cleanup — destroys all injected UI ──────────────────────

function cleanup() {
  capsuleRoot?.unmount();
  capsuleRoot = null;
  document.getElementById('dsa-tracker-capsule-host')?.remove();
  document.querySelector('#dsa-tracker-bookmark-btn')?.remove();
  captureModalRoot?.unmount();
  captureModalRoot = null;
  document.getElementById('dsa-tracker-modal-host')?.remove();
  captureModalShadow = null;
}

// ── Initialization with MutationObserver ────────────────────

let injectionAttempts = 0;
const MAX_ATTEMPTS = 50;

function tryInject() {
  const details = getProblemDetails();
  if (!details.isValid) return false;

  // Try injecting bookmark icon — works for all platforms with titleSelector
  const bookmarkDone = injectBookmarkIcon();

  // For platforms without a title element yet, keep retrying
  // But once bookmark is placed (or platform has no selector), inject capsule
  if (bookmarkDone || !activeConfig?.titleSelector) {
    injectFloatingCapsule();
    return true;
  }

  return false;
}

// Initial try
if (!tryInject()) {
  const observer = new MutationObserver(() => {
    injectionAttempts++;
    if (tryInject() || injectionAttempts > MAX_ATTEMPTS) {
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// ── SPA Routing Armor (LeetCode only) ───────────────────────
// CSES + Codeforces do full page reloads — no SPA logic needed.
// Only LeetCode uses client-side routing, so the URL observer is
// scoped to leetcode only. Slug-based detection avoids flicker
// when switching between /description /editorial /submissions tabs.

if (activeConfig?.platform === 'leetcode') {
  function extractSlug() {
    const idx = activeConfig.slugIndex;
    if (!idx) return location.pathname;
    return location.pathname.split('/')[idx] || location.pathname;
  }

  let currentSlug = extractSlug();
  let lastUrl = location.href;

  const urlObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;

      const newSlug = extractSlug();
      if (newSlug !== currentSlug) {
        currentSlug = newSlug;
        cleanup();
        injectionAttempts = 0;
        setTimeout(() => tryInject(), 500);
      }
    }
  });

  urlObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
