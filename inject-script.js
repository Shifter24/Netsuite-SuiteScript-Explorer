debugger;

// Send a message to the content-script with all SuiteScript files
window.postMessage({ netsuiteFiles: getSuiteScriptFiles() || null, domain: getDomain()});

// ------------------- AUXILIAR FUNCTIONS -------------------------------
function getSuiteScriptFiles(folder = -15)
{
    return fileSearch = nlapiSearchRecord("file", null,
        [
            ["folder", "anyof", "-15"],
            "AND", 
            ["filetype","anyof","JAVASCRIPT"]
        ],
        [
            new nlobjSearchColumn("name").setSort(false),
            new nlobjSearchColumn("folder"),
            new nlobjSearchColumn("url")
        ]
    );
}

function getDomain()
{
    return domain = window.location.href.match(/^(?:https?:\/\/)?([^\/]+)/i)[0];
}