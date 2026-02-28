(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (!token) {
    console.error('[AuthSuccess] No token found');
    return;
  }

  console.log('[AuthSuccess] Sending token to background');

  chrome.runtime.sendMessage(
    { type: 'AUTH_SET_TOKEN', token },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error('[AuthSuccess] Runtime error:', chrome.runtime.lastError);
        return;
      }

      if (response?.success) {
        console.log('[AuthSuccess] Token stored successfully');
        // window.close();
      } else {
        console.error('[AuthSuccess] Failed to store token', response);
      }
    }
  );
})();
