const $extensionContainer = document.querySelector(".extension-container");
const $getFilesBtn = document.getElementById("get-files-netsuite");
const $querySearch = document.getElementById("query-search");
const $bodyShowFiles = document.getElementById("body-show-files");

let netsuiteFiles = [];

// Only show functionality when we are in netsuite page
document.addEventListener('DOMContentLoaded', function ()
{
    // Get the current active tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs)
    {
        var url = tabs[0].url;

        // Check if the current URL matches your desired pattern
        (url.includes('netsuite.com/app') ?  $extensionContainer.style.display = 'block' : $extensionContainer.style.display = 'none');
    });
});

$getFilesBtn.addEventListener("click", async () =>
{
    showLoader();
    
    const queryToSearch = $querySearch.value;
    if (!queryToSearch)
    {
        alert("Insert field to search!.");
        closeLoader();
        return;
    }

    // Get all suiteScript files from 
    const { netsuiteFiles } = await chrome.storage.local.get("netsuiteFiles");
    if (!netsuiteFiles || netsuiteFiles.length < 1){
        closeLoader();
        return;
    }

    const { netsuiteDomain } = await chrome.storage.local.get("netsuiteDomain");
    if (!netsuiteDomain){
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

function showLoader()
{
    document.body.style.background = "black";
}

function closeLoader()
{
    document.body.style.background = "white";
}

function showNetsuiteFiles(filteredFiles){
    $bodyShowFiles.innerHTML = "";

    filteredFiles.forEach(file => {
        $bodyShowFiles.innerHTML += `
            <tr>
                <td>${file.name}</td>
                <td>${file.count}</td>
                <td><a href="${file.url}">See file</a></td>
            </tr>
        `
    });
}

async function getFilesQuery(netsuiteFiles, domain, queryToSearch)
{
    let files = [];

    if (!netsuiteFiles || netsuiteFiles.length < 1) return files;

    for (const file of netsuiteFiles)
    {
        const fileName = file.valuesByKey.name.value;
        const url = domain + file.valuesByKey.url.value;

        const fileContent = await getFileContent(url);
        if (!fileContent) continue;

        // Find word inside fileContent
        var regex = new RegExp('\\b' + queryToSearch + '\\b', 'gi');
        var matches = fileContent.match(regex);
        var count = matches ? matches.length : 0;
        if (!count || count < 1) continue;

        files.push({ name: fileName, url: url, count: count });
    }

    return files;
}


async function getFileContent(url)
{
    try
    {
        const response = await fetch(url);
        if (!response.ok)
        {
            throw new Error("Error fetching file: " + response.status);
        }
        const content = await response.text();
        return content;

    } catch (error)
    {
        console.error(error);
    }
}

// -------------------- CHROME EXTENSION FUNCTIONS ----------------------------

// Listen for content-script response in order to save gathered files
chrome.runtime.onMessage.addListener((message, sender, sendResponse) =>
{
    if (!message.hasOwnProperty("netsuiteFiles") || !message.hasOwnProperty("domain")) return;

    chrome.storage.local.set({ netsuiteFiles: message.netsuiteFiles });
    chrome.storage.local.set({ netsuiteDomain: message.domain });
});