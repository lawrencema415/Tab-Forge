// Background script for Smart Tab Grouper
class TabGrouper {
	constructor() {
		this.defaultSettings = {
			autoGroup: true,
			groupByDomain: true,
			customRules: [],
			colors: {
				'github.com': 'purple',
				'google.com': 'blue',
				'notion.so': 'red',
				'stackoverflow.com': 'orange',
				'youtube.com': 'pink',
				'twitter.com': 'cyan',
				'facebook.com': 'blue',
				'linkedin.com': 'blue',
				'reddit.com': 'orange',
			},
		};
		this.init();
	}

	async init() {
		// Initialize settings on installation
		const settings = await chrome.storage.sync.get(['tabGroupSettings']);
		if (!settings.tabGroupSettings) {
			await chrome.storage.sync.set({ tabGroupSettings: this.defaultSettings });
		}

		// Set up event listeners
		this.setupEventListeners();
	}

	setupEventListeners() {
		// Listen for new tabs
		chrome.tabs.onCreated.addListener((tab) => {
			this.handleNewTab(tab);
		});

		// Listen for tab updates (URL changes)
		chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
			if (changeInfo.url) {
				this.handleTabUpdate(tab);
			}
		});

		// Listen for messages from popup
		chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
			this.handleMessage(message, sender, sendResponse);
		});
	}

	async handleNewTab(tab) {
		const settings = await chrome.storage.sync.get(['tabGroupSettings']);
		if (settings.tabGroupSettings?.autoGroup) {
			setTimeout(() => this.groupTab(tab), 1000); // Delay to ensure page loads
		}
	}

	async handleTabUpdate(tab) {
		const settings = await chrome.storage.sync.get(['tabGroupSettings']);
		if (settings.tabGroupSettings?.autoGroup) {
			this.groupTab(tab);
		}
	}

	async handleMessage(message, sender, sendResponse) {
		switch (message.action) {
			case 'groupByDomain':
				await this.groupAllTabsByDomain();
				sendResponse({ success: true });
				break;
			case 'ungroupAll':
				await this.ungroupAllTabs();
				sendResponse({ success: true });
				break;
			case 'expandAll':
				await this.expandAllGroups();
				sendResponse({ success: true });
				break;
			case 'collapseAll':
				await this.collapseAllGroups();
				sendResponse({ success: true });
				break;
			case 'removeDuplicates':
				await this.removeDuplicateTabs();
				sendResponse({ success: true });
				break;
			default:
				sendResponse({ success: false, error: 'Unknown action' });
		}
	}

	async groupTab(tab) {
		if (
			!tab.url ||
			tab.url.startsWith('chrome://') ||
			tab.url.startsWith('chrome-extension://')
		) {
			return;
		}

		const settings = await chrome.storage.sync.get(['tabGroupSettings']);
		const { customRules, colors, groupByDomain } =
			settings.tabGroupSettings || this.defaultSettings;

		// Check custom rules first
		const matchedRule = this.findMatchingRule(tab, customRules);
		if (matchedRule) {
			await this.createOrAddToGroup(
				tab,
				matchedRule.groupName,
				matchedRule.color
			);
			return;
		}

		// Group by domain if enabled
		if (groupByDomain) {
			const domain = this.extractDomain(tab.url);
			const color = colors[domain] || this.getRandomColor();
			await this.createOrAddToGroup(tab, domain, color);
		}
	}

	findMatchingRule(tab, rules) {
		for (const rule of rules) {
			if (!rule.enabled) continue;

			switch (rule.condition) {
				case 'url':
					if (tab.url.includes(rule.value)) {
						return rule;
					}
					break;
				case 'hostname':
					const hostname = new URL(tab.url).hostname;
					if (hostname.includes(rule.value)) {
						return rule;
					}
					break;
				case 'title':
					if (tab.title && tab.title.includes(rule.value)) {
						return rule;
					}
					break;
			}
		}
		return null;
	}

	extractDomain(url) {
		try {
			const hostname = new URL(url).hostname;
			return hostname.replace('www.', '');
		} catch (e) {
			return 'Unknown';
		}
	}

	async createOrAddToGroup(tab, groupName, color) {
		try {
			const currentWindow = await chrome.windows.getCurrent();
			const allTabs = await chrome.tabs.query({ windowId: currentWindow.id });

			// Check if group already exists
			const existingGroups = await chrome.tabGroups.query({
				windowId: currentWindow.id,
			});
			const existingGroup = existingGroups.find(
				(group) => group.title === groupName
			);

			if (existingGroup) {
				// Add tab to existing group
				await chrome.tabs.group({
					tabIds: [tab.id],
					groupId: existingGroup.id,
				});
			} else {
				// Create new group
				const groupId = await chrome.tabs.group({ tabIds: [tab.id] });
				await chrome.tabGroups.update(groupId, {
					title: groupName,
					color: color,
				});
			}
		} catch (error) {
			console.error('Error grouping tab:', error);
		}
	}

	async groupAllTabsByDomain() {
		const currentWindow = await chrome.windows.getCurrent();
		const allTabs = await chrome.tabs.query({ windowId: currentWindow.id });

		for (const tab of allTabs) {
			await this.groupTab(tab);
		}
	}

	async ungroupAllTabs() {
		const currentWindow = await chrome.windows.getCurrent();
		const allTabs = await chrome.tabs.query({ windowId: currentWindow.id });

		for (const tab of allTabs) {
			if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
				await chrome.tabs.ungroup(tab.id);
			}
		}
	}

	async expandAllGroups() {
		const currentWindow = await chrome.windows.getCurrent();
		const groups = await chrome.tabGroups.query({ windowId: currentWindow.id });

		for (const group of groups) {
			if (group.collapsed) {
				await chrome.tabGroups.update(group.id, { collapsed: false });
			}
		}
	}

	async collapseAllGroups() {
		const currentWindow = await chrome.windows.getCurrent();
		const groups = await chrome.tabGroups.query({ windowId: currentWindow.id });

		for (const group of groups) {
			if (!group.collapsed) {
				await chrome.tabGroups.update(group.id, { collapsed: true });
			}
		}
	}

	async removeDuplicateTabs() {
		const currentWindow = await chrome.windows.getCurrent();
		const allTabs = await chrome.tabs.query({ windowId: currentWindow.id });
		const seenUrls = new Set();
		const duplicates = [];

		for (const tab of allTabs) {
			if (seenUrls.has(tab.url)) {
				duplicates.push(tab.id);
			} else {
				seenUrls.add(tab.url);
			}
		}

		if (duplicates.length > 0) {
			await chrome.tabs.remove(duplicates);
		}
	}

	getRandomColor() {
		const colors = [
			'grey',
			'blue',
			'red',
			'yellow',
			'green',
			'pink',
			'purple',
			'cyan',
			'orange',
		];
		return colors[Math.floor(Math.random() * colors.length)];
	}
}

// Initialize the tab grouper
new TabGrouper();
