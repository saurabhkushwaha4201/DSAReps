console.log('DSA Revision Tracker Content Script Loaded');

function getProblemDetails() {
  const url = window.location.href;
  const hostname = window.location.hostname;
  let platform = '';
  let problemTitle = document.title;

  if (hostname.includes('leetcode.com') && url.includes('/problems/')) {
    platform = 'leetcode'; // ✅ lowercase
    problemTitle = problemTitle.replace('- LeetCode', '').trim();
  } 
  else if (hostname.includes('codeforces.com') && url.includes('/problem/')) {
    platform = 'codeforces'; // ✅ lowercase
    problemTitle = problemTitle.replace(' - Codeforces', '').trim();
  }

  if (platform) {
    return {
      isValid: true,
      data: {
        platform,
        problemTitle,
        url // ✅ EXACT FIELD NAME
      }
    };
  }

  return { isValid: false };
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_PROBLEM_DETAILS') {
    const details = getProblemDetails();
    sendResponse(details);
  }
});



