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

    // Get the current active tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
        debugger;
        // Execute the content script only if we dont have netsuite properties already declared
        const { netsuiteFiles } = await chrome.storage.local.get("netsuiteFiles");
        const { netsuiteDomain } = await chrome.storage.local.get("netsuiteDomain");

        if (!netsuiteFiles || !netsuiteDomain) {

            showLoader();

            // Inject the content script
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ["content-script.js"]
            });
        }

    });
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

    // Get all suiteScript files from 
    const { netsuiteFiles } = await chrome.storage.local.get("netsuiteFiles");
    if (!netsuiteFiles || netsuiteFiles.length < 1) {
        closeLoader();
        return;
    }

    const { netsuiteDomain } = await chrome.storage.local.get("netsuiteDomain");
    if (!netsuiteDomain) {
        closeLoader();
        return;
    }

    const formattedNetsuiteFiles = await getFilesQuery(netsuiteFiles, netsuiteDomain, queryToSearch);

    showNetsuiteFiles(formattedNetsuiteFiles);

    netsuiteFilesCopy = formattedNetsuiteFiles;
    
    if(netsuiteFilesCopy.length > 0) {
        copyToClipboard.style.display = 'block';
    }

    closeLoader();
});

// Copy to clipboard btn
copyToClipboard.addEventListener('click', async function () {
    debugger;
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
                <td colspan="3" style="text-align: center;">No results found</td>
            </tr> 
        `
    }
    else {
        filteredFiles.forEach(file => {
            $bodyShowFiles.innerHTML += `
                <tr>
                    <td>${file.name}</td>
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
                const fileName = file.valuesByKey.name.value;
                console.log(fileName);
                if (![".js"].some(ext => fileName.endsWith(ext)) && fileName.includes(".")) {
                    return false;
                }
                return true;
            }).map(async file => {
                const fileName = file.valuesByKey.name.value;
                if(fileName == "SWC_CS_Zip_Code.js"){
                    debugger;
                }
                const urlOpen = domain + file.valuesByKey.url.value;
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

                return { name: fileName, url: mediaItemUrl, count };
            })
        );

        return files.filter(Boolean);
    } catch (error) {
        closeLoader();
        console.error(error);
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

async function setCopyToClipboard(text){
    await navigator.clipboard.writeText(text);
}

// -------------------- CHROME EXTENSION FUNCTIONS ----------------------------

// Listen for content-script response in order to save gathered files
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (!message.hasOwnProperty("netsuiteFiles") || !message.hasOwnProperty("domain")) return;

    chrome.storage.local.clear();

    chrome.storage.local.set({ netsuiteFiles: message.netsuiteFiles });
    chrome.storage.local.set({ netsuiteDomain: message.domain });

    closeLoader();
});