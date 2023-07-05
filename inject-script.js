

// Send a message to the content-script with all SuiteScript files
window.postMessage({ netsuiteFiles: getSuiteScriptFiles() || null, domain: getDomain() });

// ------------------- AUXILIAR FUNCTIONS -------------------------------
function getSuiteScriptFiles(folder = ["-15", "-16"]) {
    if (typeof arrayResults == "undefined") {
        var arrayResults = [];
    }

    if (typeof lastSearchId == "undefined") {
        var lastSearchId = 0;
    }

    lastSearchId = 0;

    if (typeof fileSearch == "undefined") {
        var fileSearch;
    }

    do {
        //  add filter for internalidnumber greater than lastprocessed .
        fileSearch = nlapiSearchRecord("file", null,
            [
                ["folder", "anyof", folder],
                "AND",
                ["filetype", "anyof", "JAVASCRIPT"],
                "AND",
                ["isavailable", "is", "T"],
                "AND",
                ["internalidnumber", "greaterthan", lastSearchId]
            ],
            [
                new nlobjSearchColumn("internalid").setSort(false),
                new nlobjSearchColumn("name"),
                new nlobjSearchColumn("folder"),
                new nlobjSearchColumn("url")
            ]
        );

        // Get the last processed internalidnumber
        if (fileSearch != null && fileSearch.length > 0) {
            lastSearchId = fileSearch[fileSearch.length - 1].getValue("internalid");
        }

        // Add the results to the array
        if (fileSearch && fileSearch.length > 0) {
            arrayResults = arrayResults.concat(fileSearch.map((result) => ({
                internalid: result.getValue("internalid"),
                name: result.getValue("name"),
                folder: result.getText("folder"),
                url: result.getValue("url")
            })));
        }

    } while (fileSearch != null && fileSearch.length > 0);

    return arrayResults;
}

function getDomain() {
    return domain = window.location.href.match(/^(?:https?:\/\/)?([^\/]+)/i)[0];
}