"use strict";
// Background script for Tab Forge
console.log('Background script loading...');
chrome.runtime.onStartup.addListener(() => {
    console.log('Tab Forge service worker started');
});
chrome.runtime.onInstalled.addListener(() => {
    console.log('Tab Forge extension installed');
    // Set up side panel for Manifest V3
    if (chrome.sidePanel) {
        chrome.sidePanel.setOptions({
            path: "sidebar.html",
            enabled: true
        }).catch((error) => {
            console.error("Error setting side panel options:", error);
        });
    }
});
class TabGrouper {
    constructor() {
        console.log('TabGrouper constructor called');
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
        // Small delay to ensure proper initialization
        await new Promise(resolve => setTimeout(resolve, 100));
        // Set up event listeners
        this.setupEventListeners();
    }
    setupEventListeners() {
        console.log('Setting up event listeners');
        // Listen for new tabs
        chrome.tabs.onCreated.addListener((tab) => {
            console.log('New tab created:', tab.id);
            this.handleNewTab(tab);
        });
        // Listen for tab updates (URL changes)
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.url) {
                console.log('Tab updated:', tabId, changeInfo.url);
                this.handleTabUpdate(tab);
            }
        });
        // Listen for messages from popup
        const messageListener = (message, sender, sendResponse) => {
            console.log('Message received in background:', message);
            return this.handleMessage(message, sender, sendResponse);
        };
        chrome.runtime.onMessage.addListener(messageListener);
        // Listen for action button click to open side panel
        chrome.action.onClicked.addListener(async (tab) => {
            console.log('Action button clicked');
            if (tab?.windowId) {
                try {
                    // Use a type assertion to treat chrome.sidePanel as any
                    const sidePanel = chrome.sidePanel;
                    await sidePanel.open({ windowId: tab.windowId });
                    console.log('Side panel opened');
                }
                catch (error) {
                    console.error('Error opening side panel:', error);
                }
            }
        });
        console.log('Message listener registered');
        console.log('Event listeners set up');
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
        console.log('Received message:', message);
        try {
            switch (message.action) {
                case 'groupByDomain':
                    console.log('Executing groupByDomain');
                    await this.groupAllTabsByDomain();
                    console.log('groupByDomain completed');
                    sendResponse({ success: true, message: 'Tabs grouped' });
                    break;
                case 'ungroupAll':
                    console.log('Executing ungroupAll');
                    await this.ungroupAllTabs();
                    console.log('ungroupAll completed');
                    sendResponse({ success: true, message: 'Tabs ungrouped' });
                    break;
                case 'expandAll':
                    console.log('Executing expandAll');
                    await this.expandAllGroups();
                    console.log('expandAll completed');
                    sendResponse({ success: true, message: 'Groups expanded' });
                    break;
                case 'collapseAll':
                    console.log('Executing collapseAll');
                    await this.collapseAllGroups();
                    console.log('collapseAll completed');
                    sendResponse({ success: true, message: 'Groups collapsed' });
                    break;
                case 'removeDuplicates':
                    console.log('Executing removeDuplicates');
                    await this.removeDuplicateTabs();
                    console.log('removeDuplicates completed');
                    sendResponse({ success: true, message: 'Duplicates removed' });
                    break;
                default:
                    console.log('Unknown action:', message.action);
                    sendResponse({ success: false, error: 'Unknown action: ' + (message.action || 'none') });
            }
        }
        catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message || 'Unknown error' });
        }
        console.log('Response sent');
        return true; // Indicates that sendResponse will be called asynchronously
    }
    async groupTab(tab) {
        // Add a small delay to ensure page loads
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!tab.url ||
            tab.url.startsWith('chrome://') ||
            tab.url.startsWith('chrome-extension://')) {
            return;
        }
        const settings = await chrome.storage.sync.get(['tabGroupSettings']);
        const { customRules, colors, groupByDomain } = settings.tabGroupSettings || this.defaultSettings;
        // Check custom rules first
        const matchedRule = this.findMatchingRule(tab, customRules);
        if (matchedRule) {
            await this.createOrAddToGroup(tab, matchedRule.groupName, matchedRule.color);
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
            if (!rule.enabled)
                continue;
            switch (rule.condition) {
                case 'url':
                    if (tab.url && tab.url.includes(rule.value)) {
                        return rule;
                    }
                    break;
                case 'hostname':
                    if (tab.url) {
                        try {
                            const hostname = new URL(tab.url).hostname;
                            if (hostname.includes(rule.value)) {
                                return rule;
                            }
                        }
                        catch (e) {
                            // Ignore invalid URLs
                        }
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
        }
        catch (e) {
            return 'Unknown';
        }
    }
    async createOrAddToGroup(tab, groupName, color) {
        try {
            // Verify the tab still exists before trying to group it
            try {
                await chrome.tabs.get(tab.id);
            }
            catch (e) {
                console.warn('Tab no longer exists, skipping grouping:', tab.id);
                return;
            }
            const currentWindow = await chrome.windows.getCurrent();
            // Check if group already exists
            const existingGroups = await chrome.tabGroups.query({
                windowId: currentWindow.id,
            });
            const existingGroup = existingGroups.find((group) => group.title === groupName);
            if (existingGroup) {
                // Add tab to existing group
                await chrome.tabs.group({
                    tabIds: [tab.id],
                    groupId: existingGroup.id,
                });
            }
            else {
                // Create new group
                const groupId = await chrome.tabs.group({ tabIds: [tab.id] });
                await chrome.tabGroups.update(groupId, {
                    title: groupName,
                    color: color,
                });
            }
        }
        catch (error) {
            console.error('Error grouping tab:', error);
            // Don't throw the error to prevent breaking the entire process
        }
    }
    async groupAllTabsByDomain() {
        const currentWindow = await chrome.windows.getCurrent();
        const allTabs = await chrome.tabs.query({ windowId: currentWindow.id });
        for (const tab of allTabs) {
            try {
                // Verify the tab still exists before trying to group it
                await chrome.tabs.get(tab.id);
                await this.groupTab(tab);
                // Add a small delay to prevent overwhelming the browser
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            catch (e) {
                console.warn('Tab no longer exists, skipping grouping:', tab.id);
                continue;
            }
        }
    }
    async ungroupAllTabs() {
        const currentWindow = await chrome.windows.getCurrent();
        const allTabs = await chrome.tabs.query({ windowId: currentWindow.id });
        for (const tab of allTabs) {
            try {
                // Verify the tab still exists before trying to ungroup it
                await chrome.tabs.get(tab.id);
                if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) {
                    await chrome.tabs.ungroup(tab.id);
                    // Add a small delay to prevent overwhelming the browser
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }
            catch (e) {
                console.warn('Tab no longer exists, skipping ungrouping:', tab.id);
                continue;
            }
        }
    }
    async expandAllGroups() {
        const currentWindow = await chrome.windows.getCurrent();
        const groups = await chrome.tabGroups.query({ windowId: currentWindow.id });
        for (const group of groups) {
            if (group.collapsed) {
                await chrome.tabGroups.update(group.id, { collapsed: false });
                // Add a small delay to prevent overwhelming the browser
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
    }
    async collapseAllGroups() {
        const currentWindow = await chrome.windows.getCurrent();
        const groups = await chrome.tabGroups.query({ windowId: currentWindow.id });
        for (const group of groups) {
            if (!group.collapsed) {
                await chrome.tabGroups.update(group.id, { collapsed: true });
                // Add a small delay to prevent overwhelming the browser
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
    }
    async removeDuplicateTabs() {
        const currentWindow = await chrome.windows.getCurrent();
        const allTabs = await chrome.tabs.query({ windowId: currentWindow.id });
        const seenUrls = new Set();
        const duplicates = [];
        for (const tab of allTabs) {
            // Verify the tab still exists
            try {
                await chrome.tabs.get(tab.id);
            }
            catch (e) {
                console.warn('Tab no longer exists, skipping duplicate check:', tab.id);
                continue;
            }
            if (tab.url && seenUrls.has(tab.url)) {
                duplicates.push(tab.id);
            }
            else {
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
console.log('Initializing TabGrouper');
const tabGrouper = new TabGrouper();
console.log('TabGrouper initialized');
console.log('Background script fully loaded');
