chrome.runtime.onInstalled.addListener(function () {
  // Clear storage when the extension is installed or updated
  chrome.storage.local.clear();
});

// Clear storage when the window is reloaded
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === "loading" && tab.url === tab.url) {
    chrome.storage.local.clear();
  }
});