"use strict";
// Popup script for Tab Forge
document.addEventListener('DOMContentLoaded', function () {
    // Get DOM elements
    const groupTabsBtn = document.getElementById('groupTabsBtn');
    const ungroupAllBtn = document.getElementById('ungroupAllBtn');
    const expandAllBtn = document.getElementById('expandAllBtn');
    const collapseAllBtn = document.getElementById('collapseAllBtn');
    const removeDuplicatesBtn = document.getElementById('removeDuplicatesBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const status = document.getElementById('status');
    // Add event listeners for action buttons
    if (groupTabsBtn) {
        groupTabsBtn.addEventListener('click', () => {
            executeAction('groupByDomain', 'Tabs grouped by domain!');
        });
    }
    if (ungroupAllBtn) {
        ungroupAllBtn.addEventListener('click', () => {
            executeAction('ungroupAll', 'All tabs ungrouped!');
        });
    }
    if (expandAllBtn) {
        expandAllBtn.addEventListener('click', () => {
            executeAction('expandAll', 'All groups expanded!');
        });
    }
    if (collapseAllBtn) {
        collapseAllBtn.addEventListener('click', () => {
            executeAction('collapseAll', 'All groups collapsed!');
        });
    }
    if (removeDuplicatesBtn) {
        removeDuplicatesBtn.addEventListener('click', () => {
            executeAction('removeDuplicates', 'Duplicate tabs removed!');
        });
    }
    // Settings button opens options page
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });
    }
    async function executeAction(action, successMessage) {
        showStatus('Processing...', 'info');
        console.log('Sending action:', action);
        try {
            // Add a timeout to the sendMessage call
            const response = await Promise.race([
                chrome.runtime.sendMessage({ action }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout: No response from background service')), 5000))
            ]);
            console.log('Received response:', response);
            // Check if response is defined
            if (response && response.success) {
                showStatus(successMessage, 'success');
                setTimeout(() => hideStatus(), 2000);
            }
            else if (response) {
                showStatus(response.error || 'Action failed', 'error');
                setTimeout(() => hideStatus(), 3000);
            }
            else {
                // Handle undefined response
                showStatus('No response from background service', 'error');
                setTimeout(() => hideStatus(), 3000);
            }
        }
        catch (error) {
            console.error('Error executing action:', error);
            if (error.message && error.message.includes('Timeout')) {
                showStatus('Timeout: Background service not responding', 'error');
            }
            else {
                showStatus('Error: ' + (error.message || 'Could not connect to background service'), 'error');
            }
            setTimeout(() => hideStatus(), 3000);
        }
    }
    function showStatus(message, type) {
        if (status) {
            status.textContent = message;
            status.className = `status ${type}`;
        }
    }
    function hideStatus() {
        if (status) {
            status.className = 'status';
            status.textContent = '';
        }
    }
});
