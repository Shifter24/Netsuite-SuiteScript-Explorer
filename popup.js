const $extensionContainer = document.querySelector(".extension-container");
const $getFilesBtn = document.getElementById("get-files-netsuite");
const $querySearch = document.getElementById("query-search");
const $bodyShowFiles = document.getElementById("body-show-files");
const $loader = document.querySelector(".lds-ring");
const $totalResults = document.getElementById("total-results");
const $wholeWordFilter = document.getElementsByName("switch-whole-word")[0];

// Copy to clipboard
const copyToClipboard = document.getElementById('copyToClipboard');
const copyToClipboardStatic = document.getElementById('copyToClipboardStatic');
const copyToClipboardGif = document.getElementById('copyToClipboardGif');

let netsuiteFilesCopy = [];

// Only show functionality when we are in netsuite page
document.addEventListener('DOMContentLoaded', function () {

    // Hide copy to clipboard btn
    copyToClipboard.style.display = 'none';
});

$getFilesBtn.addEventListener("click", async () => {
    debugger;

    showLoader();

    // Hide copy to clipboard btn
    copyToClipboard.style.display = 'none';

    const queryToSearch = $querySearch.value;
    if (!queryToSearch) {
        alert("Insert field to search!.");
        closeLoader();
        return;
    }

    const tabId = await getActiveTabId();

    // Get array files from indexedDB
    const [filesArray] = await retrieveChunksFromIndexedDB();

    if (!filesArray || filesArray.length === 0) {
        const responseExecute = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["content-script.js"]
        });
    }
    else {

        // Get netsuite domain from storage
        const {netsuiteDomain} = await chrome.storage.local.get("netsuiteDomain");

        searchFiles(filesArray, queryToSearch, netsuiteDomain);
    }

});

// Copy to clipboard btn
copyToClipboard.addEventListener('click', async function () {

    await setCopyToClipboard(JSON.stringify(netsuiteFilesCopy));

    copyToClipboardStatic.style.display = 'none';
    copyToClipboardGif.style.display = 'block';

    setTimeout(function () {
        copyToClipboardStatic.style.display = 'block';
        copyToClipboardGif.style.display = 'none';
    }, 1000);
});

// -------------------- AUXILIAR FUNCTIONS ------------------------------------

function showLoader() {
    $loader.style.display = "flex";
}

function closeLoader() {
    $loader.style.display = "none";
}

async function getActiveTabId() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs.length > 0) {
                resolve(tabs[0].id);
            } else {
                reject(new Error("Unable to retrieve active tab ID."));
            }
        });
    });
}

function showNetsuiteFiles(filteredFiles) {
    $bodyShowFiles.innerHTML = "";
    $totalResults.innerHTML = "0";
    $totalResults.innerHTML = filteredFiles.length;

    if (!filteredFiles || filteredFiles.length < 1) {
        $bodyShowFiles.innerHTML = `
            <tr><td></td></tr>
            <tr><td></td></tr>
            <tr><td></td></tr>
            <tr>
                <td colspan="4" style="text-align: center;">No results found</td>
            </tr> 
        `
    }
    else {
        filteredFiles.forEach(file => {
            $bodyShowFiles.innerHTML += `
                <tr>
                    <td>${file.name}</td>
                    <td>${file.folder}</td>
                    <td>${file.count} ${(file.count == 1 ? 'time' : 'times')}</td>
                    <td><a href="${file.url}" target="_blank"><svg xmlns="http://www.w3.org/2000/svg"
                        class="icon icon-tabler icon-tabler-file-search" width="30" height="30"
                        viewBox="0 0 24 24" stroke-width="0.8" stroke="#2c3e50" fill="none"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                        <path d="M12 21h-5a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v4.5" />
                        <path d="M16.5 17.5m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0" />
                        <path d="M18.5 19.5l2.5 2.5" />
                        </svg></a></td>
                </tr> 
            `
        });
    }

}

async function getFilesQuery(netsuiteFiles, domain, queryToSearch) {
    try {
        if (!netsuiteFiles || netsuiteFiles.length < 1) return [];

        const files = await Promise.all(
            netsuiteFiles.filter(file => {
                return true;
            }).map(async file => {
                const fileName = file.name;
                const urlOpen = domain + file.url;
                const fileContent = await getFileContent(urlOpen);
                if (!fileContent) return;

                const url = new URL(urlOpen);
                const searchParams = new URLSearchParams(url.search);
                const id = searchParams.get("id");
                const mediaItemUrl = domain + `/app/common/media/mediaitem.nl?id=${id}`;

                // Find word inside fileContent
                var regex = "";

                // If checkbox filter is checked, search for whole word, else search for all matches
                ($wholeWordFilter.checked) ? regex = new RegExp('\\b' + queryToSearch + '\\b', 'gi') : regex = new RegExp(queryToSearch, 'gi');

                var matches = fileContent.match(regex);
                var count = matches ? matches.length : 0;
                if (!count || count < 1) return null;

                return { name: fileName, folder: file.folder, url: mediaItemUrl, count };
            })
        );

        return files.filter(Boolean);
    } catch (error) {
        closeLoader();
        return [];
    }
}

async function getFileContent(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;

        const content = await response.text();
        return content;

    } catch (error) {
        return null;
    }
}

async function setCopyToClipboard(text) {
    await navigator.clipboard.writeText(text);
}

// -------------------- CHROME EXTENSION FUNCTIONS ----------------------------

// Listen for content-script response in order to save gathered files
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    debugger;
    if (!message.hasOwnProperty("netsuiteFiles") || !message.hasOwnProperty("domain")) {
        closeLoader();
        return;
    }

    const queryToSearch = $querySearch.value;
    if (!queryToSearch) {
        alert("Insert field to search!.");
        closeLoader();
        return;
    }

    // Clear storage
    chrome.storage.local.clear();

    // Save files into indexedDB
    saveChunkToIndexedDB(message.netsuiteFiles, 0);

    // Saving domain
    chrome.storage.local.set({ netsuiteDomain: message.domain });

    await searchFiles(message.netsuiteFiles, queryToSearch, message.domain);
});

async function searchFiles(netsuiteFiles, queryToSearch, netsuiteDomain) {

    if (!netsuiteFiles || netsuiteFiles.length < 1) {
        closeLoader();
        return;
    }

    if (!netsuiteDomain) {
        closeLoader();
        return;
    }

    const formattedNetsuiteFiles = await getFilesQuery(netsuiteFiles, netsuiteDomain, queryToSearch);

    showNetsuiteFiles(formattedNetsuiteFiles);

    netsuiteFilesCopy = formattedNetsuiteFiles;

    if (netsuiteFilesCopy.length > 0) {
        copyToClipboard.style.display = 'block';
    }

    closeLoader();
}

// Set chrome storage local chunks spliting files array
function divideFilesArrayStorage(filesArray) {
    const divideSize = 1000;
    const divided = Math.ceil(filesArray.length / divideSize);

    let start = 0;
    let end = divideSize;

    for (let i = 0; i < divided; i++) {
        const chunk = filesArray.slice(start, end);
        saveChunkToIndexedDB(chunk, i + 1);
        start = end;
        end += divideSize;
    }
}

async function retrieveChunksFromIndexedDB() {
    const dbName = "netsuiteFilesDB";
    const storeName = "netsuiteFilesStore";
    const request = indexedDB.open(dbName);

    return new Promise((resolve, reject) => {
        request.onerror = function (event) {
            console.error("IndexedDB error:", event.target.error);
            reject([]);
        };

        request.onsuccess = function (event) {
            const db = event.target.result;
            const transaction = db.transaction(storeName, "readonly");
            const store = transaction.objectStore(storeName);
            const chunks = [];

            const cursorRequest = store.openCursor();
            cursorRequest.onsuccess = function (event) {
                const cursor = event.target.result;
                if (cursor) {
                    const chunkObject = cursor.value;
                    chunks.push(chunkObject.data);
                    cursor.continue();
                } else {
                    resolve(chunks);
                }
            };

            transaction.oncomplete = function (event) {
                db.close();
            };
        };
    });
}

function saveChunkToIndexedDB(chunk, chunkIndex) {
    const dbName = "netsuiteFilesDB";
    const storeName = "netsuiteFilesStore";
    const request = indexedDB.open(dbName);

    request.onerror = function (event) {
        console.error("IndexedDB error:", event.target.error);
    };

    request.onupgradeneeded = function (event) {
        const db = event.target.result;
        const store = db.createObjectStore(storeName, { keyPath: "id" });
        store.createIndex("chunkIndex", "chunkIndex", { unique: false });
    };

    request.onsuccess = function (event) {
        const db = event.target.result;
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);

        const getRequest = store.get(chunkIndex);

        getRequest.onsuccess = function (event) {
            const existingChunk = event.target.result;
            if (existingChunk) {
                console.log(`Chunk ${chunkIndex} already exists in IndexedDB.`);
                // Handle the case when the chunk already exists
            } else {
                const chunkObject = {
                    id: chunkIndex,
                    data: chunk,
                };

                const addRequest = store.add(chunkObject);

                addRequest.onsuccess = function (event) {
                    console.log(`Chunk ${chunkIndex} saved to IndexedDB.`);
                    // Handle the case when the chunk is successfully added
                };

                addRequest.onerror = function (event) {
                    console.error("Error saving chunk to IndexedDB:", event.target.error);
                    // Handle the error case when adding the chunk fails
                };
            }
        };

        transaction.oncomplete = function (event) {
            db.close();
        };
    };
}

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