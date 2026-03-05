console.log('DSA Revision Tracker Content Script Loaded');

// ── Platform Configs (mirror of platformConfigs.js for plain JS) ──
const PLATFORM_CONFIGS = {
  leetcode:    { host: 'leetcode.com',      isProblemPage: (u) => /\/problems\//.test(u),                           titleCleanup: '- LeetCode' },
  codeforces:  { host: 'codeforces.com',    isProblemPage: (u) => /\/(problemset|contest|gym)\/.*\/problem\//.test(u), titleCleanup: ' - Codeforces' },
  cses:        { host: 'cses.fi',           isProblemPage: (u) => /\/problemset\/task\/\d+/.test(u),                   titleCleanup: ' - CSES' },
  gfg:         { host: 'geeksforgeeks.org', isProblemPage: (u) => /\/problems\//.test(u),                            titleCleanup: /\s*\|.*$/ },
};

function getProblemDetails() {
  const url = window.location.href;
  const hostname = window.location.hostname;

  for (const key in PLATFORM_CONFIGS) {
    const config = PLATFORM_CONFIGS[key];
    if (hostname.includes(config.host) && config.isProblemPage(url)) {
      let problemTitle = document.title;
      if (config.titleCleanup instanceof RegExp) {
        problemTitle = problemTitle.replace(config.titleCleanup, '').trim();
      } else {
        problemTitle = problemTitle.replace(config.titleCleanup, '').trim();
      }
      return {
        isValid: true,
        data: { platform: key, problemTitle, url },
      };
    }
  }

  return { isValid: false };
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_PROBLEM_DETAILS') {
    sendResponse(getProblemDetails());
  }
});



