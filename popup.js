const $extensionContainer = document.querySelector(".extension-container");
const $searchMagnifier = document.getElementById("search-magnifier");
const $querySearch = document.getElementById("query-search");
const $bodyShowFiles = document.getElementById("body-show-files");
const $loader = document.querySelector(".lds-ring");
const $totalResults = document.getElementById("total-results");
const $wholeWordFilter = document.getElementsByName("switch-whole-word")[0];
const $containerFiltertotal = document.querySelector(".container-filter-total");
const $containerShowFiles = document.querySelector(".container-show-files");
const $containerExportOpen = document.querySelector(".export-open-container");
const $openFilesBtn = document.querySelector(".open-files-btn");
const $checkboxesFiles = document.querySelectorAll(".checkbox-round");
const $filesNotFound = document.querySelector(".files-not-found");
const $pleaseSearch = document.querySelector(".please-search");
// Script Type Filter
const $selectTypeFilter = document.getElementById("type-script-filter");

// Copy to clipboard
const copyToClipboard = document.getElementById('copyToClipboard');
const copyToClipboardStatic = document.getElementById('copyToClipboardStatic');
const copyToClipboardGif = document.getElementById('copyToClipboardGif');

let netsuiteFilesCopy = [];
let filteredItemsByType = [];

// Only show functionality when we are in netsuite page
document.addEventListener('DOMContentLoaded', function () {

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        var currentUrl = tabs[0].url;
        var allowedUrl = "netsuite.com/app";

        if (!currentUrl.includes(allowedUrl)) {
            $extensionContainer.style.display = 'none';
            document.body.style.width = '210px';
            document.body.style.height = '80px';
            body.innerHTML = `
                <div class="not-netsuite-container">
                    <h1>Not in Netsuite</h1>
                </div>
            `;
        }
    });
});


// -------------------- CHECKBOCK OPEN FUNCTIONALITY ------------------------------------

document.addEventListener('click', function (e) {

    if (!e.target.classList.contains('checkbox-round')) return;

    // Bring all checkbox and check if there are any checked
    const $checkboxesFiles = document.querySelectorAll(".checkbox-round");

    // If some checkbox contains checked then show btn open files
    let isAnyChecked = $checkboxesFiles.length > 0 ? Array.from($checkboxesFiles).some(checkbox => checkbox.checked) : false;

    if(isAnyChecked) {
        $openFilesBtn.style.display = 'block';
        return;
    }

    // Hide open files btn
    $openFilesBtn.style.display = 'none';
});


$openFilesBtn.addEventListener('click', function () {

    // Open several files functionality
    const $checkboxesFiles = document.querySelectorAll(".checkbox-round");
    if (!$checkboxesFiles || $checkboxesFiles.length === 0) {
        alert("There are no files to open.");
        return;
    }

    $checkboxesFiles.forEach(checkbox => {
        if (checkbox.checked) {
            const url = checkbox.dataset.url;

            window.open(url, '_blank');
        }
    });

});

// ------------------------------------------------ ------------------------------------

// Filter type
$selectTypeFilter.addEventListener("change", () => {

    showLoader();

    const typeScript = $selectTypeFilter.value;
    if (!typeScript) {
        closeLoader();
        return;
    }

    // If filter by type is all, show all files
    if (typeScript == -1) {
        filteredItemsByType = [];
        showNetsuiteFiles(netsuiteFilesCopy);
        closeLoader();
        return;
    }

    const filteredFiles = netsuiteFilesCopy.filter(file => {
        const fileType = (file.script ? file.script.scripttype : 'File');

        return fileType == typeScript;
    });

    showNetsuiteFiles(filteredFiles, typeScript);

    filteredItemsByType = filteredFiles;

    closeLoader();
});

// Handle button click event
$searchMagnifier.addEventListener("click", async () => {
    $querySearch.blur();
    await triggerFunctionality();
});

// Handle Enter key press event
$querySearch.addEventListener("keyup", async (event) => {

    if (event.key == "Enter") {
        $querySearch.blur();
        await triggerFunctionality();
    }
});

// Copy to clipboard btn
// copyToClipboard.addEventListener('click', async function () {

//     const itemsToCopy = filteredItemsByType.length > 0 ? filteredItemsByType : netsuiteFilesCopy;

//     await setCopyToClipboard(JSON.stringify(itemsToCopy));

//     copyToClipboardStatic.style.display = 'none';
//     copyToClipboardGif.style.display = 'block';

//     setTimeout(function () {
//         copyToClipboardStatic.style.display = 'block';
//         copyToClipboardGif.style.display = 'none';
//     }, 1000);
// });

// -------------------- AUXILIAR FUNCTIONS ------------------------------------

async function triggerFunctionality() {
    showLoader();

    // Hide copy to clipboard btn
    // copyToClipboard.style.display = 'none';
    $filesNotFound.style.display = "none";
    $containerFiltertotal.style.display = 'none';
    $containerExportOpen.style.display = 'none';
    $pleaseSearch.style.display = 'none';

    const queryToSearch = $querySearch.value;
    if (!queryToSearch) {
        alert("Insert field to search!.");
        closeLoader();
        return;
    }

    const tabId = await getActiveTabId();

    // Get array files from indexedDB
    const [filesArray] = await retrieveChunksFromIndexedDB();

    const netsuiteDomain = await getNetsuiteDomain();

    if (!filesArray || filesArray.length === 0) {
        const responseExecute = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["content-script.js"]
        });
    }
    else {
        searchFiles(filesArray, queryToSearch, netsuiteDomain);
    }
}

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

function showNetsuiteFiles(filteredFiles, filterType = false) {
    $bodyShowFiles.innerHTML = "";
    $totalResults.innerHTML = "0";
    $totalResults.innerHTML = filteredFiles.length;

    if (!filteredFiles || filteredFiles.length < 1) {
        $filesNotFound.style.display = "flex";
        $containerShowFiles.style.overflowY = "hidden";
    }
    else {
        // Get unique type script
        let fileTypesSet = new Set();
        let fileType = null;
        let fileTypesArray = [];

        filteredFiles.forEach(file => {

            if (!filterType) {
                // Filter type
                fileType = (file.script ? file.script.scripttype : 'File');
                fileTypesSet.add(fileType);
            }

            let icon;

            if (file?.script?.scripttype) {
                icon = `<svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 35 35" fill="none">
                <g clip-path="url(#clip0_19_169)">
                    <path
                        d="M20.4166 4.375V10.2083C20.4166 10.5951 20.5703 10.966 20.8438 11.2395C21.1173 11.513 21.4882 11.6667 21.875 11.6667H27.7083"
                        stroke="#86868A" stroke-width="1.83333" stroke-linecap="round"
                        stroke-linejoin="round" />
                    <path
                        d="M24.7916 30.625H10.2083C9.43474 30.625 8.69288 30.3177 8.1459 29.7707C7.59892 29.2237 7.29163 28.4819 7.29163 27.7083V7.29167C7.29163 6.51812 7.59892 5.77625 8.1459 5.22927C8.69288 4.68229 9.43474 4.375 10.2083 4.375H20.4166L27.7083 11.6667V27.7083C27.7083 28.4819 27.401 29.2237 26.854 29.7707C26.307 30.3177 25.5652 30.625 24.7916 30.625Z"
                        fill="#86868A" stroke="#86868A" stroke-width="1.83333" stroke-linecap="round"
                        stroke-linejoin="round" />
                    <path d="M14.5833 18.9583L13.125 21.875L14.5833 24.7917" stroke="#333333"
                        stroke-width="1.83333" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M20.4166 18.9583L21.875 21.875L20.4166 24.7917" stroke="#333333"
                        stroke-width="1.83333" stroke-linecap="round" stroke-linejoin="round" />
                </g>
                <defs>
                    <clipPath id="clip0_19_169">
                        <rect width="35" height="35" fill="white" />
                    </clipPath>
                </defs>
            </svg>`
            }
            else {
                icon = `
                <svg xmlns="http://www.w3.org/2000/svg" width="35" height="35" viewBox="0 0 35 35" fill="none">
                <g clip-path="url(#clip0_25_71)">
                <path d="M20.4166 4.375V10.2083C20.4166 10.5951 20.5703 10.966 20.8438 11.2395C21.1173 11.513 21.4882 11.6667 21.875 11.6667H27.7083" stroke="#333333" stroke-width="1.83333" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M24.7916 30.625H10.2083C9.43474 30.625 8.69288 30.3177 8.1459 29.7707C7.59892 29.2237 7.29163 28.4819 7.29163 27.7083V7.29167C7.29163 6.51812 7.59892 5.77625 8.1459 5.22927C8.69288 4.68229 9.43474 4.375 10.2083 4.375H20.4166L27.7083 11.6667V27.7083C27.7083 28.4819 27.401 29.2237 26.854 29.7707C26.307 30.3177 25.5652 30.625 24.7916 30.625Z" fill="#86868A" stroke="#86868A" stroke-width="1.83333" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M13.125 24.7917H21.875" stroke="#333333" stroke-width="1.83333" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M13.125 18.9583H21.875" stroke="#333333" stroke-width="1.83333" stroke-linecap="round" stroke-linejoin="round"/>
                </g>
                <defs>
                <clipPath id="clip0_25_71">
                <rect width="35" height="35" fill="white"/>
                </clipPath>
                </defs>
                </svg>
                `
            }

            $bodyShowFiles.innerHTML += `
                    <div class="file-container">
                        <!-- Icon file -->
                        <div class="icon-file">
                            ${icon}
                        </div>
                        <!-- File name and folder -->
                        <div class="file-name-folder">
                            <p>${(file.script ? file.script.name : file.name)}</p>
                            <p style="color: #87878B;">./<span>${file.folder}</span></p>
                        </div>
    
                        <!-- Script Type -->
                        <div class="script-type">
                            <p>${(file.script ? file.script.scripttype : 'File')}</p>
                        </div>
    
                        <!-- Checkbox -->
                        <input data-url="${file?.url}" type="checkbox" class="checkbox-round"/>
                    </div>
            `;
        });

        if (!filterType) {
            fileTypesArray = Array.from(fileTypesSet);

            // Fill select with type as an option
            $selectTypeFilter.innerHTML = `
            <option value="-1">All</option>
            ${fileTypesArray.map(type => `<option value="${type}">${type}</option>`).join('')}
        `;
        }

        $containerShowFiles.style.overflowY = "hidden";

        if (filteredFiles.length > 0) {
            $containerExportOpen.style.display = "flex";
            $containerFiltertotal.style.display = "flex";

            if (filteredFiles.length > 4) {
                $containerShowFiles.style.overflowY = "scroll";
            }
        }
    }

}

async function getFilteredFiles(netsuiteFiles, domain, queryToSearch) {
    try {
        if (!netsuiteFiles || netsuiteFiles.length < 1) return [];

        const filteredFiles = [];

        netsuiteFiles.forEach(file => {
            const fileContent = file.content;

            const regex = ($wholeWordFilter.checked) ? new RegExp('\\b' + queryToSearch + '\\b', 'gi') : new RegExp(queryToSearch, 'gi');
            const matches = fileContent.match(regex);
            const count = matches ? matches.length : 0;

            const mediaItemUrl = (file.script ? `https://${domain}/app/common/scripting/script.nl?id=${file.script.scriptId}` : `https://${domain}/app/common/media/mediaitem.nl?id=${file.internalid}`);

            if (count > 0) {
                filteredFiles.push({ id: file.internalid, name: file.name, folder: file.folder, url: mediaItemUrl, count: count, script: file.script || null });
            }
        });

        return filteredFiles;

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

function delayExecution(delay) {
    return new Promise((resolve) => setTimeout(resolve, delay));
}

async function setCopyToClipboard(text) {
    await navigator.clipboard.writeText(text);
}

async function getNetsuiteDomain() {
    var url = await getCurrentTabUrl();
    if (!url) return null;

    var domain = url.split('/')[2];

    return domain;
}

function getCurrentTabUrl() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs.length > 0) {
                resolve(tabs[0].url);
            } else {
                reject(new Error("Unable to retrieve active tab URL."));
            }
        });
    });
}

// -------------------- CHROME EXTENSION FUNCTIONS ----------------------------

// Listen for content-script response in order to save gathered files
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {

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

    // Add file content to files in order to save into indexedDB
    message.netsuiteFiles = await addFileContent(message.netsuiteFiles, message.domain, 1000);

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

    const formattedNetsuiteFiles = await getFilteredFiles(netsuiteFiles, netsuiteDomain, queryToSearch);

    showNetsuiteFiles(formattedNetsuiteFiles);

    netsuiteFilesCopy = formattedNetsuiteFiles;

    closeLoader();
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

            // Check if storeName exists before retrieving chunks
            if (!db.objectStoreNames.contains(storeName)) {
                resolve([]); // Return empty array if storeName does not exist
                db.close(); // Close the database connection
                return;
            }

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
    const version = Date.now();
    const request = indexedDB.open(dbName, version);

    request.onerror = function (event) {
        console.error("IndexedDB error:", event.target.error);
    };

    request.onupgradeneeded = function (event) {
        const db = event.target.result;

        // Create the object store if it doesn't exist
        if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: "id" });
            store.createIndex("chunkIndex", "chunkIndex", { unique: false });
        }
    };

    request.onsuccess = function (event) {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(storeName)) {
            console.error("Object store not found:", storeName);
            db.close();
            return;
        }

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

        // Check if storeName exists before deleting
        if (!db.objectStoreNames.contains(storeName)) {
            return; // Exit the function or handle the situation accordingly
        }

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

async function addFileContent(netsuiteFiles, domain, batchSize = 1000) {
    const totalFiles = netsuiteFiles.length;
    let processedFiles = 0;
    let resultFiles = [];

    while (processedFiles < totalFiles) {
        const batchFiles = netsuiteFiles.slice(processedFiles, processedFiles + batchSize);

        const batchRequests = batchFiles.map(async (file) => {
            const urlOpen = domain + file.url;

            // Only search fetch file content if first time running else use file content from indexedDB
            const fileContent = await getFileContent(urlOpen);

            file.content = fileContent;

            return file;
        });

        const batchResults = await Promise.all(batchRequests);
        const batchFilesFiltered = batchResults.filter(Boolean);

        resultFiles = resultFiles.concat(batchFilesFiltered);
        processedFiles += batchFiles.length;
    }

    return resultFiles;
}