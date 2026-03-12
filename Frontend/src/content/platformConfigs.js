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
      'div.text-title-large', 
      'h4.text-title-large',
    ],
    injectPosition: 'beforeend', // LC titles usually have space inside the flex container
    titleCleanup: '- LeetCode',
    capsuleEnabled: true,
    capsuleOffset: { bottom: 24, right: 24 },
    slugIndex: 2,
  },

  cses: {
    platform: 'cses',
    host: 'cses.fi',
    isProblemPage: (url) => /\/problemset\/task\/\d+/.test(url),
    titleSelector: 'div.title-block h1',
    injectPosition: 'afterend',
    titleCleanup: ' - CSES',
    capsuleEnabled: true,
  },

  codeforces: {
    platform: "codeforces",
    host: "codeforces.com",
    isProblemPage: (url) =>
      /\/(problemset\/problem|contest\/\d+\/problem|gym\/\d+\/problem)\//.test(
        url,
      ),
    titleSelector: [
      ".problem-statement .header .title",
      ".problem-statement-title",
      'div[class*="title"] h2',
      'h2[class*="problem-title"]',
      ".header h2",
    ],
    injectPosition: "beforeend",
    titleCleanup: " - Codeforces",
    capsuleEnabled: true,
    capsuleOffset: { bottom: 20, right: 20 },
    slugIndex: null,
  },

  gfg: {
    platform: 'gfg',
    host: 'geeksforgeeks.org',
    isProblemPage: (url) => /\/problems\//.test(url),
    // Image 1 ke hisaab se: Title 'Smallest Subset...' h3 ya div mein hai
    titleSelector: [
      'div[class*="title"] h3', 
      '.problems_header_content__title__L2cB2 h3',
      '.problems_header_content__title h3'
    ],
    injectPosition: 'afterend',
    titleCleanup: / - GeeksforGeeks|GeeksforGeeks$/,
    capsuleEnabled: true,
    capsuleOffset: { bottom: 20, right: 20 },
    slugIndex: null,
  },
};

/**
 * Detect if a URL is a hub/exploration page (problemset listing, study plan, etc.)
 * for a known platform — but NOT a specific problem page.
 * @returns {boolean}
 */
export function isKnownHubPage(hostname, url) {
  if (hostname.includes('leetcode.com')) {
    return (url.includes('/problemset/') || url.includes('/study-plan/'))
      && !url.includes('/problems/');
  }
  if (hostname.includes('codeforces.com')) {
    return url.includes('/problemset') && !/\/problemset\/problem\//.test(url);
  }
  if (hostname.includes('geeksforgeeks.org')) {
    return url.includes('/explore');
  }
  if (hostname.includes('cses.fi')) {
    return url.includes('/problemset/list') || /cses\.fi\/problemset\/?$/.test(url);
  }
  return false;
}

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
    return config ? config.platform : "other";
  } catch {
    return "other";
  }
}
