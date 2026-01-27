import { useEffect } from 'react';

export default function AuthSuccess() {
  useEffect(() => {
    console.log('[AuthSuccess] Page Mounted');

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    console.log('[AuthSuccess] Token present in URL?', !!token);

    if (!token) return;

    // We use the ID from the URL or fallback to the known ID
    // Note: Ideally dynamically detect, but for local dev this is fine.
    const EXTENSION_ID = 'fglkieknogcojnbgoflfekplnoafnaip';

    console.log('[AuthSuccess] Sending AUTH_SUCCESS message to extension:', EXTENSION_ID);

    // Check if chrome runtime is available (only works if externally_connectable matches this domain)
    if (window.chrome && window.chrome.runtime) {
      window.chrome.runtime.sendMessage(
        EXTENSION_ID,
        { type: 'AUTH_SUCCESS', token },
        (response) => {
          console.log('[AuthSuccess] Extension response:', response);
          if (response?.success) {
            window.close();
          }
        }
      );
    } else {
      console.error('[AuthSuccess] chrome.runtime not found. Is externally_connectable configured?');
    }
  }, []);

  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h2>✅ Login Successful</h2>
      <p>You can close this tab.</p>
    </div>
  );
}
