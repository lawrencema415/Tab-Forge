// Sidebar script for Tab Forge

interface Message {
  action: string;
}

interface Response {
  success: boolean;
  message?: string;
  error?: string;
}

document.addEventListener('DOMContentLoaded', function () {
  console.log('Sidebar DOM loaded');
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
      console.log('Group Tabs button clicked');
      executeAction('groupByDomain', 'Tabs grouped by domain!');
    });
  }

  if (ungroupAllBtn) {
    ungroupAllBtn.addEventListener('click', () => {
      console.log('Ungroup All button clicked');
      executeAction('ungroupAll', 'All tabs ungrouped!');
    });
  }

  if (expandAllBtn) {
    expandAllBtn.addEventListener('click', () => {
      console.log('Expand All button clicked');
      executeAction('expandAll', 'All groups expanded!');
    });
  }

  if (collapseAllBtn) {
    collapseAllBtn.addEventListener('click', () => {
      console.log('Collapse All button clicked');
      executeAction('collapseAll', 'All groups collapsed!');
    });
  }

  if (removeDuplicatesBtn) {
    removeDuplicatesBtn.addEventListener('click', () => {
      console.log('Remove Duplicates button clicked');
      executeAction('removeDuplicates', 'Duplicate tabs removed!');
    });
  }

  // Settings button opens options page
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      console.log('Settings button clicked');
      chrome.runtime.openOptionsPage();
    });
  }

  async function executeAction(action: string, successMessage: string): Promise<void> {
    showStatus('Processing...', 'info');
    console.log('Sending action:', action);

    try {
      // Add a timeout to the sendMessage call
      const response: Response | undefined = await Promise.race([
        chrome.runtime.sendMessage({ action }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: No response from background service')), 5000)
        )
      ]);
      
      console.log('Received response:', response);

      // Check if response is defined
      if (response && response.success) {
        showStatus(successMessage, 'success');
        setTimeout(() => hideStatus(), 2000);
      } else if (response) {
        showStatus(response.error || 'Action failed', 'error');
        setTimeout(() => hideStatus(), 3000);
      } else {
        // Handle undefined response
        showStatus('No response from background service', 'error');
        setTimeout(() => hideStatus(), 3000);
      }
    } catch (error: any) {
      console.error('Error executing action:', error);
      if (error.message && error.message.includes('Timeout')) {
        showStatus('Timeout: Background service not responding', 'error');
      } else {
        showStatus('Error: ' + (error.message || 'Could not connect to background service'), 'error');
      }
      setTimeout(() => hideStatus(), 3000);
    }
  }

  function showStatus(message: string, type: string): void {
    if (status) {
      status.textContent = message;
      status.className = `status ${type}`;
    }
  }

  function hideStatus(): void {
    if (status) {
      status.className = 'status';
      status.textContent = '';
    }
  }
});