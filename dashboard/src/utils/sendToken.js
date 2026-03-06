const EXTENSION_ID = "fglkieknogcojnbgoflfekplnoafnaip";

function sendTokenToExtension(token) {
  console.log("SAVING TOKEN TO LOCALSTORAGE");
  // Always store in localStorage (works in dashboard context)
  localStorage.setItem("token", token);

  // Try to also send to extension if available (for background script)
  if (window.chrome?.runtime?.sendMessage) {
    console.log("SENDING TOKEN TO EXTENSION");
    chrome.runtime.sendMessage(
      EXTENSION_ID,
      { type: "AUTH_SET_TOKEN", token },
      (response) => {
        if (chrome.runtime.lastError) {
          console.warn("Extension not available:", chrome.runtime.lastError.message);
        } else {
          console.log("EXTENSION RESPONSE:", response);
        }
      }
    );
  } else {
    console.log("Extension context not available (normal for dashboard)");
  }
}

export default sendTokenToExtension;