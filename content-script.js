debugger;

injectScript(chrome.runtime.getURL("inject-script.js"), "body");

// Listen when inject-script sent files
window.addEventListener('message', function (event)
{
    if (!event.data.hasOwnProperty("netsuiteFiles") || !event.data.hasOwnProperty("domain")) return;

    chrome.runtime.sendMessage({ netsuiteFiles: event.data.netsuiteFiles , domain: event.data.domain});
});

function injectScript(file_path, tag) {
    var node = document.getElementsByTagName(tag)[0];
    var script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", file_path);
    node.appendChild(script);
    
    script.onload = function() {
        debugger;
      script.remove();
    };
  }