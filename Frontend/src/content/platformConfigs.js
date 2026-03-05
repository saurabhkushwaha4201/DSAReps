/**
 * Platform Configuration — Strategy Pattern
 *
 * Fields:
 *   platform        – lowercase slug stored in DB
 *   host            – hostname fragment for matching
 *   isProblemPage   – function(url) → boolean
 *   titleSelector   – CSS selector to find the problem title element
 *   injectPosition  – insertAdjacentElement position for bookmark icon
 *   titleCleanup    – string/regex stripped from document.title
 *   capsuleEnabled  – whether to inject FloatingCapsule on this site
 *   capsuleOffset   – { bottom, right } in px for capsule positioning
 *   slugIndex       – index in pathname.split('/') for SPA slug detection (null = no SPA)
 */

export const PLATFORM_CONFIGS = {
  leetcode: {
    platform: 'leetcode',
    host: 'leetcode.com',
    isProblemPage: (url) => /\/problems\//.test(url),
    titleSelector: [
      'div[data-cy="question-title"]',
      'a.mr-2.text-lg.font-medium.text-label-1',
      'div.text-title-large a',
      '[class*="text-title-large"]',
      'div.flex-1 > div > a[href*="/problems/"]',
    ],
    injectPosition: 'afterend',
    titleCleanup: '- LeetCode',
    capsuleEnabled: true,
    capsuleOffset: { bottom: 24, right: 24 },
    slugIndex: 2, // /problems/<slug>/...
  },

  cses: {
    platform: 'cses',
    host: 'cses.fi',
    isProblemPage: (url) => /\/problemset\/task\/\d+/.test(url),
    titleSelector: 'div.title-block h1',
    injectPosition: 'afterend',
    titleCleanup: ' - CSES',
    capsuleEnabled: true,
    capsuleOffset: { bottom: 20, right: 20 },
    slugIndex: null,
  },

  codeforces: {
    platform: 'codeforces',
    host: 'codeforces.com',
    isProblemPage: (url) => /\/(problemset|contest|gym)\/.*\/problem\//.test(url),
    titleSelector: '.problem-statement .header .title',
    injectPosition: 'beforeend',
    titleCleanup: ' - Codeforces',
    capsuleEnabled: true,
    capsuleOffset: { bottom: 20, right: 20 },
    slugIndex: null,
  },

  gfg: {
    platform: 'gfg',
    host: 'geeksforgeeks.org',
    isProblemPage: (url) => /\/problems\//.test(url),
    titleSelector: 'div.problems_header_content__title__L2cB2 h3',
    injectPosition: 'afterend',
    titleCleanup: /\s*\|.*$/, // " | GeeksforGeeks" or similar
    capsuleEnabled: true,
    capsuleOffset: { bottom: 20, right: 20 },
    slugIndex: null,
  },
};

/**
 * Detect platform config for the current page.
 * @returns {object|null} - the matching config or null
 */
export function detectPlatform(hostname, url) {
  for (const key in PLATFORM_CONFIGS) {
    const config = PLATFORM_CONFIGS[key];
    if (hostname.includes(config.host) && config.isProblemPage(url)) {
      return config;
    }
  }
  return null;
}

/**
 * Detect platform slug from a URL string (for dashboard/popup use).
 * @param {string} url - full URL
 * @returns {string} - platform key like 'leetcode', 'codeforces', 'cses', 'gfg', 'other'
 */
export function detectPlatformFromUrl(url) {
  try {
    const { hostname, href } = new URL(url);
    const config = detectPlatform(hostname, href);
    return config ? config.platform : 'other';
  } catch {
    return 'other';
  }
}
