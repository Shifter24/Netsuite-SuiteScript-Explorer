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

// Exports
const $exportJson = document.getElementById("export-to-json");
const $exportTxt = document.getElementById("export-to-txt");
const $exportCsv = document.getElementById("export-to-csv");

// Script Type Filter
const $selectTypeFilter = document.getElementById("type-script-filter");

let netsuiteFilesCopy = [];
let filteredItemsByType = [];

// -------------------- CHECKBOCK OPEN FUNCTIONALITY ------------------------------------

document.addEventListener('click', function (e) {

    if (!e.target.classList.contains('checkbox-round')) return;

    // Bring all checkbox and check if there are any checked
    const $checkboxesFiles = document.querySelectorAll(".checkbox-round");

    // If some checkbox contains checked then show btn open files
    let isAnyChecked = $checkboxesFiles.length > 0 ? Array.from($checkboxesFiles).some(checkbox => checkbox.checked) : false;

    if (isAnyChecked) {
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
$selectTypeFilter.addEventListener("change", async () => {

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

    await showNetsuiteFiles(filteredFiles, typeScript);

    filteredItemsByType = filteredFiles;

    closeLoader();
});

// Handle button click event
$searchMagnifier.addEventListener("click", async (event) => {
    event.preventDefault();
    $querySearch.blur();
    await triggerFunctionality();
});

// Handle Enter key press event
$querySearch.addEventListener("keyup", async (event) => {

    event.preventDefault();

    if (event.key == "Enter") {
        $querySearch.blur();
        await triggerFunctionality();
    }
});

// -------------------- AUXILIAR FUNCTIONS ------------------------------------

async function triggerFunctionality() {
    showLoader();

    $filesNotFound.style.display = "none";
    $containerFiltertotal.style.display = 'none';
    $containerExportOpen.style.display = 'none';

    const queryToSearch = $querySearch.value;
    if (!queryToSearch) {
        alert("Insert field to search!.");
        closeLoader();
        return;
    }

    $pleaseSearch.style.display = 'none';

    const tabId = await getActiveTabId();

    const responseExecute = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["content-script.js"]
    });
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

async function showNetsuiteFiles(filteredFiles, filterType = false) {
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

            // Exports files
            makeExportFiles(filteredFiles);
            // --------------------------

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

            const mediaItemUrl = (file.script ? `https://${domain}/app/common/scripting/script.nl?id=${file.script.scriptId}` : `https://${domain}/app/common/media/mediaitem.nl?id=${file.id}`);

            if (count > 0) {
                filteredFiles.push({ id: file.id, name: file.name, folder: file.folder, url: mediaItemUrl, count: count, script: file.script || null });
            }
        });

        return filteredFiles;

    } catch (error) {
        closeLoader();
        return [];
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

function makeExportFiles(filteredFiles) {
    const stringFiles = JSON.stringify(filteredFiles);

    // JSON
    const blobJson = new Blob([stringFiles], { type: "application/json" });
    const urlJson = URL.createObjectURL(blobJson);

    $exportJson.setAttribute("href", urlJson);
    $exportJson.setAttribute("download", `files_${$querySearch.value}.json`);

    // TXT
    const blobTxt = new Blob([stringFiles], { type: "text/plain" });
    const urlTxt = URL.createObjectURL(blobTxt);

    $exportTxt.setAttribute("href", urlTxt);
    $exportTxt.setAttribute("download", `files_${$querySearch.value}.txt`);

    // CSV
    // Prepare CSV header
    const csvHeader = Object.keys(filteredFiles[0]).join(',');

    // Prepare CSV data rows
    const csvRows = filteredFiles.map(file => {
        const values = Object.values(file).map(value => {
            if (typeof value === 'object') {
                return JSON.stringify(value);
            }
            return value;
        });
        return values.join(',');
    });

    // Combine header and rows
    const csvContent = csvHeader + '\n' + csvRows.join('\n');

    // Create a Blob object
    const blobCsv = new Blob([csvContent], { type: 'text/csv' });

    // Generate a URL for the Blob
    const urlCsv = URL.createObjectURL(blobCsv);

    $exportCsv.setAttribute("href", urlCsv);
    $exportCsv.setAttribute("download", `files_${$querySearch.value}.csv`);

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

    // ----------------- COMPARE IF THERE ARE NEW FILES ----------------------------

    const netsuiteFilesDB = await getFilesDB(message.domain);

    // If there are files stored into db, we are going to look for changes in files
    if (netsuiteFilesDB && netsuiteFilesDB?.length > 0) {
        message.netsuiteFiles = await getFilesChanged(message.netsuiteFiles, netsuiteFilesDB, message.domain);

        // Save files into indexedDB
        saveFilesDB(message.netsuiteFiles, message.domain);

        await searchFiles(message.netsuiteFiles, queryToSearch, message.domain);
    }
    else {

        // Add file content to files in order to save into indexedDB
        message.netsuiteFiles = await addFileContent(message.netsuiteFiles, message.domain, 800);

        // Save files into indexedDB
        saveFilesDB(message.netsuiteFiles, message.domain);

        await searchFiles(message.netsuiteFiles, queryToSearch, message.domain);
    }

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

function getFilesDB(domain) {
    return new Promise((resolve, reject) => {
        const dbName = 'netsuiteFilesDB';
        const objectStoreName = 'netsuiteFilesStore';

        const request = indexedDB.open(dbName);

        request.onerror = (event) => {
            reject(new Error('Failed to open database: ' + event.target.errorCode));
        };

        request.onsuccess = (event) => {
            const db = event.target.result;

            if (!db.objectStoreNames.contains(objectStoreName)) {
                resolve(null);
                db.close();
                return;
            }


            const transaction = db.transaction(objectStoreName, 'readonly');
            const store = transaction.objectStore(objectStoreName);

            const getRequest = store.get(domain);

            getRequest.onerror = (event) => {
                reject(new Error('Failed to retrieve data: ' + event.target.error));
            };

            getRequest.onsuccess = (event) => {
                const result = event.target.result;

                if (result) {
                    resolve(result.data);
                } else {
                    resolve(null); // Or you can resolve with a default value if desired
                }
            };

            transaction.onerror = (event) => {
                reject(new Error('Transaction error: ' + event.target.error));
            };

            transaction.oncomplete = () => {
                db.close();
            };
        };
    });
}

function saveFilesDB(arrayFiles, domain) {
    const dbName = "netsuiteFilesDB";
    const storeName = "netsuiteFilesStore";
    const version = Date.now(); // Use timestamp as the version number

    const request = indexedDB.open(dbName, version);

    request.onerror = function (event) {
        console.error("IndexedDB error:", event.target.error);
    };

    request.onupgradeneeded = function (event) {
        const db = event.target.result;

        // Create the object store if it doesn't exist
        if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: "id" });
            store.createIndex("domain", "domain", { unique: false });
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

        const getRequest = store.get(domain);

        getRequest.onsuccess = function (event) {
            const existingDomain = event.target.result;
            if (existingDomain) {
                console.log(`Array files for ${domain} already exist in IndexedDB. Overwriting...`);
                existingDomain.data = arrayFiles;
                const updateRequest = store.put(existingDomain);

                updateRequest.onsuccess = function (event) {
                    console.log(`Array files for ${domain} updated in IndexedDB.`);
                    // Handle the case when the arrayFiles are successfully updated
                };

                updateRequest.onerror = function (event) {
                    console.error("Error updating arrayFiles in IndexedDB:", event.target.error);
                    // Handle the error case when updating the arrayFiles fails
                };
            } else {
                const domainObject = {
                    id: domain,
                    data: arrayFiles,
                };

                const addRequest = store.add(domainObject);

                addRequest.onsuccess = function (event) {
                    console.log(`Array files for ${domain} saved to IndexedDB.`);
                    // Handle the case when the arrayFiles are successfully added
                };

                addRequest.onerror = function (event) {
                    console.error("Error saving arrayFiles to IndexedDB:", event.target.error);
                    // Handle the error case when adding the arrayFiles fails
                };
            }
        };

        transaction.oncomplete = function (event) {
            db.close();
        };
    };
}

function deleteDatabase() {
    const dbName = "netsuiteFilesDB";
    const storeName = "netsuiteFilesStore";
    const request = indexedDB.open(dbName);

    request.onerror = function (event) {
        console.error("IndexedDB error:", event.target.error);
    };

    request.onsuccess = function (event) {
        const db = event.target.result;

        // Check if storeName exists before deleting
        if (!db.objectStoreNames.contains(storeName)) return;

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

async function equalObjects(obj1, obj2) {
    // Check if the objects are strictly equal
    if (obj1 === obj2) {
        return true;
    }

    // Check if both objects are objects and not null
    if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
        return false;
    }

    // Check if both objects have the same number of properties
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) {
        return false;
    }

    // Recursively compare each property of the objects
    for (const key of keys1) {
        if (!equalObjects(obj1[key], obj2[key])) {
            return false;
        }
    }

    return true;
}

async function getFilesChanged(netsuiteFiles, filesInDB, domain) {

    let newFiles = [];
    let filesChanged = [];

    for (const file of netsuiteFiles) {
        const fileInDB = filesInDB.find((fileDB) => fileDB.id === file.id);

        // If file does not exist inside the DB, it means it is a new file
        if (!fileInDB) {
            // Get content from netsuite for that file
            const url = domain + file.url;
            const fileContent = await getFileContent(url);

            file.content = fileContent;
            newFiles.push(file);
            continue;
        }


        const fileChanged = await equalObjects(file, fileInDB);

        // If the object exist in db but is different, it means it has changed
        if (!fileChanged) {
            // Get content from netsuite for that file
            const url = domain + file.url;
            const fileContent = await getFileContent(url);

            file.content = fileContent;
            filesChanged.push(file);
            continue;
        }

        // If file in db does not have content, it means was an uploaded file without content
        if (fileInDB?.content == null) {
            // Get content from netsuite for that file
            const url = domain + file.url;
            const fileContent = await getFileContent(url);

            file.content = fileContent;
            filesChanged.push(file);
            continue;
        }

        // Check if modified date is different
        if (file.modified !== fileInDB.modified) {
            // Get content from netsuite for that file
            const url = domain + file.url;
            const fileContent = await getFileContent(url);

            file.content = fileContent;
            filesChanged.push(file);
            continue;
        }
    }//End for

    // Add new files into netsuiteFiles array
    filesInDB = filesInDB.concat(newFiles);

    // Overwrite files that changed into filesDB array
    for (const fileChanged of filesChanged) {
        const index = filesInDB.findIndex((file) => file.id === fileChanged.id);
        filesInDB[index] = fileChanged;
    }

    return filesInDB;
}

// ----------------- ADD FILE CONTENT LOGIC ----------------- //
async function addFileContent(netsuiteFiles, domain, batchSize = 800) {

    const totalFiles = netsuiteFiles.length;
    let processedFiles = 0;
    let resultFiles = [];

    while (processedFiles < totalFiles) {
        const batchFiles = netsuiteFiles.slice(processedFiles, processedFiles + batchSize);

        const batchResults = await fetchFilesWithRetry(batchFiles, domain);

        const batchFilesFiltered = batchResults.filter(Boolean);

        resultFiles = resultFiles.concat(batchFilesFiltered);
        processedFiles += batchFiles.length;
    }

    return resultFiles;
}

async function fetchFilesWithRetry(files, domain, maxRetries = 3) {
    let retries = 0;
    let result = [];

    while (retries < maxRetries) {
        try {
            const batchRequests = files.map(async (file) => {
                const urlOpen = domain + file.url;
                const fileContent = await getFileContent(urlOpen);

                file.content = fileContent;

                return file;
            });

            result = await Promise.all(batchRequests);
            break;
        } catch (error) {
            retries++;
            if (retries >= maxRetries) {
                // Handle retries exceeded error
                console.error("Maximum retries exceeded. Error:", error);
                break;
            }

            // Delay before retrying
            await delay(1500); // Adjust the delay duration as needed
        }
    }

    return result;
}

async function getFileContent(url) {
    try {
        if (!url.includes("https://")) url = "https://" + url;

        const response = await fetch(url);
        if (!response.ok) return null;

        const content = await response.text();
        return content;
    } catch (error) {
        return null;
    }
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
// -----------------------------------------------------------------------------------------