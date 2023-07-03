const $extensionContainer = document.querySelector(".extension-container");
const $getFilesBtn = document.getElementById("get-files-netsuite");
const $querySearch = document.getElementById("query-search");
const $bodyShowFiles = document.getElementById("body-show-files");
const $loader = document.querySelector(".lds-ring");
const $totalResults = document.getElementById("total-results");

let netsuiteFiles = [];

// Only show functionality when we are in netsuite page
document.addEventListener('DOMContentLoaded', function () {
    // Get the current active tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        var url = tabs[0].url;

        // Check if the current URL matches your desired pattern
        (url.includes('netsuite.com/app') ? $extensionContainer.style.display = 'block' : $extensionContainer.style.display = 'none');
    });
});

$getFilesBtn.addEventListener("click", async () => {
    debugger;
    showLoader();

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
    if (!formattedNetsuiteFiles || formattedNetsuiteFiles.length < 1) {
        closeLoader();
        return;
    }

    showNetsuiteFiles(formattedNetsuiteFiles);

    closeLoader();
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

    filteredFiles.forEach(file => {
        $bodyShowFiles.innerHTML += `
            <tr>
                <td>${file.name}</td>
                <td>${file.count} ${(file.count == 1 ? 'time' : 'times')}</td>
                <td><a href="${file.url}"><svg xmlns="http://www.w3.org/2000/svg"
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

    $totalResults.innerHTML = filteredFiles.length;
}

async function getFilesQuery(netsuiteFiles, domain, queryToSearch) {
    let files = [];

    if (!netsuiteFiles || netsuiteFiles.length < 1) return files;

    for (const file of netsuiteFiles) {
        const fileName = file.valuesByKey.name.value;
        const urlOpen = domain + file.valuesByKey.url.value;

        const fileContent = await getFileContent(urlOpen);
        if (!fileContent) continue;

        let url = new URL(urlOpen);
        const searchParams = new URLSearchParams(url.search);
        const id = searchParams.get("id");

        url = domain + `/app/common/media/mediaitem.nl?id=${id}`

        // Find word inside fileContent
        var regex = new RegExp('\\b' + queryToSearch + '\\b', 'gi');
        var matches = fileContent.match(regex);
        var count = matches ? matches.length : 0;
        if (!count || count < 1) continue;

        files.push({ name: fileName, url: url, count: count });
    }

    return files;
}


async function getFileContent(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Error fetching file: " + response.status);
        }
        const content = await response.text();
        return content;

    } catch (error) {
        console.error(error);
    }
}


// -------------------- CHROME EXTENSION FUNCTIONS ----------------------------

// Listen for content-script response in order to save gathered files
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message.hasOwnProperty("netsuiteFiles") || !message.hasOwnProperty("domain")) return;

    chrome.storage.local.set({ netsuiteFiles: message.netsuiteFiles });
    chrome.storage.local.set({ netsuiteDomain: message.domain });
});