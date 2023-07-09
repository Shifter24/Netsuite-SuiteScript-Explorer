

// Send a message to the content-script with all SuiteScript files
window.postMessage({ netsuiteFiles: getSuiteScriptFiles() || null, domain: getDomain() });

// ------------------- AUXILIAR FUNCTIONS -------------------------------
function getSuiteScriptFiles(folder = ["-15", "-16"]) {

    if (typeof filesResults == "undefined") {
        var filesResults = [];
    }

    if (typeof filesResults == "undefined") {
        var scriptResults = [];
    }

    // Get all files from backend
    filesResults = getAllFiles(folder);

    // Get all scripts from backend
    scriptResults = getAllScripts();

    // Join files with scripts
    filesResults = joinFilesWScripts(filesResults, scriptResults);

    return filesResults;
}

function getAllFiles(folder) {
    if (typeof filesResults == "undefined") {
        var filesResults = [];
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
            filesResults = filesResults.concat(fileSearch.map((result) => ({
                id: result.getValue("internalid"),
                name: result.getValue("name"),
                folder: result.getText("folder"),
                url: result.getValue("url"),
                content: null
            })));
        }

    } while (fileSearch != null && fileSearch.length > 0);

    return filesResults;
}

function getAllScripts() {
    if (typeof scriptsResults == "undefined") {
        var scriptsResults = [];
    }

    if (typeof lastSearchId == "undefined") {
        var lastSearchId = 0;
    }

    lastSearchId = 0;

    if (typeof scriptSearch == "undefined") {
        var scriptSearch;
    }

    do {
        var scriptSearch = nlapiSearchRecord("script", null,
            [
                ["internalidnumber", "greaterthan", lastSearchId]
            ],
            [
                new nlobjSearchColumn("internalid").setSort(false),
                new nlobjSearchColumn("name"),
                new nlobjSearchColumn("scriptfile"),
                new nlobjSearchColumn("scripttype")
            ]
        );

        // Get the last processed internalidnumber
        if (scriptSearch != null && scriptSearch.length > 0) {
            lastSearchId = scriptSearch[scriptSearch.length - 1].getValue("internalid");
        }

        // Add the results to the array
        if (scriptSearch && scriptSearch.length > 0) {
            scriptsResults = scriptsResults.concat(scriptSearch.map((result) => ({
                scriptId: result.getValue("internalid"),
                name: result.getValue("name"),
                scriptfile: result.getText("scriptfile"),
                scripttype: result.getText("scripttype")
            })));

        }

    } while (scriptSearch != null && scriptSearch.length > 0);

    return scriptsResults;
}

function getDomain() {
    return domain = window.location.href.match(/^(?:https?:\/\/)?([^\/]+)/i)[0];
}

function joinFilesWScripts(arrayFiles, arrayScripts) {

    if (typeof resultArray == "undefined") {
        var resultArray = [];
    }

    if (typeof script == "undefined") {
        var script;
    }

    resultArray = arrayFiles.map(function (file) {

        script = arrayScripts.find(function (item) { return item.scriptfile === file.name; });

        if (script) {
            return {
                ...file,
                script: script,
            };
        }

        return file;
    });

    return resultArray;
}