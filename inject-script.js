
debugger;

const netsuiteFiles = getSuiteScriptFiles();
const domain = getDomain();

// Send a message to the content-script with all SuiteScript files
window.postMessage({ netsuiteFiles: netsuiteFiles || null, domain: domain});

// ------------------- AUXILIAR FUNCTIONS -------------------------------
function getSuiteScriptFiles(folder = -15)
{
    var fileSearch = nlapiSearchRecord("file", null,
        [
            ["folder", "anyof", "-15"]
        ],
        [
            new nlobjSearchColumn("name").setSort(false),
            new nlobjSearchColumn("folder"),
            new nlobjSearchColumn("url")
        ]
    );

    return fileSearch;
}

function getDomain()
{
    var url = window.location.href;
    var match = url.match(/^(?:https?:\/\/)?([^\/]+)/i);
    var domain = match[0];

    return domain;
}