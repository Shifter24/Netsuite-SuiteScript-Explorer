debugger;

// Send a message to the content-script with all SuiteScript files
window.postMessage({ netsuiteFiles: getSuiteScriptFiles() || null, domain: getDomain() });

// ------------------- AUXILIAR FUNCTIONS -------------------------------
function getSuiteScriptFiles(folder = ["-15", "-16"])
{
    if (typeof arrayResults == "undefined")
    {
        var arrayResults = [];
    }

    if (typeof lastSearchId == "undefined")
    {
        var lastSearchId = 0;
    }

// https://netsuiteguru.blogspot.com/2016/12/how-to-get-more-than-1000-records-in.html
    do
    {
        if (lastSearchId > 0)
        {
            if (typeof fileSearch == "undefined")
            {
                var fileSearch;
            }

            //  add filter for internalidnumber greater than lastprocessed .
            fileSearch = nlapiSearchRecord("file", null,
                [
                    ["folder", "anyof", "-15", "-16"],
                    "AND",
                    ["filetype", "anyof", "JAVASCRIPT"],
                    "AND",
                    ["isavailable", "is", "T"],
                    "AND",
                    ["internalidnumber", "greaterthan", lastSearchId]
                ],
                [
                    new nlobjSearchColumn("name").setSort(false),
                    new nlobjSearchColumn("folder"),
                    new nlobjSearchColumn("url")
                ]
            );

            for (var i = 0; i <= searchresults.length; i++)
            {
                //add your logic here
                lastprocessed = searchresults[i].getId();
            }

        }
        //add search logic and filter
    } while (searchresults.length == 1000);


}

function getDomain()
{
    return domain = window.location.href.match(/^(?:https?:\/\/)?([^\/]+)/i)[0];
}