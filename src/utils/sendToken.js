const EXTENSION_ID = "fglkieknogcojnbgoflfekplnoafnaip";

function sendTokenToExtension(token) {
  console.log("SENDING TOKEN TO EXTENSION");

  if (!window.chrome?.runtime?.sendMessage) {
    console.error("chrome.runtime not available");
    return;
  }

  chrome.runtime.sendMessage(
    EXTENSION_ID,
    { type: "AUTH_SET_TOKEN", token },
    (response) => {
      console.log("EXTENSION RESPONSE:", response);
      if (chrome.runtime.lastError) {
        console.error("EXTENSION ERROR:", chrome.runtime.lastError.message);
      }
    }
  );
}

export default sendTokenToExtension;