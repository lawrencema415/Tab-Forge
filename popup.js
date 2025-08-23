// Popup script for Smart Tab Grouper
document.addEventListener('DOMContentLoaded', function () {
	// Get DOM elements
	const groupBtn = document.getElementById('groupBtn');
	const removeDuplicatesBtn = document.getElementById('removeDuplicatesBtn');
	const expandAllBtn = document.getElementById('expandAllBtn');
	const collapseAllBtn = document.getElementById('collapseAllBtn');
	const ungroupAllBtn = document.getElementById('ungroupAllBtn');
	const settingsLink = document.getElementById('settingsLink');
	const status = document.getElementById('status');

	// Add event listeners
	groupBtn.addEventListener('click', () =>
		executeAction('groupByDomain', 'Tabs grouped by domain!')
	);
	removeDuplicatesBtn.addEventListener('click', () =>
		executeAction('removeDuplicates', 'Duplicate tabs removed!')
	);
	expandAllBtn.addEventListener('click', () =>
		executeAction('expandAll', 'All groups expanded!')
	);
	collapseAllBtn.addEventListener('click', () =>
		executeAction('collapseAll', 'All groups collapsed!')
	);
	ungroupAllBtn.addEventListener('click', () =>
		executeAction('ungroupAll', 'All tabs ungrouped!')
	);

	settingsLink.addEventListener('click', (e) => {
		e.preventDefault();
		chrome.runtime.openOptionsPage();
	});

	async function executeAction(action, successMessage) {
		showStatus('Processing...', 'info');

		try {
			const response = await chrome.runtime.sendMessage({ action });

			if (response.success) {
				showStatus(successMessage, 'success');
				setTimeout(() => hideStatus(), 2000);
			} else {
				showStatus('Action failed', 'error');
				setTimeout(() => hideStatus(), 2000);
			}
		} catch (error) {
			showStatus('Error occurred', 'error');
			setTimeout(() => hideStatus(), 2000);
		}
	}

	function showStatus(message, type) {
		status.textContent = message;
		status.className = `status show ${type}`;
	}

	function hideStatus() {
		status.className = 'status';
	}
});
