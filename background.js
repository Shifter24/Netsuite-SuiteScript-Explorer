// chrome.runtime.onInstalled.addListener(function () {
//   // Clear storage when the extension is installed or updated
//   chrome.storage.local.clear();
// });

// Clear storage when the window is reloaded
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === "loading" && tab.url === tab.url) {
    chrome.storage.local.clear();
    deleteAllChunksFromIndexedDB();

  }
});

function deleteAllChunksFromIndexedDB() {
  const dbName = "netsuiteFilesDB";
  const storeName = "netsuiteFilesStore";
  const request = indexedDB.open(dbName);

  request.onerror = function (event) {
    console.error("IndexedDB error:", event.target.error);
  };

  request.onsuccess = function (event) {
    const db = event.target.result;
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const clearRequest = store.clear();

    clearRequest.onsuccess = function (event) {
      console.log("All chunks deleted from IndexedDB.");
    };

    clearRequest.onerror = function (event) {
      console.error("Error deleting chunks from IndexedDB:", event.target.error);
    };

    transaction.oncomplete = function (event) {
      db.close();
    };
  };
}