// ------------------- OPEN EXTENSION ONLY ON NETSUITE PAGE -------------------
chrome.tabs.onUpdated.addListener(() => {
	initRestrictionPerUrl();
});

chrome.runtime.onInstalled.addListener(() => {
	initRestrictionPerUrl();
});

function initRestrictionPerUrl() {
	// Page actions are disabled by default and enabled on select tabs
	chrome.action.disable();

	// Clear all rules to ensure only our expected rules are set
	chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
		// Declare a rule to enable the action on netsuite.com/app pages
		let netsuiteRule = {
			conditions: [
				new chrome.declarativeContent.PageStateMatcher({
					pageUrl: { hostSuffix: '.netsuite.com', pathPrefix: '/app/' },
				}),
			],
			actions: [new chrome.declarativeContent.ShowAction()],
		};

		// Finally, apply our new array of rules
		let rules = [netsuiteRule];
		chrome.declarativeContent.onPageChanged.addRules(rules);
	});
}