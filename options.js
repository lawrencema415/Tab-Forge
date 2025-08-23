// Options page script for Tab Forge
class OptionsManager {
	constructor() {
		this.settings = {
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

		this.colorOptions = {
			grey: '#9ca3af',
			blue: '#3b82f6',
			red: '#ef4444',
			yellow: '#f59e0b',
			green: '#10b981',
			pink: '#ec4899',
			purple: '#8b5cf6',
			cyan: '#06b6d4',
			orange: '#f97316',
		};

		// Debounce timer for regrouping
		this.regroupDebounceTimer = null;
		
		this.init();
	}

	async init() {
		await this.loadSettings();
		this.setupEventListeners();
		this.renderSettings();
		this.renderRules();
	}

	async loadSettings() {
		const stored = await chrome.storage.sync.get(['tabGroupSettings']);
		if (stored.tabGroupSettings) {
			this.settings = { ...this.settings, ...stored.tabGroupSettings };
		}
	}

	async saveSettings(triggerRegroup = true) {
		try {
			await chrome.storage.sync.set({ tabGroupSettings: this.settings });
			this.showStatus('Settings saved successfully!', 'success');
			
			// Trigger regrouping when settings are saved (unless explicitly disabled)
			if (triggerRegroup) {
				this.debounceRegroupTabs();
			}
		} catch (error) {
			this.showStatus('Error saving settings', 'error');
		}
	}

	// Debounced regrouping to prevent too many operations
	debounceRegroupTabs() {
		// Clear existing timer
		if (this.regroupDebounceTimer) {
			clearTimeout(this.regroupDebounceTimer);
		}
		
		// Set new timer
		this.regroupDebounceTimer = setTimeout(() => {
			this.regroupTabs();
			this.regroupDebounceTimer = null;
		}, 1000); // Wait 1 second after the last change
	}

	async regroupTabs() {
		try {
			this.showStatus('Regrouping tabs...', 'info');
			
			// First ungroup all tabs
			await chrome.runtime.sendMessage({ action: 'ungroupAll' });
			
			// Small delay to ensure ungrouping is complete
			await new Promise(resolve => setTimeout(resolve, 500));
			
			// Then regroup all tabs
			await chrome.runtime.sendMessage({ action: 'groupByDomain' });
			
			this.showStatus('Tabs regrouped successfully!', 'success');
		} catch (error) {
			console.error('Error regrouping tabs:', error);
			this.showStatus('Error regrouping tabs: ' + (error.message || 'Unknown error'), 'error');
		}
	}

	setupEventListeners() {
		// General settings
		document
			.getElementById('autoGroupToggle')
			.addEventListener('change', (e) => {
				this.settings.autoGroup = e.target.checked;
				// Don't save settings automatically - let user save when ready
			});

		document
			.getElementById('groupByDomainToggle')
			.addEventListener('change', (e) => {
				this.settings.groupByDomain = e.target.checked;
				// Don't save settings automatically - let user save when ready
			});
			
		document.getElementById('saveGeneralBtn').addEventListener('click', () => {
			this.saveSettings(); // This will trigger regrouping
		});

		// Rules
		document.getElementById('addRuleBtn').addEventListener('click', () => {
			this.addNewRule();
		});

		document.getElementById('saveRulesBtn').addEventListener('click', () => {
			this.saveSettings(); // This will trigger regrouping
		});

		// Actions
		document.getElementById('saveBtn').addEventListener('click', () => {
			this.saveSettings();
		});

		document.getElementById('resetBtn').addEventListener('click', () => {
			this.resetToDefaults();
		});

		// Action buttons
		document.getElementById('groupTabsBtn').addEventListener('click', () => {
			this.executeAction('groupByDomain', 'Tabs grouped by domain!');
		});

		document.getElementById('regroupTabsBtn').addEventListener('click', () => {
			this.regroupTabs();
		});

		document.getElementById('removeDuplicatesBtn').addEventListener('click', () => {
			this.executeAction('removeDuplicates', 'Duplicate tabs removed!');
		});

		document.getElementById('expandAllBtn').addEventListener('click', () => {
			this.executeAction('expandAll', 'All groups expanded!');
		});

		document.getElementById('collapseAllBtn').addEventListener('click', () => {
			this.executeAction('collapseAll', 'All groups collapsed!');
		});

		document.getElementById('ungroupAllBtn').addEventListener('click', () => {
			this.executeAction('ungroupAll', 'All tabs ungrouped!');
		});
	}

	async executeAction(action, successMessage) {
		try {
			this.showStatus('Processing...', 'info');
			const response = await chrome.runtime.sendMessage({ action });

			if (response.success) {
				this.showStatus(successMessage, 'success');
			} else {
				this.showStatus(response.error || 'Action failed', 'error');
			}
		} catch (error) {
			console.error('Error executing action:', error);
			this.showStatus('Error occurred: ' + (error.message || 'Unknown error'), 'error');
		}
	}

	renderSettings() {
		document.getElementById('autoGroupToggle').checked =
			this.settings.autoGroup;
		document.getElementById('groupByDomainToggle').checked =
			this.settings.groupByDomain;
	}

	renderRules() {
		const container = document.getElementById('rulesContainer');
		container.innerHTML = '';

		this.settings.customRules.forEach((rule, index) => {
			const ruleElement = this.createRuleElement(rule, index);
			container.appendChild(ruleElement);
		});
	}

	createRuleElement(rule, index) {
		const ruleDiv = document.createElement('div');
		ruleDiv.className = 'rule-item';
		ruleDiv.setAttribute('data-rule-index', index);

		ruleDiv.innerHTML = `
      <div class="rule-header">
        <div>
          <label>
            <input type="checkbox" ${
							rule.enabled ? 'checked' : ''
						} class="rule-enabled-checkbox">
            Rule ${index + 1}
          </label>
        </div>
        <button class="button danger rule-delete-btn">Delete</button>
      </div>
      <div class="rule-inputs">
        <select class="select-field rule-condition-select">
          <option value="url" ${
						rule.condition === 'url' ? 'selected' : ''
					}>URL contains</option>
          <option value="hostname" ${
						rule.condition === 'hostname' ? 'selected' : ''
					}>Hostname contains</option>
          <option value="title" ${
						rule.condition === 'title' ? 'selected' : ''
					}>Title contains</option>
        </select>
        <input 
          type="text" 
          class="input-field rule-value-input" 
          placeholder="Enter pattern..."
          value="${rule.value || ''}"
        >
        <div style="display: flex; gap: 10px; align-items: center;">
          <select class="select-field rule-color-select" style="flex: 1;">
            ${Object.keys(this.colorOptions)
							.map(
								(color) =>
									`<option value="${color}" ${
										rule.color === color ? 'selected' : ''
									}>${color}</option>`
							)
							.join('')}
          </select>
          <div 
            class="rule-color-preview"
            style="width: 20px; height: 20px; border-radius: 4px; background: ${
							this.colorOptions[rule.color] || '#9ca3af'
						};"
          ></div>
        </div>
      </div>
      <div style="margin-top: 10px;">
        <input 
          type="text" 
          class="input-field rule-groupname-input" 
          placeholder="Group name..."
          value="${rule.groupName || ''}"
          style="width: 100%;"
        >
      </div>
    `;

		// Add event listeners to the created elements
		this.attachRuleEventListeners(ruleDiv, index);

		return ruleDiv;
	}

	attachRuleEventListeners(ruleElement, index) {
		// Enable/disable checkbox
		const enabledCheckbox = ruleElement.querySelector('.rule-enabled-checkbox');
		enabledCheckbox.addEventListener('change', (e) => {
			this.toggleRule(index);
		});

		// Delete button
		const deleteBtn = ruleElement.querySelector('.rule-delete-btn');
		deleteBtn.addEventListener('click', (e) => {
			e.preventDefault();
			this.removeRule(index);
		});

		// Condition select
		const conditionSelect = ruleElement.querySelector('.rule-condition-select');
		conditionSelect.addEventListener('change', (e) => {
			this.updateRule(index, 'condition', e.target.value);
		});

		// Value input
		const valueInput = ruleElement.querySelector('.rule-value-input');
		valueInput.addEventListener('input', (e) => {
			this.updateRule(index, 'value', e.target.value);
		});

		// Color select
		const colorSelect = ruleElement.querySelector('.rule-color-select');
		colorSelect.addEventListener('change', (e) => {
			this.updateRule(index, 'color', e.target.value);
		});

		// Group name input
		const groupNameInput = ruleElement.querySelector('.rule-groupname-input');
		groupNameInput.addEventListener('input', (e) => {
			this.updateRule(index, 'groupName', e.target.value);
		});
	}

	addNewRule() {
		const newRule = {
			enabled: true,
			condition: 'url',
			value: '',
			groupName: '',
			color: 'blue',
		};

		this.settings.customRules.push(newRule);
		this.renderRules();
		// Don't save settings automatically - let user save when ready
	}

	removeRule(index) {
		if (confirm(`Are you sure you want to delete Rule ${index + 1}?`)) {
			this.settings.customRules.splice(index, 1);
			this.renderRules();
			// Don't save settings automatically - let user save when ready
			this.showStatus('Rule deleted successfully!', 'success');
		}
	}

	toggleRule(index) {
		if (this.settings.customRules[index]) {
			this.settings.customRules[index].enabled =
				!this.settings.customRules[index].enabled;
			const status = this.settings.customRules[index].enabled
				? 'enabled'
				: 'disabled';
			this.showStatus(`Rule ${index + 1} ${status}!`, 'success');
			// Don't save settings automatically - let user save when ready
		}
	}

	updateRule(index, property, value) {
		if (this.settings.customRules[index]) {
			this.settings.customRules[index][property] = value;

			// Update color preview if color changed
			if (property === 'color') {
				const ruleElement = document.querySelector(
					`[data-rule-index="${index}"]`
				);
				if (ruleElement) {
					const colorPreview = ruleElement.querySelector('.rule-color-preview');
					if (colorPreview) {
						colorPreview.style.background =
							this.colorOptions[value] || '#9ca3af';
					}
				}
			}
			
			// Don't save settings automatically - let user save when ready
		}
	}

	async resetToDefaults() {
		if (
			confirm(
				'Are you sure you want to reset all settings to defaults? This will remove all custom rules.'
			)
		) {
			this.settings = {
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

			this.renderSettings();
			this.renderRules();
			this.showStatus('Settings reset to defaults!', 'success');
		}
	}

	showStatus(message, type) {
		const statusDiv = document.getElementById('saveStatus');
		statusDiv.textContent = message;
		statusDiv.className = `save-status ${type}`;

		setTimeout(() => {
			statusDiv.className = 'save-status';
		}, 3000);
	}
}

// Initialize the options manager when the page loads
let optionsManager;
document.addEventListener('DOMContentLoaded', () => {
	optionsManager = new OptionsManager();
});
